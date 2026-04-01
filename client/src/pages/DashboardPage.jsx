import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import SummaryCards from '../components/SummaryCards.jsx';
import StreakCards from '../components/StreakCards.jsx';
import TimeseriesChart from '../components/TimeseriesChart.jsx';
import TimeseriesTable from '../components/TimeseriesTable.jsx';

function DashboardPage({ title, collection }) {
  const [summary, setSummary] = useState(null);
  const [timeseries, setTimeseries] = useState([]);
  const [interval, setInterval] = useState('5m');
  const [streaks, setStreaks] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchData(selectedInterval = interval) {
    setLoading(true);
    setError(null);

    try {
      const summaryRes = await fetch(`/api/${collection}/summary`);
      if (!summaryRes.ok) {
        throw new Error(`Summary request failed with ${summaryRes.status}`);
      }
      const summaryJson = await summaryRes.json();

      const tsRes = await fetch(`/api/${collection}/timeseries?interval=${encodeURIComponent(selectedInterval)}`);
      if (!tsRes.ok) {
        throw new Error(`Timeseries request failed with ${tsRes.status}`);
      }
      const tsJson = await tsRes.json();

      const streaksRes = await fetch(`/api/${collection}/streaks`);
      if (!streaksRes.ok) {
        throw new Error(`Streaks request failed with ${streaksRes.status}`);
      }
      const streaksJson = await streaksRes.json();

      setSummary(summaryJson.summary);
      setTimeseries(tsJson.points || []);
      setStreaks({
        maxEarning: streaksJson.maxEarning,
        maxLoss: streaksJson.maxLoss
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection, interval]);

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
          <label htmlFor="interval-select">
            Interval:
            <select
              id="interval-select"
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
            >
              <option value="5m">5 minutes</option>
              <option value="15m">15 minutes</option>
              <option value="1h">1 hour</option>
              <option value="4h">4 hours</option>
              <option value="1d">1 day</option>
            </select>
          </label>
          <button type="button" onClick={() => fetchData(interval)}>
            Refresh
          </button>
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
        <h3>Performance over time</h3>
        <TimeseriesTable points={timeseries} />
      </section>
    </div>
  );
}

DashboardPage.propTypes = {
  title: PropTypes.string.isRequired,
  collection: PropTypes.oneOf(['results', 'test_results']).isRequired
};

export default DashboardPage;

