import { FormEvent, useEffect, useMemo, useState } from 'react';
import { getUsername } from '../logic';
import { getBackButtonLabel, useAppActions, useAppState } from '../state/AppState';

export function MatchDetailView() {
  const { state } = useAppState();
  const actions = useAppActions();
  const backLabel = getBackButtonLabel(state);
  const tournament = state.tournaments.find((entry) => entry.id === state.selectedTournamentId);
  const isManageMode = state.currentView === 'manage-match';
  const match = useMemo(() => {
    if (!tournament?.bracket || !state.selectedMatchId) {
      return null;
    }

    for (const round of tournament.bracket.rounds) {
      const found = round.matches.find((currentMatch) => currentMatch.id === state.selectedMatchId);
      if (found) {
        return found;
      }
    }

    return null;
  }, [state.selectedMatchId, tournament]);

  const [shooterId, setShooterId] = useState('');
  const [outcome, setOutcome] = useState<'HIT' | 'MISS'>('HIT');
  const [cupId, setCupId] = useState('C1');
  const cupRows = [
    ['C1', 'C2', 'C3', 'C4'],
    ['C5', 'C6', 'C7'],
    ['C8', 'C9'],
    ['C10'],
  ];

  const cupSlots = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10'];

  if (!tournament || !match) {
    return (
      <section className="page-panel">
        <p className="muted">Match not found.</p>
      </section>
    );
  }

  const tournamentId = tournament.id;
  const currentMatch = match;

  const isOrganizer = state.currentUserId === tournament.organizerId;
  const canSubmit = isOrganizer && currentMatch.status !== 'COMPLETED' && currentMatch.playerBId !== null;
  const submitBlockReason = !isOrganizer
    ? 'Only the tournament organizer can register shots.'
    : currentMatch.status === 'COMPLETED'
      ? 'This match is already completed.'
      : null;
  const opponentId = shooterId === currentMatch.playerAId ? currentMatch.playerBId : currentMatch.playerAId;

  const cupsHitAgainstA = new Set(
    match.shots
      .filter((shot) => shot.result.kind === 'HIT' && shot.shooterId === currentMatch.playerBId && shot.result.cupId)
      .map((shot) => shot.result.cupId as string)
  );

  const cupsHitAgainstB = new Set(
    match.shots
      .filter((shot) => shot.result.kind === 'HIT' && shot.shooterId === currentMatch.playerAId && shot.result.cupId)
      .map((shot) => shot.result.cupId as string)
  );

  const targetBoardCups = shooterId === currentMatch.playerAId ? cupsHitAgainstB : cupsHitAgainstA;

  useEffect(() => {
    if (!shooterId && currentMatch.playerBId) {
      setShooterId(currentMatch.playerAId);
    }
  }, [currentMatch.playerAId, currentMatch.playerBId, shooterId]);

  useEffect(() => {
    if (targetBoardCups.has(cupId)) {
      const firstAvailableCup = cupSlots.find((cup) => !targetBoardCups.has(cup));
      if (firstAvailableCup) {
        setCupId(firstAvailableCup);
      }
    }
  }, [cupId, targetBoardCups]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || !shooterId || (outcome === 'HIT' && !cupId)) {
      return;
    }

    actions.recordShot(tournamentId, currentMatch.id, {
      shooterId,
      outcome,
      cupId: outcome === 'HIT' ? cupId.trim() : undefined,
    });

    if (currentMatch.playerBId) {
      const nextShooter = shooterId === currentMatch.playerAId ? currentMatch.playerBId : currentMatch.playerAId;
      setShooterId(nextShooter);
    }
  }

  function renderBoard(boardOwnerId: string, boardLabel: string, hitCups: Set<string>) {
    const isTargetBoard = shooterId && boardOwnerId !== shooterId;

    return (
      <div className={`cup-board${isTargetBoard ? ' target' : ''}`}>
        <p className="cup-picker-title">{boardLabel}</p>
        <div className="cup-picker" aria-label={`${boardLabel} cups`}>
          {cupRows.map((row, rowIndex) => (
            <div key={`${boardOwnerId}-row-${rowIndex}`} className="cup-row">
              {row.map((cup) => {
                const isHit = hitCups.has(cup);
                const isSelected = cupId === cup && isTargetBoard && outcome === 'HIT';
                const isDisabled = !isTargetBoard || outcome === 'MISS' || isHit;

                return (
                  <button
                    key={`${boardOwnerId}-${cup}`}
                    type="button"
                    className={`cup-button${isSelected ? ' selected' : ''}${isHit ? ' hit' : ''}`}
                    onClick={() => setCupId(cup)}
                    disabled={isDisabled}
                    title={isHit ? `${cup} already hit` : `Select ${cup}`}
                  >
                    {cup}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="page-panel">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{isManageMode ? 'View Gestisci Partita' : 'View Partita'}</p>
          <h2>{getUsername(state.users, currentMatch.playerAId)} vs {getUsername(state.users, currentMatch.playerBId)}</h2>
          <p className="muted">Round {currentMatch.round} · {currentMatch.status}</p>
        </div>
        <div className="card-actions">
          <button type="button" className="secondary-button" onClick={() => actions.goBack()}>
            {backLabel}
          </button>
          {isOrganizer && !isManageMode ? (
            <button type="button" className="primary-button" onClick={() => actions.setView('manage-match', tournamentId, currentMatch.id)}>
              Gestisci partita
            </button>
          ) : null}
          {isManageMode ? (
            <button type="button" className="secondary-button" onClick={() => actions.setView('match', tournamentId, currentMatch.id)}>
              Torna al dettaglio
            </button>
          ) : null}
        </div>
      </div>

      <div className="detail-grid single">
        <article className="detail-card">
          <h3>Live score</h3>
          <div className="scoreline large">{currentMatch.scoreA} - {currentMatch.scoreB}</div>
          {currentMatch.winnerId ? <p className="success">Winner: {getUsername(state.users, currentMatch.winnerId)}</p> : null}
          {currentMatch.disqualifiedPlayerId ? <p className="danger">Disqualified: {getUsername(state.users, currentMatch.disqualifiedPlayerId)}</p> : null}
        </article>

        <article className="detail-card">
          <h3>Shot entry</h3>
          {isManageMode && currentMatch.playerBId ? (
            <form className="shot-form" onSubmit={handleSubmit}>
              <label>
                Shooter
                <select value={shooterId} onChange={(event) => setShooterId(event.target.value)}>
                  <option value={currentMatch.playerAId}>{getUsername(state.users, currentMatch.playerAId)}</option>
                  <option value={currentMatch.playerBId}>{getUsername(state.users, currentMatch.playerBId)}</option>
                </select>
              </label>
              <label>
                Result
                <select value={outcome} onChange={(event) => setOutcome(event.target.value as 'HIT' | 'MISS')}>
                  <option value="HIT">Hit</option>
                  <option value="MISS">Miss</option>
                </select>
              </label>
              <div className="cup-picker-wrap">
                <p className="cup-picker-title">Boards</p>
                <div className="cup-boards-grid">
                  {renderBoard(currentMatch.playerAId, `${getUsername(state.users, currentMatch.playerAId)} board`, cupsHitAgainstA)}
                  {currentMatch.playerBId ? renderBoard(currentMatch.playerBId, `${getUsername(state.users, currentMatch.playerBId)} board`, cupsHitAgainstB) : null}
                </div>
                <p className="muted">Selected cup: {outcome === 'HIT' ? cupId : 'None (miss)'} · Shooter auto-switches after each shot, but you can change it anytime.</p>
              </div>
              {submitBlockReason ? <p className="muted">{submitBlockReason}</p> : null}
              <button type="submit" className="primary-button" disabled={!canSubmit}>Register shot</button>
            </form>
          ) : (
            <p className="muted">{isManageMode ? 'This match is a bye. The player advanced automatically.' : 'Shot registration is available in management mode.'}</p>
          )}
        </article>
      </div>

      <article className="detail-card full-width">
        <h3>Shot log</h3>
        {currentMatch.shots.length ? (
          <table className="log-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Shooter</th>
                <th>Alcohol</th>
                <th>Result</th>
                <th>Before</th>
              </tr>
            </thead>
            <tbody>
              {currentMatch.shots.map((shot, index) => (
                <tr key={shot.id}>
                  <td>{index + 1}</td>
                  <td>{getUsername(state.users, shot.shooterId)}</td>
                  <td>{shot.alcoholLevel}</td>
                  <td>{shot.result.kind}{shot.result.cupId ? ` (${shot.result.cupId})` : ''}</td>
                  <td>
                    A {shot.preShotState.scoreA} - {shot.preShotState.scoreB} B · {shot.preShotState.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">No shots have been recorded yet.</p>
        )}
      </article>
    </section>
  );
}