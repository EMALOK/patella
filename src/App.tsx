import { AppStateProvider, useAppActions, useAppState } from './state/AppState';
import { Navbar } from './components/Navbar';
import { DashboardView } from './views/DashboardView';
import { ProfileView } from './views/ProfileView';
import { CreateTournamentView } from './views/CreateTournamentView';
import { TournamentDetailView } from './views/TournamentDetailView';
import { MatchDetailView } from './views/MatchDetailView';

function AppShell() {
  const { state } = useAppState();
  const actions = useAppActions();

  return (
    <div className="app-shell">
      <Navbar />
      <nav className="nav-tabs">
        <button type="button" className={state.currentView === 'dashboard' ? 'tab active' : 'tab'} onClick={() => actions.setView('dashboard')}>
          Dashboard
        </button>
        <button type="button" className={state.currentView === 'profile' ? 'tab active' : 'tab'} onClick={() => actions.setView('profile')}>
          Profile
        </button>
        <button type="button" className={state.currentView === 'create' ? 'tab active' : 'tab'} onClick={() => actions.setView('create')}>
          Create
        </button>
      </nav>
      <main className="main-layout">
        {state.currentView === 'dashboard' ? <DashboardView /> : null}
        {state.currentView === 'profile' ? <ProfileView /> : null}
        {state.currentView === 'create' ? <CreateTournamentView /> : null}
        {state.currentView === 'tournament' ? <TournamentDetailView /> : null}
        {state.currentView === 'match' ? <MatchDetailView /> : null}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <AppShell />
    </AppStateProvider>
  );
}