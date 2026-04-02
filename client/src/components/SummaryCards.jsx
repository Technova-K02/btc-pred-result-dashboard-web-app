import PropTypes from 'prop-types';

function formatPercent(value) {
  if (value == null) return '–';
  const pct = value * 100;
  const rounded = Number.isFinite(pct) ? Math.round(pct) : 0;
  return `${rounded}% (${rounded}/100)`;
}

function formatNumber(value, digits = 2) {
  if (value == null) return '–';
  return Number(value).toFixed(digits);
}

function SummaryCards({ summary }) {
  const {
    total,
    correct,
    accuracy,
    totalPnl,
    bestConfidence,
    bestConfidenceTotalPnl,
    bestConfidenceAccuracy
  } = summary || {};

  return (
    <div className="summary-grid">
      <div className="card">
        <div className="card-label">Total Predictions</div>
        <div className="card-value">{total ?? 0}</div>
        <div className="card-sub">Correct: {correct ?? 0}</div>
      </div>

      <div className="card">
        <div className="card-label">Accuracy</div>
        <div className="card-value">{formatPercent(accuracy)}</div>
      </div>

      <div className="card">
        <div className="card-label">Total PnL</div>
        <div className="card-value">{formatNumber(totalPnl)}</div>
      </div>

      <div className="card">
        <div className="card-label">Best Confidence</div>
        <div className="card-value">{formatNumber(bestConfidence, 4)}</div>
      </div>

      <div className="card">
        <div className="card-label">Best Confidence Accuracy</div>
        <div className="card-value">{formatPercent(bestConfidenceAccuracy)}</div>
      </div>

      <div className="card">
        <div className="card-label">Best Confidence Total PnL</div>
        <div className="card-value">{formatNumber(bestConfidenceTotalPnl)}</div>
      </div>
    </div>
  );
}

SummaryCards.propTypes = {
  summary: PropTypes.shape({
    total: PropTypes.number,
    correct: PropTypes.number,
    accuracy: PropTypes.number,
    totalPnl: PropTypes.number,
    bestConfidence: PropTypes.number,
    bestConfidenceTotalPnl: PropTypes.number,
    bestConfidenceAccuracy: PropTypes.number
  })
};

SummaryCards.defaultProps = {
  summary: null
};

export default SummaryCards;

