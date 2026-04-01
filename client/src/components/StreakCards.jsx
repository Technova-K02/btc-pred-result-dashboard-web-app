import PropTypes from 'prop-types';
import { formatUtc9AndEdt } from '../utils/time.js';

function formatNumber(value, digits = 2) {
  if (value == null) return '–';
  return Number(value).toFixed(digits);
}

function StreakCards({ streaks }) {
  if (!streaks) {
    return null;
  }

  const { maxEarning, maxLoss } = streaks;

  return (
    <div className="summary-grid">
      <div className="card">
        <div className="card-label">Max Earning Period</div>
        {maxEarning ? (
          <>
            <div className="card-value">{formatNumber(maxEarning.totalPnl)}</div>
            <div className="card-sub">
              {formatUtc9AndEdt(maxEarning.start_ts)} → {formatUtc9AndEdt(maxEarning.end_ts)}
            </div>
            <div className="card-sub">Length: {maxEarning.length} trades</div>
          </>
        ) : (
          <div className="card-sub">Not enough data.</div>
        )}
      </div>

      <div className="card">
        <div className="card-label">Max Loss Period</div>
        {maxLoss ? (
          <>
            <div className="card-value">{formatNumber(maxLoss.totalPnl)}</div>
            <div className="card-sub">
              {formatUtc9AndEdt(maxLoss.start_ts)} → {formatUtc9AndEdt(maxLoss.end_ts)}
            </div>
            <div className="card-sub">Length: {maxLoss.length} trades</div>
          </>
        ) : (
          <div className="card-sub">Not enough data.</div>
        )}
      </div>
    </div>
  );
}

StreakCards.propTypes = {
  streaks: PropTypes.shape({
    maxEarning: PropTypes.shape({
      totalPnl: PropTypes.number,
      start_ts: PropTypes.string,
      end_ts: PropTypes.string,
      length: PropTypes.number
    }),
    maxLoss: PropTypes.shape({
      totalPnl: PropTypes.number,
      start_ts: PropTypes.string,
      end_ts: PropTypes.string,
      length: PropTypes.number
    })
  })
};

StreakCards.defaultProps = {
  streaks: null
};

export default StreakCards;

