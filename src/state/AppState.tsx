import { createContext, ReactNode, useContext, useReducer } from 'react';
import { initialState } from '../mockData';
import { createTournamentTemplate, findTournamentMatch, generateBracketForTournament, updateTournamentMatch, updateUsersAfterMatch } from '../logic';
import { AppState, ShotInput, ViewName } from '../types';

type Action =
  | { type: 'SET_CURRENT_USER'; userId: string }
  | { type: 'SET_VIEW'; view: ViewName; tournamentId?: string | null; matchId?: string | null; userId?: string | null }
  | { type: 'GO_BACK' }
  | { type: 'OPEN_USER'; userId: string }
  | { type: 'CREATE_TOURNAMENT'; name: string; location: string; date: string; drinkLimit: number; maxParticipants: number }
  | { type: 'UPDATE_TOURNAMENT'; tournamentId: string; name: string; location: string; date: string; drinkLimit: number; maxParticipants: number }
  | { type: 'DELETE_TOURNAMENT'; tournamentId: string }
  | { type: 'ENROLL_TOURNAMENT'; tournamentId: string }
  | { type: 'UNENROLL_TOURNAMENT'; tournamentId: string }
  | { type: 'GENERATE_BRACKET'; tournamentId: string }
  | { type: 'RECORD_SHOT'; tournamentId: string; matchId: string; shotInput: ShotInput }
  | { type: 'OPEN_TOURNAMENT'; tournamentId: string }
  | { type: 'OPEN_MATCH'; tournamentId: string; matchId: string }
  | { type: 'UPDATE_USER_PROFILE'; userId: string; username: string }
  | { type: 'BAN_USER'; tournamentId: string; userId: string };

const AppStateContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | null>(null);

const VIEW_LABELS: Record<ViewName, string> = {
  home: 'Home',
  'manage-user': 'Gestisci Utente',
  users: 'Utenti',
  user: 'Profilo utente',
  matches: 'Partite',
  match: 'Dettaglio partita',
  tournaments: 'Tornei',
  tournament: 'Dettaglio torneo',
  'my-tournaments': 'I Miei Tornei',
  create: 'Crea Torneo',
  'manage-tournament': 'Gestisci Torneo',
  'manage-match': 'Gestisci Partita',
};

export function getBackDestination(state: AppState): ViewName | null {
  switch (state.currentView) {
    case 'home':
      return 'tournaments';
    case 'manage-user':
      return 'home';
    case 'users':
      return 'home';
    case 'user':
      return state.selectedUserId && state.selectedUserId !== state.currentUserId ? 'users' : 'manage-user';
    case 'matches':
      return 'home';
    case 'match':
      return state.selectedTournamentId ? 'tournament' : 'matches';
    case 'manage-match':
      return state.selectedMatchId ? 'match' : state.selectedTournamentId ? 'tournament' : 'matches';
    case 'tournaments':
      return 'home';
    case 'tournament': {
      const selectedTournament = state.tournaments.find((entry) => entry.id === state.selectedTournamentId);
      const isOrganizer = selectedTournament?.organizerId === state.currentUserId;
      return isOrganizer ? 'my-tournaments' : 'tournaments';
    }
    case 'my-tournaments':
      return 'home';
    case 'create':
      return 'my-tournaments';
    case 'manage-tournament':
      return 'tournament';
    default:
      return null;
  }
}

export function getBackButtonLabel(state: AppState): string {
  const destination = getBackDestination(state);
  if (!destination) {
    return 'Back';
  }

  return `Torna a ${VIEW_LABELS[destination]}`;
}

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
        selectedUserId: action.userId ?? state.selectedUserId,
      };
    case 'GO_BACK': {
      const destination = getBackDestination(state);
      if (!destination) {
        return state;
      }

      if (state.currentView === 'home') {
        return {
          ...state,
          currentView: destination,
          selectedUserId: null,
        };
      }

      if (state.currentView === 'manage-user') {
        return {
          ...state,
          currentView: destination,
          selectedUserId: state.currentUserId,
        };
      }

      return {
        ...state,
        currentView: destination,
      };
    }
    case 'OPEN_USER':
      return {
        ...state,
        currentView: 'user',
        selectedUserId: action.userId,
        selectedTournamentId: null,
        selectedMatchId: null,
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
      const tournament = createTournamentTemplate(action.name, action.location, action.date, state.currentUserId, action.drinkLimit, action.maxParticipants);
      return {
        ...state,
        tournaments: [tournament, ...state.tournaments],
        currentView: 'tournament',
        selectedTournamentId: tournament.id,
        selectedMatchId: null,
        selectedUserId: null,
      };
    }
    case 'UPDATE_TOURNAMENT': {
      const tournaments = state.tournaments.map((tournament) => {
        if (tournament.id !== action.tournamentId) {
          return tournament;
        }

        return {
          ...tournament,
          name: action.name,
          location: action.location,
          date: action.date,
          drinkLimit: action.drinkLimit,
          maxParticipants: action.maxParticipants,
        };
      });

      return {
        ...state,
        tournaments,
        currentView: 'tournament',
        selectedTournamentId: action.tournamentId,
      };
    }
    case 'DELETE_TOURNAMENT': {
      const tournaments = state.tournaments.filter((tournament) => tournament.id !== action.tournamentId);

      return {
        ...state,
        tournaments,
        currentView: 'tournaments',
        selectedTournamentId: null,
        selectedMatchId: null,
        selectedUserId: null,
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
    case 'UPDATE_USER_PROFILE': {
      return {
        ...state,
        users: state.users.map((user) => (user.id === action.userId ? { ...user, username: action.username } : user)),
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
    setView: (view: ViewName, tournamentId?: string | null, matchId?: string | null, userId?: string | null) => dispatch({ type: 'SET_VIEW', view, tournamentId, matchId, userId }),
    goBack: () => dispatch({ type: 'GO_BACK' }),
    openUser: (userId: string) => dispatch({ type: 'OPEN_USER', userId }),
    openTournament: (tournamentId: string) => dispatch({ type: 'OPEN_TOURNAMENT', tournamentId }),
    openMatch: (tournamentId: string, matchId: string) => dispatch({ type: 'OPEN_MATCH', tournamentId, matchId }),
    createTournament: (name: string, location: string, date: string, drinkLimit: number, maxParticipants: number) => dispatch({ type: 'CREATE_TOURNAMENT', name, location, date, drinkLimit, maxParticipants }),
    updateTournament: (tournamentId: string, name: string, location: string, date: string, drinkLimit: number, maxParticipants: number) => dispatch({ type: 'UPDATE_TOURNAMENT', tournamentId, name, location, date, drinkLimit, maxParticipants }),
    deleteTournament: (tournamentId: string) => dispatch({ type: 'DELETE_TOURNAMENT', tournamentId }),
    enrollTournament: (tournamentId: string) => dispatch({ type: 'ENROLL_TOURNAMENT', tournamentId }),
    unenrollTournament: (tournamentId: string) => dispatch({ type: 'UNENROLL_TOURNAMENT', tournamentId }),
    generateBracket: (tournamentId: string) => dispatch({ type: 'GENERATE_BRACKET', tournamentId }),
    recordShot: (tournamentId: string, matchId: string, shotInput: ShotInput) => dispatch({ type: 'RECORD_SHOT', tournamentId, matchId, shotInput }),
    updateCurrentUser: (userId: string, username: string) => dispatch({ type: 'UPDATE_USER_PROFILE', userId, username }),
    banUser: (tournamentId: string, userId: string) => dispatch({ type: 'BAN_USER', tournamentId, userId }),
  };
}