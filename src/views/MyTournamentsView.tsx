import { useMemo, useState } from 'react';
import { getUsername } from '../logic';
import { getBackButtonLabel, useAppActions, useAppState } from '../state/AppState';

export function MyTournamentsView() {
  const { state } = useAppState();
  const actions = useAppActions();
  const backLabel = getBackButtonLabel(state);
  const [query, setQuery] = useState('');

  const tournaments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return state.tournaments.filter((tournament) => {
      if (tournament.organizerId !== state.currentUserId) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [tournament.name, tournament.location, tournament.status].join(' ').toLowerCase().includes(normalizedQuery);
    });
  }, [query, state.currentUserId, state.tournaments]);

  return (
    <section className="page-panel">
      <div className="page-heading">
        <div>
          <p className="eyebrow">View I Miei Tornei</p>
          <h2>Tornei organizzati</h2>
          <p className="muted">Tornei in cui l’utente corrente è organizzatore, con accesso alla scheda e alla gestione.</p>
        </div>
        <div className="heading-actions">
          <button type="button" className="secondary-button" onClick={() => actions.goBack()}>
            {backLabel}
          </button>
          <label className="search-label">
            Filtro
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cerca torneo" />
          </label>
        </div>
      </div>

      <div className="grid-cards">
        {tournaments.map((tournament) => {
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
              <p className="muted">Partecipanti: {tournament.participants.length}</p>
              {winnerName ? <p className="muted">Winner: {winnerName}</p> : null}
              <div className="card-actions">
                <button type="button" className="secondary-button" onClick={() => actions.openTournament(tournament.id)}>
                  Visualizza torneo
                </button>
                <button type="button" className="primary-button" onClick={() => actions.setView('manage-tournament', tournament.id)}>
                  Gestisci torneo
                </button>
              </div>
            </article>
          );
        })}
        {!tournaments.length ? <p className="muted">Nessun torneo organizzato trovato.</p> : null}
      </div>
    </section>
  );
}
