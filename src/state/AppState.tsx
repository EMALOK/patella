import { createContext, ReactNode, useContext, useReducer } from 'react';
import { initialState } from '../mockData';
import { createTournamentTemplate, findTournamentMatch, generateBracketForTournament, updateTournamentMatch, updateUsersAfterMatch } from '../logic';
import { AppState, ShotInput, ViewName } from '../types';

type Action =
  | { type: 'SET_CURRENT_USER'; userId: string }
  | { type: 'SET_VIEW'; view: ViewName; tournamentId?: string | null; matchId?: string | null }
  | { type: 'CREATE_TOURNAMENT'; name: string; location: string; date: string; drinkLimit: number }
  | { type: 'ENROLL_TOURNAMENT'; tournamentId: string }
  | { type: 'UNENROLL_TOURNAMENT'; tournamentId: string }
  | { type: 'GENERATE_BRACKET'; tournamentId: string }
  | { type: 'RECORD_SHOT'; tournamentId: string; matchId: string; shotInput: ShotInput }
  | { type: 'OPEN_TOURNAMENT'; tournamentId: string }
  | { type: 'OPEN_MATCH'; tournamentId: string; matchId: string }
  | { type: 'BAN_USER'; tournamentId: string; userId: string };

const AppStateContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | null>(null);

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_CURRENT_USER':
      return {
        ...state,
        currentUserId: action.userId,
      };
    case 'SET_VIEW':
      return {
        ...state,
        currentView: action.view,
        selectedTournamentId: action.tournamentId ?? state.selectedTournamentId,
        selectedMatchId: action.matchId ?? state.selectedMatchId,
      };
    case 'OPEN_TOURNAMENT':
      return {
        ...state,
        currentView: 'tournament',
        selectedTournamentId: action.tournamentId,
        selectedMatchId: null,
      };
    case 'OPEN_MATCH':
      return {
        ...state,
        currentView: 'match',
        selectedTournamentId: action.tournamentId,
        selectedMatchId: action.matchId,
      };
    case 'CREATE_TOURNAMENT': {
      const tournament = createTournamentTemplate(action.name, action.location, action.date, state.currentUserId, action.drinkLimit);
      return {
        ...state,
        tournaments: [tournament, ...state.tournaments],
        currentView: 'dashboard',
        selectedTournamentId: tournament.id,
        selectedMatchId: null,
      };
    }
    case 'ENROLL_TOURNAMENT': {
      const tournaments = state.tournaments.map((tournament) => {
        if (tournament.id !== action.tournamentId) {
          return tournament;
        }

        if (tournament.participants.includes(state.currentUserId) || tournament.status !== 'OPEN' || tournament.bannedUsers.includes(state.currentUserId)) {
          return tournament;
        }

        return {
          ...tournament,
          participants: [...tournament.participants, state.currentUserId],
          drinkCountByUser: {
            ...tournament.drinkCountByUser,
            [state.currentUserId]: tournament.drinkCountByUser[state.currentUserId] ?? 0,
          },
        };
      });

      return { ...state, tournaments };
    }
    case 'UNENROLL_TOURNAMENT': {
      const tournaments = state.tournaments.map((tournament) => {
        if (tournament.id !== action.tournamentId) {
          return tournament;
        }

        if (tournament.status !== 'OPEN') {
          return tournament;
        }

        return {
          ...tournament,
          participants: tournament.participants.filter((participantId) => participantId !== state.currentUserId),
          drinkCountByUser: Object.fromEntries(
            Object.entries(tournament.drinkCountByUser).filter(([userId]) => userId !== state.currentUserId)
          ),
        };
      });

      return { ...state, tournaments };
    }
    case 'GENERATE_BRACKET': {
      const tournaments = state.tournaments.map((tournament) => {
        if (tournament.id !== action.tournamentId) {
          return tournament;
        }

        return generateBracketForTournament(tournament);
      });

      return { ...state, tournaments };
    }
    case 'RECORD_SHOT': {
      const tournaments = state.tournaments.map((tournament) => {
        if (tournament.id !== action.tournamentId) {
          return tournament;
        }

        return updateTournamentMatch(tournament, action.matchId, action.shotInput);
      });

      const updatedTournament = tournaments.find((tournament) => tournament.id === action.tournamentId);
      const match = updatedTournament ? findTournamentMatch(updatedTournament, action.matchId) : null;

      return {
        ...state,
        tournaments,
        users: match ? updateUsersAfterMatch(state.users, match) : state.users,
      };
    }
    case 'BAN_USER': {
      const tournaments = state.tournaments.map((tournament) => {
        if (tournament.id !== action.tournamentId) {
          return tournament;
        }

        if (tournament.status !== 'OPEN' || tournament.organizerId === action.userId || tournament.bannedUsers.includes(action.userId)) {
          return tournament;
        }

        return {
          ...tournament,
          bannedUsers: [...tournament.bannedUsers, action.userId],
          participants: tournament.participants.filter((pid) => pid !== action.userId),
          drinkCountByUser: Object.fromEntries(
            Object.entries(tournament.drinkCountByUser).filter(([userId]) => userId !== action.userId)
          ),
        };
      });

      return { ...state, tournaments };
    }
    default:
      return state;
  }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  return <AppStateContext.Provider value={{ state, dispatch }}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
}

export function useAppActions() {
  const { dispatch } = useAppState();

  return {
    setCurrentUser: (userId: string) => dispatch({ type: 'SET_CURRENT_USER', userId }),
    setView: (view: ViewName, tournamentId?: string | null, matchId?: string | null) => dispatch({ type: 'SET_VIEW', view, tournamentId, matchId }),
    openTournament: (tournamentId: string) => dispatch({ type: 'OPEN_TOURNAMENT', tournamentId }),
    openMatch: (tournamentId: string, matchId: string) => dispatch({ type: 'OPEN_MATCH', tournamentId, matchId }),
    createTournament: (name: string, location: string, date: string, drinkLimit: number) => dispatch({ type: 'CREATE_TOURNAMENT', name, location, date, drinkLimit }),
    enrollTournament: (tournamentId: string) => dispatch({ type: 'ENROLL_TOURNAMENT', tournamentId }),
    unenrollTournament: (tournamentId: string) => dispatch({ type: 'UNENROLL_TOURNAMENT', tournamentId }),
    generateBracket: (tournamentId: string) => dispatch({ type: 'GENERATE_BRACKET', tournamentId }),
    recordShot: (tournamentId: string, matchId: string, shotInput: ShotInput) => dispatch({ type: 'RECORD_SHOT', tournamentId, matchId, shotInput }),
    banUser: (tournamentId: string, userId: string) => dispatch({ type: 'BAN_USER', tournamentId, userId }),
  };
}