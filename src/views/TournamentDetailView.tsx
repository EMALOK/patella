import { useAppActions, useAppState } from '../state/AppState';
import { getUsername } from '../logic';
import { MatchCard } from '../components/MatchCard';

export function TournamentDetailView() {
  const { state } = useAppState();
  const actions = useAppActions();
  const tournament = state.tournaments.find((entry) => entry.id === state.selectedTournamentId);

  if (!tournament) {
    return (
      <section className="page-panel">
        <p className="muted">Select a tournament from the dashboard.</p>
      </section>
    );
  }

  const isOrganizer = tournament.organizerId === state.currentUserId;
  const tournamentId = tournament.id;
  const currentUserIsParticipant = tournament.participants.includes(state.currentUserId);
  const canEnroll = tournament.status === 'OPEN' && !isOrganizer && !currentUserIsParticipant && !tournament.bannedUsers.includes(state.currentUserId);
  const canUnsubscribe = tournament.status === 'OPEN' && currentUserIsParticipant;
  const canBan = isOrganizer && tournament.status === 'OPEN';

  return (
    <section className="page-panel">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Tournament detail</p>
          <h2>{tournament.name}</h2>
          <p className="muted">{tournament.location} · {tournament.date} · Drink Limit: {tournament.drinkLimit}</p>
        </div>
        <div className="card-actions">
          <button type="button" className="secondary-button" onClick={() => actions.setView('dashboard')}>Back</button>
          {canEnroll ? (
            <button type="button" className="primary-button" onClick={() => actions.enrollTournament(tournamentId)}>
              Enroll
            </button>
          ) : null}
          {canUnsubscribe ? (
            <button type="button" className="secondary-button" onClick={() => actions.unenrollTournament(tournamentId)}>
              Unsubscribe
            </button>
          ) : null}
          {tournament.status === 'OPEN' && isOrganizer ? (
            <button type="button" className="primary-button" onClick={() => actions.generateBracket(tournamentId)}>
              Close enrollments & generate bracket
            </button>
          ) : null}
        </div>
      </div>

      <div className="detail-grid triple">
        <article className="detail-card">
          <h3>Participants ({tournament.participants.length})</h3>
          <ul className="stack-list">
            {tournament.participants.map((participantId) => (
              <li key={participantId} className="participant-row">
                <div className="participant-meta">
                  <span>{getUsername(state.users, participantId)}</span>
                  <span className="drink-count-badge">Drinks: {tournament.drinkCountByUser[participantId] ?? 0}</span>
                </div>
                {canBan && participantId !== tournament.organizerId && (
                  <button 
                    type="button" 
                    className="danger-button small"
                    onClick={() => actions.banUser(tournamentId, participantId)}
                  >
                    Ban
                  </button>
                )}
              </li>
            ))}
            {!tournament.participants.length ? <li className="muted">No participants yet</li> : null}
          </ul>
        </article>

        {isOrganizer && tournament.bannedUsers.length > 0 && (
          <article className="detail-card">
            <h3>Banned Users ({tournament.bannedUsers.length})</h3>
            <ul className="stack-list banned-list">
              {tournament.bannedUsers.map((bannedUserId) => (
                <li key={bannedUserId} className="danger-text">{getUsername(state.users, bannedUserId)}</li>
              ))}
            </ul>
          </article>
        )}

        <article className="detail-card">
          <h3>Tournament Info</h3>
          <div className="info-stack">
            <div className="info-row">
              <span className="label">Organizer:</span>
              <span>{getUsername(state.users, tournament.organizerId)}</span>
            </div>
            <div className="info-row">
              <span className="label">Status:</span>
              <span className="badge">{tournament.status}</span>
            </div>
            <div className="info-row">
              <span className="label">Banning:</span>
              <span>{tournament.status === 'OPEN' ? 'Enabled' : 'Disabled after start'}</span>
            </div>
            <div className="info-row">
              <span className="label">Drink Limit:</span>
              <span>{tournament.drinkLimit} cups</span>
            </div>
            {tournament.bracket?.winnerId && (
              <div className="info-row">
                <span className="label">Winner:</span>
                <span className="success">{getUsername(state.users, tournament.bracket.winnerId)}</span>
              </div>
            )}
          </div>
        </article>
      </div>

      <article className="detail-card full-width">
        <h3>Bracket Visualization</h3>
        {tournament.bracket ? (
          <div className="bracket-container">
            {tournament.bracket.rounds.map((round) => (
              <section className="round-column" key={round.id}>
                <div className="round-header">Round {round.roundNumber}</div>
                {round.autoAdvancers.length > 0 && (
                  <div className="auto-advancer-note">Auto-advance: {round.autoAdvancers.map((id) => getUsername(state.users, id)).join(', ')}</div>
                )}
                <div className="match-stack">
                  {round.matches.length ? (
                    round.matches.map((match) => <MatchCard key={match.id} tournamentId={tournament.id} match={match} />)
                  ) : (
                    <p className="muted">Waiting for the previous round to complete.</p>
                  )}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <p className="muted">Generate the bracket to begin the tournament.</p>
        )}
      </article>
    </section>
  );
}