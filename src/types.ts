export type TournamentStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
export type MatchStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type ViewName = 'dashboard' | 'profile' | 'create' | 'tournament' | 'match';

export interface UserStats {
  elo: number;
}

export interface User {
  id: string;
  username: string;
  stats: UserStats;
}

export interface ShotSnapshot {
  scoreA: number;
  scoreB: number;
  winnerId: string | null;
  status: MatchStatus;
}

export interface ShotResult {
  kind: 'HIT' | 'MISS';
  cupId?: string;
}

export interface Shot {
  id: string;
  shooterId: string;
  alcoholLevel: number;
  result: ShotResult;
  preShotState: ShotSnapshot;
  createdAt: string;
}

export interface Match {
  id: string;
  round: number;
  playerAId: string;
  playerBId: string | null;
  scoreA: number;
  scoreB: number;
  shots: Shot[];
  winnerId: string | null;
  status: MatchStatus;
  disqualifiedPlayerId: string | null;
}

export interface BracketRound {
  id: string;
  roundNumber: number;
  matches: Match[];
  autoAdvancers: string[];
}

export interface Bracket {
  rounds: BracketRound[];
  winnerId: string | null;
}

export interface Tournament {
  id: string;
  name: string;
  location: string;
  date: string;
  organizerId: string;
  status: TournamentStatus;
  participants: string[];
  bracket: Bracket | null;
  drinkLimit: number;
  bannedUsers: string[];
  drinkCountByUser: Record<string, number>;
}

export interface AppState {
  currentUserId: string;
  users: User[];
  tournaments: Tournament[];
  currentView: ViewName;
  selectedTournamentId: string | null;
  selectedMatchId: string | null;
}

export interface ShotInput {
  shooterId: string;
  outcome: 'HIT' | 'MISS';
  cupId?: string;
}