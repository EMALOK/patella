import { useAppActions, useAppState } from '../state/AppState';

const HOME_CARDS = [
  {
    view: 'manage-user' as const,
    eyebrow: 'View Gestisci Utente',
    title: 'Gestisci profilo',
    description: 'Username, password e accesso al profilo utente corrente.',
  },
  {
    view: 'users' as const,
    eyebrow: 'View Utenti',
    title: 'Esplora utenti',
    description: 'Filtro e lista utenti con accesso alla scheda utente completa.',
  },
  {
    view: 'matches' as const,
    eyebrow: 'View Partite',
    title: 'Esplora partite',
    description: 'Filtro e lista partite con accesso a dettaglio e gestione.',
  },
  {
    view: 'tournaments' as const,
    eyebrow: 'View Tornei',
    title: 'Esplora tornei',
    description: 'Filtro e lista tornei con apertura del dettaglio torneo.',
  },
  {
    view: 'my-tournaments' as const,
    eyebrow: 'View I Miei Tornei',
    title: 'I miei tornei',
    description: 'Tornei organizzati dall’utente corrente, con accesso alla gestione.',
  },
  {
    view: 'create' as const,
    eyebrow: 'View Crea Torneo',
    title: 'Crea torneo',
    description: 'Nome, luogo, data, massimo iscritti e limite drink consecutivi.',
  },
];

export function HomeView() {
  const { state } = useAppState();
  const actions = useAppActions();
  const currentUser = state.users.find((user) => user.id === state.currentUserId);

  return (
    <section className="page-panel">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Home Utente</p>
          <h2>Scelta funzionalità</h2>
          <p className="muted">Scegli la maschera di lavoro da questa schermata iniziale.</p>
        </div>
      </div>

      <div className="hero-summary-grid">
        <article className="summary-card">
          <span className="summary-label">Utente corrente</span>
          <strong>{currentUser?.username ?? state.currentUserId}</strong>
        </article>
      </div>

      <div className="home-grid">
        {HOME_CARDS.map((card) => (
          <article className="home-card" key={card.view}>
            <p className="eyebrow">{card.eyebrow}</p>
            <h3>{card.title}</h3>
            <p className="muted">{card.description}</p>
            <button type="button" className="primary-button" onClick={() => actions.setView(card.view)}>
              Apri
            </button>
          </article>
        ))}
      </div>


    </section>
  );
}
