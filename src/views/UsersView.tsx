import { useMemo, useState } from 'react';
import { getUsername } from '../logic';
import { getBackButtonLabel, useAppActions, useAppState } from '../state/AppState';

export function UsersView() {
  const { state } = useAppState();
  const actions = useAppActions();
  const backLabel = getBackButtonLabel(state);
  const [query, setQuery] = useState('');

  const users = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return state.users
      .filter((user) => {
        if (!normalizedQuery) {
          return true;
        }

        return user.username.toLowerCase().includes(normalizedQuery) || user.id.toLowerCase().includes(normalizedQuery);
      })
      .sort((a, b) => b.stats.elo - a.stats.elo);
  }, [query, state.users]);

  return (
    <section className="page-panel">
      <div className="page-heading">
        <div>
          <p className="eyebrow">View Utenti</p>
          <h2>Filtro e lista di utenti</h2>
          <p className="muted">Apri la scheda utente per vedere cronologia, statistiche e collegamenti ai contenuti correlati.</p>
        </div>
        <div className="heading-actions">
          <button type="button" className="secondary-button" onClick={() => actions.goBack()}>
            {backLabel}
          </button>
          <label className="search-label">
            Filtro
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cerca username" />
          </label>
        </div>
      </div>

      <div className="grid-cards">
        {users.map((user) => (
          <article className="tournament-card" key={user.id}>
            <div className="card-topline">
              <div>
                <h3>{user.username}</h3>
                <p className="muted">ID: {user.id}</p>
              </div>
              <span className="status-badge">ELO {user.stats.elo}</span>
            </div>
            <p className="muted">Utente visualizzabile da tornei, partite e profilo.</p>
            <div className="card-actions">
              <button type="button" className="secondary-button" onClick={() => actions.openUser(user.id)}>
                Visualizza utente
              </button>
              {user.id === state.currentUserId ? (
                <button type="button" className="primary-button" onClick={() => actions.setView('manage-user')}>
                  Gestisci profilo
                </button>
              ) : null}
            </div>
          </article>
        ))}
        {!users.length ? <p className="muted">Nessun utente trovato.</p> : null}
      </div>
    </section>
  );
}
