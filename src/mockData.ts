import { updateUsersAfterMatch } from './logic';
import { AppState, BracketRound, Match, MatchStatus, Shot, Tournament, User } from './types';

const BOARD_CUPS = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10'];

type PlayerSeed = {
  id: string;
  username: string;
  skill: number;
};

const basePlayers: PlayerSeed[] = [
  { id: 'user_1', username: 'MarioBeer99', skill: 0.76 },
  { id: 'user_2', username: 'LuigiPong', skill: 0.72 },
  { id: 'user_3', username: 'Peach88', skill: 0.69 },
  { id: 'user_4', username: 'ToadDrinker', skill: 0.63 },
  { id: 'user_5', username: 'YoshiKing', skill: 0.67 },
  { id: 'user_6', username: 'DonkeyPong', skill: 0.61 },
  { id: 'user_7', username: 'KongCup', skill: 0.58 },
  { id: 'user_8', username: 'WarioBrew', skill: 0.55 },
];

const venueNames = [
  'Bar Centrale',
  'Dockside Taproom',
  'Campus Cellar',
  'Neon Barrel',
  'Old Mill Pub',
  'Arena Lounge',
  'Riverside Social',
  'Copper Cup House',
];

const tournamentNames = [
  'Night Shift Cup',
  'Zero Gravity Open',
  'Backroom Masters',
  'Friday Knockout',
  'High Table Classic',
  'Last Call League',
  'Red Cup Championship',
  'Marathon Bracket',
];

function mulberry32(seed: number) {
  let state = seed;
  return function random(): number {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function shuffleWithRandom<T>(values: T[], random: () => number): T[] {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function randomCup(available: Set<string>, random: () => number): string {
  const options = Array.from(available);
  return options[Math.floor(random() * options.length)];
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function createUsers(): User[] {
  return basePlayers.map((player) => ({
    id: player.id,
    username: player.username,
    stats: { elo: 900 },
  }));
}

type SimulatedMatch = {
  match: Match;
  winnerId: string;
  advancedTime: number;
};

function simulateCompletedMatch(
  matchId: string,
  round: number,
  playerAId: string,
  playerBId: string,
  users: User[],
  drinkCountByUser: Record<string, number>,
  drinkLimit: number,
  formByPlayer: Record<string, number>,
  random: () => number,
  timestampMs: number
): SimulatedMatch {
  const cupsHitByA = new Set<string>();
  const cupsHitByB = new Set<string>();
  const shots: Shot[] = [];
  let shooterId = random() < 0.5 ? playerAId : playerBId;
  let winnerId: string | null = null;
  let disqualifiedPlayerId: string | null = null;
  let status: MatchStatus = 'IN_PROGRESS';
  let tick = timestampMs;

  const skillMap = Object.fromEntries(basePlayers.map((player) => [player.id, player.skill])) as Record<string, number>;

  while (!winnerId) {
    const defenderId = shooterId === playerAId ? playerBId : playerAId;
    const shooterElo = users.find((user) => user.id === shooterId)?.stats.elo ?? 900;
    const defenderElo = users.find((user) => user.id === defenderId)?.stats.elo ?? 900;
    const shooterSkill = (skillMap[shooterId] ?? 0.6) + (formByPlayer[shooterId] ?? 0);
    const defenderSkill = (skillMap[defenderId] ?? 0.6) + (formByPlayer[defenderId] ?? 0);
    const shooterDrinks = drinkCountByUser[shooterId] ?? 0;

    const eloEdge = (shooterElo - defenderElo) / 400;
    const fatiguePenalty = shooterDrinks * 0.0075;
    const pressureSwing = (random() - 0.5) * 0.2;
    const hitChance = clamp(0.43 + (shooterSkill - defenderSkill) * 0.28 + eloEdge * 0.03 - fatiguePenalty + pressureSwing, 0.22, 0.86);
    const isHit = random() < hitChance;

    const preShotScoreA = cupsHitByA.size;
    const preShotScoreB = cupsHitByB.size;
    const cupSet = shooterId === playerAId ? cupsHitByA : cupsHitByB;

    let cupId: string | undefined;
    if (isHit && cupSet.size < BOARD_CUPS.length) {
      const remaining = new Set(BOARD_CUPS.filter((cup) => !cupSet.has(cup)));
      cupId = randomCup(remaining, random);
      cupSet.add(cupId);
      drinkCountByUser[defenderId] = (drinkCountByUser[defenderId] ?? 0) + 1;
    }

    shots.push({
      id: `${matchId}_s${shots.length + 1}`,
      shooterId,
      alcoholLevel: shooterDrinks,
      result: isHit ? { kind: 'HIT', cupId } : { kind: 'MISS' },
      preShotState: {
        scoreA: preShotScoreA,
        scoreB: preShotScoreB,
        winnerId: null,
        status,
      },
      createdAt: new Date(tick).toISOString(),
    });

    tick += 20_000;

    if ((drinkCountByUser[defenderId] ?? 0) > drinkLimit) {
      winnerId = shooterId;
      disqualifiedPlayerId = defenderId;
      status = 'COMPLETED';
      break;
    }

    if (cupsHitByA.size >= BOARD_CUPS.length) {
      winnerId = playerAId;
      status = 'COMPLETED';
      break;
    }

    if (cupsHitByB.size >= BOARD_CUPS.length) {
      winnerId = playerBId;
      status = 'COMPLETED';
      break;
    }

    if (shots.length > 120) {
      winnerId = cupsHitByA.size >= cupsHitByB.size ? playerAId : playerBId;
      status = 'COMPLETED';
      break;
    }

    shooterId = defenderId;
  }

  return {
    match: {
      id: matchId,
      round,
      playerAId,
      playerBId,
      scoreA: cupsHitByA.size,
      scoreB: cupsHitByB.size,
      shots,
      winnerId,
      status,
      disqualifiedPlayerId,
    },
    winnerId,
    advancedTime: tick,
  };
}

function simulateHistoricalTournament(
  index: number,
  users: User[],
  date: Date,
  random: () => number,
  startTimestampMs: number
): { tournament: Tournament; users: User[]; nextTimestampMs: number } {
  const participants = shuffleWithRandom(basePlayers.map((player) => player.id), random);
  const organizerId = participants[index % participants.length];
  const drinkLimit = 16 + (index % 8);
  const drinkCountByUser: Record<string, number> = Object.fromEntries(participants.map((id) => [id, 0]));
  const formByPlayer: Record<string, number> = Object.fromEntries(
    participants.map((id) => [id, (random() - 0.5) * 0.24])
  );
  const rounds: BracketRound[] = [];
  let updatedUsers = users;
  let timestampMs = startTimestampMs;

  let contenders = [...participants];
  let roundNumber = 1;

  while (contenders.length > 1) {
    const matches: Match[] = [];
    const winners: string[] = [];

    for (let i = 0; i < contenders.length; i += 2) {
      const playerAId = contenders[i];
      const playerBId = contenders[i + 1];
      const matchId = `t${index + 1}_r${roundNumber}_m${i / 2 + 1}`;
      const simulated = simulateCompletedMatch(
        matchId,
        roundNumber,
        playerAId,
        playerBId,
        updatedUsers,
        drinkCountByUser,
        drinkLimit,
        formByPlayer,
        random,
        timestampMs
      );

      matches.push(simulated.match);
      winners.push(simulated.winnerId);
      updatedUsers = updateUsersAfterMatch(updatedUsers, simulated.match);
      timestampMs = simulated.advancedTime + 60_000;
    }

    rounds.push({
      id: `t${index + 1}_r${roundNumber}`,
      roundNumber,
      matches,
      autoAdvancers: [],
    });

    contenders = winners;
    roundNumber += 1;
  }

  const tournament: Tournament = {
    id: `history_${index + 1}`,
    name: `${tournamentNames[index % tournamentNames.length]} #${index + 1}`,
    location: venueNames[index % venueNames.length],
    date: toIsoDate(date),
    organizerId,
    status: 'COMPLETED',
    participants,
    bracket: {
      rounds,
      winnerId: contenders[0],
    },
    drinkLimit,
    bannedUsers: [],
    drinkCountByUser,
  };

  return {
    tournament,
    users: updatedUsers,
    nextTimestampMs: timestampMs + 3_600_000,
  };
}

function buildInitialState(): AppState {
  const random = mulberry32(20260619);
  const historyCount = 28;
  let users = createUsers();
  const historicalTournaments: Tournament[] = [];
  let clockMs = Date.UTC(2025, 0, 5, 19, 0, 0);

  for (let index = 0; index < historyCount; index += 1) {
    const date = new Date(Date.UTC(2025, 0, 5 + index * 7));
    const simulated = simulateHistoricalTournament(index, users, date, random, clockMs);
    historicalTournaments.push(simulated.tournament);
    users = simulated.users.map((user) => ({
      ...user,
      stats: {
        elo: Math.max(0, Math.round(900 + (user.stats.elo - 900) * 0.92)),
      },
    }));
    clockMs = simulated.nextTimestampMs;
  }

  const liveTournamentId = 'tour_live_1';
  const liveTournament: Tournament = {
    id: liveTournamentId,
    name: 'Torneo Estivo',
    location: 'Bar Centrale',
    date: '2026-07-01',
    organizerId: 'user_1',
    status: 'OPEN',
    participants: ['user_2', 'user_3', 'user_4'],
    bracket: null,
    drinkLimit: 20,
    bannedUsers: [],
    drinkCountByUser: {
      user_2: 0,
      user_3: 0,
      user_4: 0,
    },
  };

  return {
    currentUserId: 'user_1',
    users,
    tournaments: [liveTournament, ...historicalTournaments.reverse()],
    currentView: 'dashboard',
    selectedTournamentId: liveTournamentId,
    selectedMatchId: null,
  };
}

export const initialState: AppState = buildInitialState();
