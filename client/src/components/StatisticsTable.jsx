import PropTypes from 'prop-types';

function formatRange(from, to) {
  if (from == null || to == null) return '–';
  return `${from.toFixed(2)}~${to.toFixed(2)}`;
}

function formatPercent(value) {
  if (value == null) return '–';
  return `${(value * 100).toFixed(1)}%`;
}

function formatNumber(value, digits = 2) {
  if (value == null) return '–';
  return Number(value).toFixed(digits);
}

function StatisticsTable({ buckets }) {
  if (!buckets || buckets.length === 0) {
    return <div className="empty-state">No statistics for this period.</div>;
  }

  const validPnls = buckets
    .map((b) => (typeof b.totalPnl === 'number' ? b.totalPnl : null))
    .filter((v) => v != null);
  const maxTotalPnl = validPnls.length ? Math.max(...validPnls) : null;
  const minTotalPnl = validPnls.length ? Math.min(...validPnls) : null;

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>Flag</th>
            <th>Confidence range</th>
            <th>Accuracy</th>
            <th>Correct / Total</th>
            <th>Total PnL</th>
          </tr>
        </thead>
        <tbody>
          {buckets.map((b) => {
            const isBest = maxTotalPnl != null && b.totalPnl === maxTotalPnl;
            const isWorst = minTotalPnl != null && b.totalPnl === minTotalPnl;
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
              <tr key={b.from} className={rowClass}>
                <td>{flag}</td>
                <td>{formatRange(b.from, b.to)}</td>
                <td>{formatPercent(b.accuracy)}</td>
                <td>
                  {b.correct}/{b.total}
                </td>
                <td>{formatNumber(b.totalPnl)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

StatisticsTable.propTypes = {
  buckets: PropTypes.arrayOf(
    PropTypes.shape({
      from: PropTypes.number,
      to: PropTypes.number,
      total: PropTypes.number,
      correct: PropTypes.number,
      accuracy: PropTypes.number,
      totalPnl: PropTypes.number
    })
  )
};

StatisticsTable.defaultProps = {
  buckets: []
};

export default StatisticsTable;

