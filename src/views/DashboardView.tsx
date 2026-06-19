import { useAppActions, useAppState } from '../state/AppState';
import { getUsername } from '../logic';

export function DashboardView() {
  const { state } = useAppState();
  const actions = useAppActions();

  return (
    <section className="page-panel">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h2>Tournaments</h2>
        </div>
        <button type="button" className="primary-button" onClick={() => actions.setView('create')}>
          New tournament
        </button>
      </div>

      <div className="grid-cards">
        {state.tournaments.map((tournament) => {
          const organizerName = getUsername(state.users, tournament.organizerId);
          const isOrganizer = tournament.organizerId === state.currentUserId;
          const winnerName = tournament.bracket?.winnerId ? getUsername(state.users, tournament.bracket.winnerId) : null;

          return (
            <article className="tournament-card" key={tournament.id}>
              <div className="card-topline">
                <div>
                  <h3>{tournament.name}</h3>
                  <p className="muted">{tournament.location} · {tournament.date}</p>
                </div>
                <span className={`status-badge ${tournament.status.toLowerCase()}`}>{tournament.status}</span>
              </div>
              <p className="muted">Organizer: {organizerName}</p>
              <p className="muted">Participants: {tournament.participants.length}</p>
              {tournament.status === 'COMPLETED' ? (
                <p className="muted">Winner: {winnerName ?? 'TBD'}</p>
              ) : null}
              <div className="card-actions">
                <button type="button" className="secondary-button" onClick={() => actions.openTournament(tournament.id)}>
                  Open detail
                </button>
                {tournament.status === 'OPEN' && isOrganizer ? (
                  <button type="button" className="primary-button" onClick={() => actions.generateBracket(tournament.id)}>
                    Generate bracket
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}