import { FormEvent, useState } from 'react';
import { useAppActions } from '../state/AppState';

export function CreateTournamentView() {
  const actions = useAppActions();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('2026-07-01');
  const [drinkLimit, setDrinkLimit] = useState(20);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !location.trim() || !date.trim() || drinkLimit < 1) {
      return;
    }

    actions.createTournament(name.trim(), location.trim(), date.trim(), drinkLimit);
    setName('');
    setLocation('');
    setDate('2026-07-01');
    setDrinkLimit(20);
  }

  return (
    <section className="page-panel">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Create tournament</p>
          <h2>New bracket</h2>
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
        <button type="submit" className="primary-button">Create</button>
      </form>
    </section>
  );
}