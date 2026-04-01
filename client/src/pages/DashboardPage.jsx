import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import SummaryCards from '../components/SummaryCards.jsx';
import StreakCards from '../components/StreakCards.jsx';
import TimeseriesChart from '../components/TimeseriesChart.jsx';
import StatisticsTable from '../components/StatisticsTable.jsx';
import DateCalendar from '../components/DateCalendar.jsx';

function DashboardPage({ title, collection }) {
  const [summary, setSummary] = useState(null);
  const [timeseries, setTimeseries] = useState([]);
  const [streaks, setStreaks] = useState(null);
  const [statistics, setStatistics] = useState([]);
  const [scope, setScope] = useState('day'); // 'day' | 'all'
  const [selectedDate, setSelectedDate] = useState(() => {
    // Today in UTC+9 regardless of browser timezone
    const now = new Date();
    const utc9 = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const yyyy = utc9.getUTCFullYear();
    const mm = String(utc9.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(utc9.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);

  const buildRangeParams = useCallback(() => {
    if (scope !== 'day' || !selectedDate) {
      return '';
    }
    const from = new Date(`${selectedDate}T00:00:00+09:00`);
    const to = new Date(`${selectedDate}T23:59:59.999+09:00`);
    const fromIso = from.toISOString();
    const toIso = to.toISOString();
    return `from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`;
  }, [scope, selectedDate]);

  const fetchData = useCallback(async () => {
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

      const datesRes = await fetch(`/api/${collection}/dates`);
      if (!datesRes.ok) {
        throw new Error(`Dates request failed with ${datesRes.status}`);
      }
      const datesJson = await datesRes.json();

      setSummary(summaryJson.summary);
      setTimeseries(tsJson.points || []);
      setStreaks({
        maxEarning: streaksJson.maxEarning,
        maxLoss: streaksJson.maxLoss
      });
      setStatistics(statsJson.buckets || []);
      setAvailableDates(datesJson.dates || []);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [buildRangeParams, collection]);

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
                <option value="day">Selected day</option>
                <option value="all">All data</option>
              </select>
            </label>
          </div>
          <div className="date-picker">
            <button
              type="button"
              className="date-toggle"
              onClick={() => setShowCalendar((v) => !v)}
            >
              <span>Date: {selectedDate}</span>
              <span className="date-toggle-icon">▾</span>
            </button>
            {showCalendar && (
              <div className="calendar-popover">
                <DateCalendar
                  selectedDate={selectedDate}
                  availableDates={availableDates}
                  onChange={(date) => {
                    setSelectedDate(date);
                    setScope('day');
                    setShowCalendar(false);
                  }}
                />
              </div>
            )}
          </div>
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
        <TimeseriesChart
          points={timeseries}
          bestAccuracy={summary ? summary.bestConfidenceAccuracy : null}
        />
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

