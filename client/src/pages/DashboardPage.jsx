import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import SummaryCards from '../components/SummaryCards.jsx';
import StreakCards from '../components/StreakCards.jsx';
import TimeseriesChart from '../components/TimeseriesChart.jsx';
import StatisticsTable from '../components/StatisticsTable.jsx';

function DashboardPage({ title, collection }) {
  const [summary, setSummary] = useState(null);
  const [timeseries, setTimeseries] = useState([]);
  const [streaks, setStreaks] = useState(null);
  const [statistics, setStatistics] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function buildRangeParams() {
    if (!selectedDate) {
      return '';
    }
    const base = new Date(`${selectedDate}T00:00:00`);
    const from = new Date(base);
    const to = new Date(base);
    to.setHours(23, 59, 59, 999);
    const fromIso = from.toISOString();
    const toIso = to.toISOString();
    return `from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`;
  }

  async function fetchData() {
    setLoading(true);
    setError(null);

    try {
      const rangeParams = buildRangeParams();
      const suffix = rangeParams ? `?${rangeParams}` : '';

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

      setSummary(summaryJson.summary);
      setTimeseries(tsJson.points || []);
      setStreaks({
        maxEarning: streaksJson.maxEarning,
        maxLoss: streaksJson.maxLoss
      });
      setStatistics(statsJson.buckets || []);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection, selectedDate]);

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
          <label htmlFor="date-select">
            Date:
            <input
              id="date-select"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </label>
          <button type="button" onClick={() => fetchData()}>
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
        <h3>Statistics by confidence</h3>
        <StatisticsTable buckets={statistics} />
      </section>
    </div>
  );
}

DashboardPage.propTypes = {
  title: PropTypes.string.isRequired,
  collection: PropTypes.oneOf(['results', 'test_results']).isRequired
};

export default DashboardPage;

