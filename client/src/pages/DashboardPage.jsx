import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import SummaryCards from '../components/SummaryCards.jsx';
import StreakCards from '../components/StreakCards.jsx';
import TimeseriesChart from '../components/TimeseriesChart.jsx';
import StatisticsTable from '../components/StatisticsTable.jsx';
import DailyPnlTable from '../components/DailyPnlTable.jsx';

function DashboardPage({ title, collection }) {
  const [summary, setSummary] = useState(null);
  const [timeseries, setTimeseries] = useState([]);
  const [streaks, setStreaks] = useState(null);
  const [statistics, setStatistics] = useState([]);
  const [scope, setScope] = useState('range'); // 'range' | 'all'
  const [dailyPnlRows, setDailyPnlRows] = useState([]);
  const [thresholdText, setThresholdText] = useState('0.70');

  const [fromText, setFromText] = useState(() => {
    const now = new Date();
    const utc9 = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const yyyy = utc9.getUTCFullYear();
    const mm = String(utc9.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(utc9.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T00:00`;
  });

  const [toText, setToText] = useState(() => {
    const now = new Date();
    const utc9 = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const yyyy = utc9.getUTCFullYear();
    const mm = String(utc9.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(utc9.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T23:59`;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const buildRangeParams = useCallback(() => {
    if (scope !== 'range' || !fromText || !toText) {
      return '';
    }
    const from = new Date(`${fromText}:00+09:00`);
    const to = new Date(`${toText}:59.999+09:00`);
    const fromIso = from.toISOString();
    const toIso = to.toISOString();
    return `from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`;
  }, [scope, fromText, toText]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const rangeParams = buildRangeParams();
      const suffix = rangeParams ? `?${rangeParams}` : '';

      const parsedThreshold = Number.parseFloat(thresholdText);
      const hasValidThreshold = Number.isFinite(parsedThreshold);
      const thresholdParam = hasValidThreshold
        ? `threshold=${encodeURIComponent(parsedThreshold)}`
        : '';

      const summaryRes = await fetch(`/api/${collection}/summary${suffix}`);
      if (!summaryRes.ok) {
        throw new Error(`Summary request failed with ${summaryRes.status}`);
      }
      const summaryJson = await summaryRes.json();

      const tsRes = await fetch(
        `/api/${collection}/timeseries?interval=5m${rangeParams ? `&${rangeParams}` : ''}`
      );
      if (!tsRes.ok) {
        throw new Error(`Timeseries request failed with ${tsRes.status}`);
      }
      const tsJson = await tsRes.json();

      const streaksRes = await fetch(`/api/${collection}/streaks${suffix}`);
      if (!streaksRes.ok) {
        throw new Error(`Streaks request failed with ${streaksRes.status}`);
      }
      const streaksJson = await streaksRes.json();

      const statsRes = await fetch(`/api/${collection}/statistics${suffix}`);
      if (!statsRes.ok) {
        throw new Error(`Statistics request failed with ${statsRes.status}`);
      }
      const statsJson = await statsRes.json();

      const dailyParams = [thresholdParam].filter(Boolean).join('&');
      const dailySuffix = dailyParams ? `?${dailyParams}` : '';
      const dailyRes = await fetch(`/api/${collection}/daily-pnl${dailySuffix}`);
      if (!dailyRes.ok) {
        throw new Error(`Daily PnL request failed with ${dailyRes.status}`);
      }
      const dailyJson = await dailyRes.json();

      setSummary(summaryJson.summary);
      setTimeseries(tsJson.points || []);
      setStreaks({
        maxEarning: streaksJson.maxEarning,
        maxLoss: streaksJson.maxLoss
      });
      setStatistics(statsJson.buckets || []);
      setDailyPnlRows(dailyJson.days || []);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [buildRangeParams, collection, thresholdText]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const id = setInterval(() => {
      fetchData();
    }, 2 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchData]);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h2>{title}</h2>
          <p>
            Collection: <code>{collection}</code>
          </p>
        </div>
        <div className="controls">
          <div className="controls-row">
            <label htmlFor="scope-select">
              Scope:
              <select
                id="scope-select"
                value={scope}
                onChange={(e) => setScope(e.target.value)}
              >
                <option value="range">Range (UTC+9)</option>
                <option value="all">All data</option>
              </select>
            </label>
          </div>
          {scope === 'range' && (
            <>
              <div className="controls-row">
                <label htmlFor="from-dt">
                  From (UTC+9):
                  <input
                    id="from-dt"
                    type="datetime-local"
                    value={fromText}
                    onChange={(e) => setFromText(e.target.value)}
                  />
                </label>
              </div>
              <div className="controls-row">
                <label htmlFor="to-dt">
                  To (UTC+9):
                  <input
                    id="to-dt"
                    type="datetime-local"
                    value={toText}
                    onChange={(e) => setToText(e.target.value)}
                  />
                </label>
              </div>
            </>
          )}
          <div>
            <button type="button" onClick={() => fetchData()}>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {loading && <div className="info-banner">Loading data…</div>}
      {error && <div className="error-banner">Error: {error}</div>}

      <SummaryCards summary={summary} />

      <section className="section">
        <StreakCards streaks={streaks} />
      </section>

      <section className="section">
        <TimeseriesChart points={timeseries} />
      </section>

      <section className="section">
        <h3>Statistics by confidence</h3>
        <StatisticsTable buckets={statistics} />
      </section>

      <section className="section">
        <div className="section-header">
          <h3>Daily total PnL at threshold</h3>
          <div className="controls-row">
            <label htmlFor="threshold-input">
              Confidence threshold (≥):
              <input
                id="threshold-input"
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={thresholdText}
                onChange={(e) => setThresholdText(e.target.value)}
              />
            </label>
          </div>
        </div>
        <DailyPnlTable rows={dailyPnlRows} />
      </section>
    </div>
  );
}

DashboardPage.propTypes = {
  title: PropTypes.string.isRequired,
  collection: PropTypes.oneOf(['results', 'test_results']).isRequired
};

export default DashboardPage;

