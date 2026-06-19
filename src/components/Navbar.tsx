import { useAppActions, useAppState } from '../state/AppState';

export function Navbar() {
  const { state } = useAppState();
  const actions = useAppActions();
  const currentUser = state.users.find((user) => user.id === state.currentUserId);

  return (
    <header className="navbar">
      <div>
        <p className="eyebrow">Progetto Patella</p>
        <h1>Beer Pong Tournament Control Room</h1>
      </div>
      <div className="navbar-actions">
        <label className="select-label">
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