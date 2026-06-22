import { useAppActions, useAppState } from '../state/AppState';
import { ViewName } from '../types';

export function Navbar() {
  const { state } = useAppState();
  const actions = useAppActions();
  const currentUser = state.users.find((user) => user.id === state.currentUserId);

  const navigation = [
    { view: 'home' as const, label: 'Home' },
    { view: 'manage-user' as const, label: 'Gestisci Utente' },
    { view: 'users' as const, label: 'Utenti' },
    { view: 'matches' as const, label: 'Partite' },
    { view: 'tournaments' as const, label: 'Tornei' },
    { view: 'my-tournaments' as const, label: 'I Miei Tornei' },
    { view: 'create' as const, label: 'Crea Torneo' },
  ];

  const navigationOptions = state.selectedTournamentId
    ? [...navigation, { view: 'tournament' as const, label: 'Torneo selezionato' }]
    : navigation;

  const currentNavigationView = navigationOptions.some((item) => item.view === state.currentView)
    ? state.currentView
    : '__current-screen';

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <p className="eyebrow">Progetto Patella</p>
        <h1>Beer Pong Tournament Control Room</h1>
        <p className="muted">Home utente, navigazione per maschere e gestione torneo.</p>
      </div>
      <div className="global-nav">
        <label className="select-label">
          Navigazione globale
          <select
            value={currentNavigationView}
            onChange={(event) => {
              const nextView = event.target.value;

              if (nextView === '__current-screen') {
                return;
              }

              if (nextView === 'tournament' && state.selectedTournamentId) {
                actions.openTournament(state.selectedTournamentId);
                return;
              }

              actions.setView(nextView as ViewName);
            }}
          >
            <option value="__current-screen" disabled>
              Pagina corrente non inclusa nella navigazione globale
            </option>
            {navigationOptions.map((item) => (
              <option key={item.view} value={item.view}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="navbar-actions">
        <label className="select-label compact">
          Current user
          <select value={state.currentUserId} onChange={(event) => actions.setCurrentUser(event.target.value)}>
            {state.users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.username}
              </option>
            ))}
          </select>
        </label>
        <div className="current-user-chip">{currentUser?.username ?? state.currentUserId}</div>
      </div>
    </header>
  );
}