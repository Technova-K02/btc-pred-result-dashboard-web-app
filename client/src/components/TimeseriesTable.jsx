import PropTypes from 'prop-types';
import { formatUtc9AndEdt } from '../utils/time.js';

function formatPercent(value) {
  if (value == null) return '–';
  return `${(value * 100).toFixed(2)}%`;
}

function formatNumber(value, digits = 4) {
  if (value == null) return '–';
  return Number(value).toFixed(digits);
}

function TimeseriesTable({ points }) {
  if (!points || points.length === 0) {
    return <div className="empty-state">No timeseries data in this range.</div>;
  }

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>Bucket start (UTC+9 [EDT])</th>
            <th>Total</th>
            <th>Accuracy</th>
            <th>Total PnL</th>
            <th>Avg Prob UP</th>
            <th>Avg Confidence</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.bucket_start}>
              <td>{formatUtc9AndEdt(p.bucket_start)}</td>
              <td>{p.total}</td>
              <td>{formatPercent(p.accuracy)}</td>
              <td>{formatNumber(p.totalPnl)}</td>
              <td>{formatNumber(p.avgProbUp)}</td>
              <td>{formatNumber(p.avgConfidence)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

TimeseriesTable.propTypes = {
  points: PropTypes.arrayOf(
    PropTypes.shape({
      bucket_start: PropTypes.string,
      total: PropTypes.number,
      accuracy: PropTypes.number,
      totalPnl: PropTypes.number,
      avgProbUp: PropTypes.number,
      avgConfidence: PropTypes.number
    })
  )
};

TimeseriesTable.defaultProps = {
  points: []
};

export default TimeseriesTable;

