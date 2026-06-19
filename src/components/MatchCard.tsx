import { Match } from '../types';
import { getUsername } from '../logic';
import { useAppActions, useAppState } from '../state/AppState';

export function MatchCard({ tournamentId, match }: { tournamentId: string; match: Match }) {
  const { state } = useAppState();
  const actions = useAppActions();
  const tournament = state.tournaments.find((entry) => entry.id === tournamentId);
  const canOpen = Boolean(tournament);
  const playerA = getUsername(state.users, match.playerAId);
  const playerB = getUsername(state.users, match.playerBId);

  return (
    <article className={`match-card ${match.status.toLowerCase()}`}>
      <div className="match-card-header">
        <strong>Match {match.id}</strong>
        <span>Round {match.round}</span>
      </div>
      <div className="match-card-body">
        <div className="versus-line">
          <span>{playerA}</span>
          <span className="versus-pill">VS</span>
          <span>{playerB}</span>
        </div>
        <div className="scoreline">{match.scoreA} - {match.scoreB}</div>
        <p className="muted">Status: {match.status}</p>
        {match.disqualifiedPlayerId ? <p className="danger">Disqualified: {getUsername(state.users, match.disqualifiedPlayerId)}</p> : null}
        {match.winnerId ? <p className="success">Winner: {getUsername(state.users, match.winnerId)}</p> : null}
      </div>
      <div className="card-actions">
        <button type="button" className="secondary-button" disabled={!canOpen} onClick={() => actions.openMatch(tournamentId, match.id)}>
          Open match
        </button>
      </div>
    </article>
  );
}