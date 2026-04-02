import PropTypes from 'prop-types';
import { formatUtc9AndEdt } from '../utils/time.js';

function formatNumber(value, digits = 2) {
  if (value == null) return '–';
  return Number(value).toFixed(digits);
}

function formatPercent(value) {
  if (value == null) return '–';
  return `${(value * 100).toFixed(1)}%`;
}

function formatUtc9Date(iso) {
  const text = formatUtc9AndEdt(iso, { includeDate: true });
  if (!text) return '';
  return text.slice(0, 10);
}

function DailyPnlTable({ rows }) {
  if (!rows || rows.length === 0) {
    return <div className="empty-state">No daily PnL data for this period.</div>;
  }

  const pnls = rows
    .map((r) => (typeof r.totalPnl === 'number' ? r.totalPnl : null))
    .filter((v) => v != null);
  const maxTotalPnl = pnls.length ? Math.max(...pnls) : null;
  const minTotalPnl = pnls.length ? Math.min(...pnls) : null;

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>Flag</th>
            <th>Date (UTC+9)</th>
            <th>Accuracy</th>
            <th>Correct / Total</th>
            <th>Total PnL</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isBest = maxTotalPnl != null && row.totalPnl === maxTotalPnl;
            const isWorst = minTotalPnl != null && row.totalPnl === minTotalPnl;
            let flag = '';
            if (isBest && isWorst) {
              flag = 'Best/Worst';
            } else if (isBest) {
              flag = 'Best';
            } else if (isWorst) {
              flag = 'Worst';
            }
            const rowClass = isBest ? 'best-row' : isWorst ? 'worst-row' : '';

            return (
              <tr key={row.date} className={rowClass}>
                <td>{flag}</td>
                <td>{formatUtc9Date(row.date)}</td>
                <td>{formatPercent(row.accuracy)}</td>
                <td>
                  {row.correct}/{row.total}
                </td>
                <td>{formatNumber(row.totalPnl)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

DailyPnlTable.propTypes = {
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string,
      total: PropTypes.number,
      correct: PropTypes.number,
      accuracy: PropTypes.number,
      totalPnl: PropTypes.number
    })
  )
};

DailyPnlTable.defaultProps = {
  rows: []
};

export default DailyPnlTable;

