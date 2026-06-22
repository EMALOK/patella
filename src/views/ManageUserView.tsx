import { FormEvent, useEffect, useState } from 'react';
import { getBackButtonLabel, useAppActions, useAppState } from '../state/AppState';

export function ManageUserView() {
  const { state } = useAppState();
  const actions = useAppActions();
  const backLabel = getBackButtonLabel(state);
  const currentUser = state.users.find((user) => user.id === state.currentUserId);
  const [username, setUsername] = useState(currentUser?.username ?? '');
  const [password, setPassword] = useState('');

  useEffect(() => {
    setUsername(currentUser?.username ?? '');
  }, [currentUser?.username]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentUser || !username.trim()) {
      return;
    }

    actions.updateCurrentUser(currentUser.id, username.trim());
    setPassword('');
  }

  return (
    <section className="page-panel">
      <div className="page-heading">
        <div>
          <p className="eyebrow">View Gestisci Utente</p>
          <h2>Username e password</h2>
          <p className="muted">Aggiorna il profilo dell’utente corrente e usa i collegamenti rapidi verso la scheda utente.</p>
        </div>
        <div className="card-actions">
          <button type="button" className="secondary-button" onClick={() => actions.goBack()}>
            {backLabel}
          </button>
          <button type="button" className="secondary-button" onClick={() => actions.openUser(state.currentUserId)}>
            Visualizza utente
          </button>
          <button type="button" className="secondary-button" onClick={() => actions.setView('user', null, null, state.currentUserId)}>
            Gestisci profilo
          </button>
        </div>
      </div>

      <form className="form-card manage-user-form" onSubmit={handleSubmit}>
        <label>
          Username
          <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Nuovo username" />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password locale" />
        </label>
        <p className="muted">La password è mostrata come campo di interfaccia; in questa demo non viene memorizzata.</p>
        <button type="submit" className="primary-button">Salva profilo</button>
      </form>
    </section>
  );
}
