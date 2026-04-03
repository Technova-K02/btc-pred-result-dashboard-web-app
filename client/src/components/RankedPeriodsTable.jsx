import PropTypes from 'prop-types';

function formatNumber(value, digits = 2) {
  if (value == null) return '–';
  return Number(value).toFixed(digits);
}

function formatPercent(value) {
  if (value == null) return '–';
  return `${(value * 100).toFixed(1)}%`;
}

function formatHour(hour) {
  if (!Number.isFinite(hour)) return '–';
  const h = Math.max(0, Math.min(23, Math.round(hour)));
  const next = (h + 1) % 24;
  const from = `${String(h).padStart(2, '0')}:00`;
  const to = `${String(next).padStart(2, '0')}:00`;
  return `${from} ~ ${to}`;
}

function RankedPeriodsTable({ rows, limit, onSelectHour, showBack, onBack }) {
  if (!rows || rows.length === 0) {
    return <div className="empty-state">No ranked periods for this threshold.</div>;
  }

  const ranked = [...rows]
    .filter((r) => typeof r.totalPnl === 'number' && typeof r.accuracy === 'number')
    .sort((a, b) => {
      // Primary: higher accuracy, secondary: higher totalPnl, tertiary: more trades
      if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
      if (b.totalPnl !== a.totalPnl) return b.totalPnl - a.totalPnl;
      return (b.total || 0) - (a.total || 0);
    })
    .slice(0, limit);

  if (ranked.length === 0) {
    return <div className="empty-state">No ranked periods for this threshold.</div>;
  }

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Time of day (UTC+9)</th>
            <th>Accuracy</th>
            <th>Correct / Total</th>
            <th>Total PnL</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((row, idx) => (
            <tr
              key={row.hour}
              className={onSelectHour ? 'clickable-row' : ''}
              onClick={onSelectHour ? () => onSelectHour(row.hour) : undefined}
            >
              <td>{idx + 1}</td>
              <td>{formatHour(row.hour)}</td>
              <td>{formatPercent(row.accuracy)}</td>
              <td>
                {row.correct}/{row.total}
              </td>
              <td>{formatNumber(row.totalPnl)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

RankedPeriodsTable.propTypes = {
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      hour: PropTypes.number,
      total: PropTypes.number,
      correct: PropTypes.number,
      accuracy: PropTypes.number,
      totalPnl: PropTypes.number
    })
  ),
  limit: PropTypes.number,
  onSelectHour: PropTypes.func,
  showBack: PropTypes.bool,
  onBack: PropTypes.func
};

RankedPeriodsTable.defaultProps = {
  rows: [],
  limit: 10,
  onSelectHour: undefined,
  showBack: false,
  onBack: undefined
};

export default RankedPeriodsTable;

