import { useMemo, useState } from 'react';
import { getUsername } from '../logic';
import { getBackButtonLabel, useAppActions, useAppState } from '../state/AppState';

interface MatchListItem {
  tournamentId: string;
  tournamentName: string;
  matchId: string;
  round: number;
  status: string;
  playerAId: string;
  playerBId: string | null;
  scoreA: number;
  scoreB: number;
}

export function MatchesView() {
  const { state } = useAppState();
  const actions = useAppActions();
  const backLabel = getBackButtonLabel(state);
  const [query, setQuery] = useState('');

  const matches = useMemo(() => {
    const items: MatchListItem[] = [];
    for (const tournament of state.tournaments) {
      if (!tournament.bracket) {
        continue;
      }

      for (const round of tournament.bracket.rounds) {
        for (const match of round.matches) {
          items.push({
            tournamentId: tournament.id,
            tournamentName: tournament.name,
            matchId: match.id,
            round: match.round,
            status: match.status,
            playerAId: match.playerAId,
            playerBId: match.playerBId,
            scoreA: match.scoreA,
            scoreB: match.scoreB,
          });
        }
      }
    }

    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return items;
    }

    return items.filter((match) => {
      const searchBlob = [
        match.matchId,
        match.tournamentName,
        getUsername(state.users, match.playerAId),
        getUsername(state.users, match.playerBId),
        match.status,
      ]
        .join(' ')
        .toLowerCase();

      return searchBlob.includes(normalizedQuery);
    });
  }, [query, state.tournaments, state.users]);

  return (
    <section className="page-panel">
      <div className="page-heading">
        <div>
          <p className="eyebrow">View Partite</p>
          <h2>Filtro e lista di partite</h2>
          <p className="muted">Apri il dettaglio partita oppure la schermata di gestione per registrare i colpi.</p>
        </div>
        <div className="heading-actions">
          <button type="button" className="secondary-button" onClick={() => actions.goBack()}>
            {backLabel}
          </button>
          <label className="search-label">
            Filtro
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cerca torneo o giocatori" />
          </label>
        </div>
      </div>

      <div className="grid-cards">
        {matches.map((match) => (
          <article className="match-card" key={match.matchId}>
            <div className="match-card-header">
              <strong>{match.tournamentName}</strong>
              <span>Round {match.round}</span>
            </div>
            <div className="match-card-body">
              <div className="versus-line">
                <span>{getUsername(state.users, match.playerAId)}</span>
                <span className="versus-pill">VS</span>
                <span>{getUsername(state.users, match.playerBId)}</span>
              </div>
              <div className="scoreline">{match.scoreA} - {match.scoreB}</div>
              <p className="muted">Status: {match.status}</p>
            </div>
            <div className="card-actions">
              <button type="button" className="secondary-button" onClick={() => actions.openMatch(match.tournamentId, match.matchId)}>
                Visualizza partita
              </button>
              <button type="button" className="primary-button" onClick={() => actions.setView('manage-match', match.tournamentId, match.matchId)}>
                Gestisci partita
              </button>
            </div>
          </article>
        ))}
        {!matches.length ? <p className="muted">Nessuna partita trovata.</p> : null}
      </div>
    </section>
  );
}
