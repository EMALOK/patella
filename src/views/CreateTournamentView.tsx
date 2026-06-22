import { FormEvent, useState } from 'react';
import { getBackButtonLabel, useAppActions, useAppState } from '../state/AppState';

export function CreateTournamentView() {
  const { state } = useAppState();
  const actions = useAppActions();
  const backLabel = getBackButtonLabel(state);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('2026-07-01');
  const [drinkLimit, setDrinkLimit] = useState(20);
  const [maxParticipants, setMaxParticipants] = useState(16);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !location.trim() || !date.trim() || drinkLimit < 1 || maxParticipants < 2) {
      return;
    }

    actions.createTournament(name.trim(), location.trim(), date.trim(), drinkLimit, maxParticipants);
    setName('');
    setLocation('');
    setDate('2026-07-01');
    setDrinkLimit(20);
    setMaxParticipants(16);
  }

  return (
    <section className="page-panel">
      <div className="page-heading">
        <div>
          <p className="eyebrow">View Crea Torneo</p>
          <h2>Nuovo torneo</h2>
          <p className="muted">Compila i dati principali del torneo e torna poi alla gestione o alla lista dei miei tornei.</p>
        </div>
        <div className="card-actions">
          <button type="button" className="secondary-button" onClick={() => actions.goBack()}>
            {backLabel}
          </button>
          <button type="button" className="secondary-button" onClick={() => actions.setView('my-tournaments')}>
            I miei tornei
          </button>
          <button type="button" className="secondary-button" onClick={() => actions.setView('tournaments')}>
            Lista tornei
          </button>
        </div>
      </div>

      <form className="form-card" onSubmit={handleSubmit}>
        <label>
          Name
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Summer Cup" />
        </label>
        <label>
          Location
          <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Bar Centrale" />
        </label>
        <label>
          Date
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        <label>
          Drink Limit
          <input
            type="number"
            value={drinkLimit}
            onChange={(event) => setDrinkLimit(Math.max(1, Math.floor(Number(event.target.value) || 1)))}
            min="1"
            step="1"
          />
        </label>
        <label>
          Numero massimo iscritti
          <input
            type="number"
            value={maxParticipants}
            onChange={(event) => setMaxParticipants(Math.max(2, Math.floor(Number(event.target.value) || 2)))}
            min="2"
            step="1"
          />
        </label>
        <button type="submit" className="primary-button">Create</button>
      </form>
    </section>
  );
}