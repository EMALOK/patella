import { Bracket, BracketRound, Match, MatchStatus, Shot, ShotInput, Tournament, TournamentStatus, User } from './types';

export const BOARD_CUP_COUNT = 10;
export const NUM_DRINK_THRESHOLD = 4;

export function createId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function shuffle<T>(values: T[]): T[] {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export function findUser(users: User[], userId: string): User | undefined {
  return users.find((user) => user.id === userId);
}

export function getUsername(users: User[], userId: string | null): string {
  if (!userId) {
    return 'BYE';
  }
  return findUser(users, userId)?.username ?? userId;
}

export function generateInitialBracket(participants: string[]): Bracket {
  const shuffled = shuffle(participants);
  const matches: Match[] = [];
  const autoAdvancers: string[] = [];

  for (let index = 0; index < shuffled.length; index += 2) {
    const playerAId = shuffled[index];
    const playerBId = shuffled[index + 1] ?? null;

    if (!playerBId) {
      autoAdvancers.push(playerAId);
      continue;
    }

    matches.push({
      id: createId('m1'),
      round: 1,
      playerAId,
      playerBId,
      scoreA: 0,
      scoreB: 0,
      shots: [],
      winnerId: null,
      status: 'PENDING',
      disqualifiedPlayerId: null,
    });
  }

  return {
    rounds: [
      {
        id: createId('r1'),
        roundNumber: 1,
        matches,
        autoAdvancers,
      },
    ],
    winnerId: null,
  };
}

function buildRound(roundNumber: number, contenders: string[]): BracketRound {
  const matches: Match[] = [];
  const autoAdvancers: string[] = [];

  for (let index = 0; index < contenders.length; index += 2) {
    const playerAId = contenders[index];
    const playerBId = contenders[index + 1] ?? null;

    if (!playerBId) {
      autoAdvancers.push(playerAId);
      continue;
    }

    matches.push({
      id: createId(`m${roundNumber}`),
      round: roundNumber,
      playerAId,
      playerBId,
      scoreA: 0,
      scoreB: 0,
      shots: [],
      winnerId: null,
      status: 'PENDING',
      disqualifiedPlayerId: null,
    });
  }

  return {
    id: createId(`r${roundNumber}`),
    roundNumber,
    matches,
    autoAdvancers,
  };
}

export function updateMatchWithShot(
  match: Match,
  shotInput: ShotInput,
  drinkLimit: number = NUM_DRINK_THRESHOLD,
  shooterDrinkCount: number = 0,
  drinkingPlayerId: string | null = null,
  drinkingPlayerCount: number = 0
): Match {
  if (match.status === 'COMPLETED' || !match.playerBId) {
    return match;
  }

  const alcoholLevel = shooterDrinkCount;
  const preShotState = {
    scoreA: match.scoreA,
    scoreB: match.scoreB,
    winnerId: match.winnerId,
    status: match.status,
  };

  const shot: Shot = {
    id: createId('shot'),
    shooterId: shotInput.shooterId,
    alcoholLevel,
    result: {
      kind: shotInput.outcome,
      ...(shotInput.outcome === 'HIT' && shotInput.cupId ? { cupId: shotInput.cupId } : {}),
    },
    preShotState,
    createdAt: new Date().toISOString(),
  };

  let scoreA = match.scoreA;
  let scoreB = match.scoreB;
  let winnerId = match.winnerId;
  let disqualifiedPlayerId = match.disqualifiedPlayerId;
  let status: MatchStatus = 'IN_PROGRESS';

  const cupsHitByA = new Set(
    match.shots
      .filter((existingShot) => existingShot.result.kind === 'HIT' && existingShot.shooterId === match.playerAId && existingShot.result.cupId)
      .map((existingShot) => existingShot.result.cupId as string)
  );

  const cupsHitByB = new Set(
    match.shots
      .filter((existingShot) => existingShot.result.kind === 'HIT' && existingShot.shooterId === match.playerBId && existingShot.result.cupId)
      .map((existingShot) => existingShot.result.cupId as string)
  );

  if (shotInput.outcome === 'HIT' && shotInput.cupId) {
    if (shotInput.shooterId === match.playerAId) {
      cupsHitByA.add(shotInput.cupId);
    } else {
      cupsHitByB.add(shotInput.cupId);
    }
  }

  scoreA = cupsHitByA.size;
  scoreB = cupsHitByB.size;

  if (drinkingPlayerId && drinkingPlayerCount > drinkLimit) {
    disqualifiedPlayerId = drinkingPlayerId;
    winnerId = drinkingPlayerId === match.playerAId ? match.playerBId : match.playerAId;
    status = 'COMPLETED';
  } else if (scoreA >= BOARD_CUP_COUNT) {
    winnerId = match.playerAId;
    status = 'COMPLETED';
  } else if (scoreB >= BOARD_CUP_COUNT) {
    winnerId = match.playerBId;
    status = 'COMPLETED';
  }

  return {
    ...match,
    scoreA,
    scoreB,
    shots: [...match.shots, shot],
    winnerId,
    status,
    disqualifiedPlayerId,
  };
}

export function updateBracketAfterMatch(tournament: Tournament, matchId: string): Tournament {
  if (!tournament.bracket) {
    return tournament;
  }

  const rounds = tournament.bracket.rounds.map((round) => ({
    ...round,
    matches: round.matches.map((match) => ({ ...match })),
    autoAdvancers: [...round.autoAdvancers],
  }));

  const roundIndex = rounds.findIndex((round) => round.matches.some((match) => match.id === matchId));
  if (roundIndex < 0) {
    return tournament;
  }

  const round = rounds[roundIndex];
  const isRoundComplete = round.matches.every((match) => match.winnerId !== null);
  if (!isRoundComplete) {
    return {
      ...tournament,
      bracket: {
        rounds,
        winnerId: tournament.bracket.winnerId,
      },
    };
  }

  const winners = [
    ...round.matches.map((match) => match.winnerId).filter((winnerId): winnerId is string => Boolean(winnerId)),
    ...round.autoAdvancers,
  ];

  if (winners.length === 1) {
    return {
      ...tournament,
      status: 'COMPLETED',
      bracket: {
        rounds,
        winnerId: winners[0],
      },
    };
  }

  const nextRound = buildRound(round.roundNumber + 1, winners);
  const updatedRounds = [...rounds.slice(0, roundIndex + 1), nextRound];

  return {
    ...tournament,
    bracket: {
      rounds: updatedRounds,
      winnerId: null,
    },
  };
}

export function findTournamentMatch(tournament: Tournament, matchId: string): Match | null {
  const bracket = tournament.bracket;
  if (!bracket) {
    return null;
  }

  for (const round of bracket.rounds) {
    const match = round.matches.find((currentMatch) => currentMatch.id === matchId);
    if (match) {
      return match;
    }
  }

  return null;
}

export function updateTournamentMatch(tournament: Tournament, matchId: string, shotInput: ShotInput): Tournament {
  if (!tournament.bracket) {
    return tournament;
  }

  const currentMatch = findTournamentMatch(tournament, matchId);
  if (!currentMatch || currentMatch.status === 'COMPLETED' || !currentMatch.playerBId) {
    return tournament;
  }

  const shooterDrinkCount = tournament.drinkCountByUser[shotInput.shooterId] ?? 0;

  let drinkingPlayerId: string | null = null;
  let drinkingPlayerCount = 0;
  let nextDrinkCountByUser = tournament.drinkCountByUser;

  if (shotInput.outcome === 'HIT') {
    const opponentId = shotInput.shooterId === currentMatch.playerAId ? currentMatch.playerBId : currentMatch.playerAId;

    if (opponentId) {
      drinkingPlayerId = opponentId;
      drinkingPlayerCount = (tournament.drinkCountByUser[opponentId] ?? 0) + 1;
      nextDrinkCountByUser = {
        ...tournament.drinkCountByUser,
        [opponentId]: drinkingPlayerCount,
      };
    }
  }

  const nextRounds = tournament.bracket.rounds.map((round) => ({
    ...round,
    matches: round.matches.map((match) => (
      match.id === matchId
        ? updateMatchWithShot(
            match,
            shotInput,
            tournament.drinkLimit,
            shooterDrinkCount,
            drinkingPlayerId,
            drinkingPlayerCount
          )
        : match
    )),
    autoAdvancers: [...round.autoAdvancers],
  }));

  const updatedTournament: Tournament = {
    ...tournament,
    drinkCountByUser: nextDrinkCountByUser,
    bracket: {
      rounds: nextRounds,
      winnerId: tournament.bracket.winnerId,
    },
  };

  return updateBracketAfterMatch(updatedTournament, matchId);
}

export function updateUsersAfterMatch(users: User[], match: Match): User[] {
  if (!match.winnerId || !match.playerBId) {
    return users;
  }

  const ELO_DELTA = 25;

  return users.map((user) => {
    if (user.id === match.playerAId || user.id === match.playerBId) {
      const isWinner = user.id === match.winnerId;
      return {
        ...user,
        stats: {
          elo: Math.max(0, user.stats.elo + (isWinner ? ELO_DELTA : -ELO_DELTA)),
        },
      };
    }

    return user;
  });
}

export function createTournamentTemplate(name: string, location: string, date: string, organizerId: string, drinkLimit: number = 20): Tournament {
  return {
    id: createId('tour'),
    name,
    location,
    date,
    organizerId,
    status: 'OPEN',
    participants: [],
    bracket: null,
    drinkLimit,
    bannedUsers: [],
    drinkCountByUser: {},
  };
}

export function generateBracketForTournament(tournament: Tournament): Tournament {
  if (tournament.status !== 'OPEN' || tournament.participants.length < 2) {
    return tournament;
  }

  const bracket = generateInitialBracket(tournament.participants);
  const winnerId = bracket.rounds[0].matches.length === 0 && bracket.rounds[0].autoAdvancers.length === 1 ? bracket.rounds[0].autoAdvancers[0] : null;

  return {
    ...tournament,
    status: winnerId ? 'COMPLETED' : 'IN_PROGRESS',
    bracket: {
      rounds: bracket.rounds,
      winnerId,
    },
  };
}