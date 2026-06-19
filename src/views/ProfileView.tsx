import { useMemo, useState } from 'react';
import { useAppState } from '../state/AppState';

const HISTORY_PAGE_SIZE = 25;

interface HistoryItem {
  id: string;
  tournamentName: string;
  date: string;
  opponent: string;
  result: 'W' | 'L';
  score: string;
}

export function ProfileView() {
  const { state } = useAppState();
  const [historyPage, setHistoryPage] = useState(0);
  const user = state.users.find((entry) => entry.id === state.currentUserId);

  if (!user) {
    return null;
  }

  const shotStats = useMemo(() => {
    let matchesPlayed = 0;
    let matchesWon = 0;
    let totalShots = 0;
    let totalHits = 0;
    const byAlcoholLevel = new Map<number, { shots: number; hits: number }>();
    const history: HistoryItem[] = [];

    for (const tournament of state.tournaments) {
      if (!tournament.bracket) {
        continue;
      }

      for (const round of tournament.bracket.rounds) {
        for (const match of round.matches) {
          const isParticipant = match.playerAId === user.id || match.playerBId === user.id;
          if (!isParticipant) {
            continue;
          }

          if (match.status === 'COMPLETED' && match.playerBId && match.winnerId) {
            matchesPlayed += 1;
            if (match.winnerId === user.id) {
              matchesWon += 1;
            }
          }

          for (const shot of match.shots) {
            if (shot.shooterId !== user.id) {
              continue;
            }

            totalShots += 1;
            if (shot.result.kind === 'HIT') {
              totalHits += 1;
            }

            const levelStats = byAlcoholLevel.get(shot.alcoholLevel) ?? { shots: 0, hits: 0 };
            levelStats.shots += 1;
            if (shot.result.kind === 'HIT') {
              levelStats.hits += 1;
            }
            byAlcoholLevel.set(shot.alcoholLevel, levelStats);
          }

          if (match.status === 'COMPLETED' && match.playerBId && match.winnerId) {
            const opponentId = match.playerAId === user.id ? match.playerBId : match.playerAId;
            const opponent = state.users.find((entry) => entry.id === opponentId)?.username ?? opponentId;
            const isWin = match.winnerId === user.id;
            const score = match.playerAId === user.id ? `${match.scoreA} - ${match.scoreB}` : `${match.scoreB} - ${match.scoreA}`;
            const lastShotDate = match.shots.length ? match.shots[match.shots.length - 1].createdAt : tournament.date;

            history.push({
              id: `${tournament.id}_${match.id}`,
              tournamentName: tournament.name,
              date: lastShotDate,
              opponent,
              result: isWin ? 'W' : 'L',
              score,
            });
          }
        }
      }
    }

    history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      matchesPlayed,
      matchesWon,
      totalShots,
      totalHits,
      byAlcoholLevel: [...byAlcoholLevel.entries()].sort((a, b) => a[0] - b[0]),
      history,
    };
  }, [state.tournaments, state.users, user.id]);

  const winRate = shotStats.matchesPlayed > 0
    ? (shotStats.matchesWon / shotStats.matchesPlayed) * 100
    : 0;

  const shotSuccess = shotStats.totalShots > 0
    ? (shotStats.totalHits / shotStats.totalShots) * 100
    : 0;

  const losses = Math.max(0, shotStats.matchesPlayed - shotStats.matchesWon);

  const alcoholGraph = shotStats.byAlcoholLevel.map(([level, stats]) => ({
    level,
    shots: stats.shots,
    hits: stats.hits,
    success: stats.shots > 0 ? (stats.hits / stats.shots) * 100 : 0,
  }));

  const recentFormPoints = (() => {
    const recent = [...shotStats.history].slice(0, 12).reverse();
    if (!recent.length) {
      return [] as number[];
    }

    let momentum = 0;
    return recent.map((item) => {
      momentum += item.result === 'W' ? 1 : -1;
      return momentum;
    });
  })();

  const formMin = recentFormPoints.length ? Math.min(...recentFormPoints) : -1;
  const formMax = recentFormPoints.length ? Math.max(...recentFormPoints) : 1;
  const formRange = Math.max(1, formMax - formMin);
  const formPath = recentFormPoints
    .map((value, index) => {
      const x = (index / Math.max(1, recentFormPoints.length - 1)) * 100;
      const y = 100 - ((value - formMin) / formRange) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  const historyPageCount = Math.max(1, Math.ceil(shotStats.history.length / HISTORY_PAGE_SIZE));
  const clampedHistoryPage = Math.min(historyPage, historyPageCount - 1);
  const historyStartIndex = clampedHistoryPage * HISTORY_PAGE_SIZE;
  const visibleHistory = shotStats.history.slice(historyStartIndex, historyStartIndex + HISTORY_PAGE_SIZE);

  return (
    <section className="page-panel">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Profile</p>
          <h2>{user.username}</h2>
        </div>
      </div>
      <div className="stats-grid">
        <article className="stat-card">
          <span>Matches played</span>
          <strong>{shotStats.matchesPlayed}</strong>
        </article>
        <article className="stat-card">
          <span>Matches won</span>
          <strong>{shotStats.matchesWon}</strong>
        </article>
        <article className="stat-card">
          <span>Win rate</span>
          <strong>{winRate.toFixed(1)}%</strong>
        </article>
        <article className="stat-card">
          <span>ELO</span>
          <strong>{user.stats.elo}</strong>
        </article>
        <article className="stat-card">
          <span>Shot success</span>
          <strong>{shotSuccess.toFixed(1)}%</strong>
        </article>
      </div>

      <div className="detail-grid single">
        <article className="detail-card full-width">
          <h3>Performance Graphs</h3>
          <div className="profile-charts-grid">
            <section className="profile-chart-card win-balance-card">
              <h4>Win Balance</h4>
              <div
                className="win-ring"
                style={{
                  background: `conic-gradient(var(--success) 0 ${winRate}%, rgba(157, 43, 43, 0.55) ${winRate}% 100%)`,
                }}
                aria-label="Win rate chart"
              >
                <div className="win-ring-core">
                  <strong>{winRate.toFixed(1)}%</strong>
                  <span>win rate</span>
                </div>
              </div>
              <div className="chart-legend">
                <span>W {shotStats.matchesWon}</span>
                <span>L {losses}</span>
              </div>
            </section>

            <section className="profile-chart-card alcohol-card">
              <h4>Success by Alcohol</h4>
              {alcoholGraph.length ? (
                <div className="alcohol-histogram" role="img" aria-label="Shot success by alcohol level histogram">
                  {alcoholGraph.map((item) => (
                    <div key={item.level} className="alcohol-hist-row">
                      <span className="alcohol-hist-label">A{item.level}</span>
                      <div className="alcohol-hist-track">
                        <div className="alcohol-hist-fill" style={{ width: `${item.success}%` }} />
                      </div>
                      <span className="alcohol-hist-value">{item.success.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">No shots recorded yet.</p>
              )}
            </section>

            <section className="profile-chart-card recent-form-card">
              <h4>Recent Form</h4>
              {recentFormPoints.length ? (
                <div className="form-chart-wrap">
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="form-chart">
                    <polyline points={formPath} className="form-chart-line" />
                  </svg>
                  <p className="muted">Last {recentFormPoints.length} matches momentum</p>
                </div>
              ) : (
                <p className="muted">No completed matches yet.</p>
              )}
            </section>
          </div>
        </article>
      </div>

      <div className="detail-grid single">
        <article className="detail-card full-width">
          <h3>Shot Success / Alcohol Level</h3>
          {shotStats.byAlcoholLevel.length ? (
            <table className="log-table">
              <thead>
                <tr>
                  <th>Alcohol level</th>
                  <th>Hits</th>
                  <th>Shots</th>
                  <th>Success</th>
                </tr>
              </thead>
              <tbody>
                {shotStats.byAlcoholLevel.map(([level, stats]) => (
                  <tr key={level}>
                    <td>{level}</td>
                    <td>{stats.hits}</td>
                    <td>{stats.shots}</td>
                    <td>{((stats.hits / stats.shots) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">No shots recorded yet.</p>
          )}
        </article>

        <article className="detail-card full-width">
          <h3>Match History</h3>
          {shotStats.history.length ? (
            <>
              <table className="log-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Tournament</th>
                    <th>Opponent</th>
                    <th>Result</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleHistory.map((item) => (
                    <tr key={item.id}>
                      <td>{new Date(item.date).toLocaleDateString()}</td>
                      <td>{item.tournamentName}</td>
                      <td>{item.opponent}</td>
                      <td className={item.result === 'W' ? 'success' : 'danger'}>{item.result}</td>
                      <td>{item.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="history-pager">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setHistoryPage((page) => Math.max(0, page - 1))}
                  disabled={clampedHistoryPage === 0}
                >
                  Previous
                </button>
                <span className="muted">
                  Page {clampedHistoryPage + 1} / {historyPageCount}
                </span>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setHistoryPage((page) => Math.min(historyPageCount - 1, page + 1))}
                  disabled={clampedHistoryPage >= historyPageCount - 1}
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <p className="muted">No completed matches yet.</p>
          )}
        </article>
      </div>
    </section>
  );
}