import { AppStateProvider, useAppActions, useAppState } from './state/AppState';
import { Navbar } from './components/Navbar';
import { HomeView } from './views/HomeView';
import { DashboardView } from './views/DashboardView';
import { ProfileView } from './views/ProfileView';
import { ManageUserView } from './views/ManageUserView';
import { UsersView } from './views/UsersView';
import { MatchesView } from './views/MatchesView';
import { MyTournamentsView } from './views/MyTournamentsView';
import { CreateTournamentView } from './views/CreateTournamentView';
import { TournamentDetailView } from './views/TournamentDetailView';
import { MatchDetailView } from './views/MatchDetailView';

function AppShell() {
  const { state } = useAppState();

  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-layout">
        {state.currentView === 'home' ? <HomeView /> : null}
        {state.currentView === 'manage-user' ? <ManageUserView /> : null}
        {state.currentView === 'users' ? <UsersView /> : null}
        {state.currentView === 'user' ? <ProfileView /> : null}
        {state.currentView === 'matches' ? <MatchesView /> : null}
        {state.currentView === 'my-tournaments' ? <MyTournamentsView /> : null}
        {state.currentView === 'tournaments' ? <DashboardView /> : null}
        {state.currentView === 'create' ? <CreateTournamentView /> : null}
        {state.currentView === 'manage-tournament' ? <TournamentDetailView /> : null}
        {state.currentView === 'tournament' ? <TournamentDetailView /> : null}
        {state.currentView === 'manage-match' ? <MatchDetailView /> : null}
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