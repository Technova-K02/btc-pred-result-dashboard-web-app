import PropTypes from 'prop-types';

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
    bestConfidenceAccuracy,
    bestConfidenceTotal,
    bestConfidenceCorrect
  } = summary || {};

  const accuracyPct =
    accuracy != null && Number.isFinite(accuracy) ? Math.round(accuracy * 100) : null;
  const bestAccuracyPct =
    bestConfidenceAccuracy != null && Number.isFinite(bestConfidenceAccuracy)
      ? Math.round(bestConfidenceAccuracy * 100)
      : null;

  return (
    <div className="summary-grid">
      <div className="card">
        <div className="card-label">Total Predictions</div>
        <div className="card-value">{total ?? 0}</div>
        <div className="card-sub">Correct: {correct ?? 0}</div>
      </div>

      <div className="card">
        <div className="card-label">Accuracy</div>
        <div className="card-value">
          {accuracyPct == null
            ? '–'
            : `${accuracyPct}% (${correct ?? 0}/${total ?? 0})`}
        </div>
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
        <div className="card-value">
          {bestAccuracyPct == null
            ? '–'
            : `${bestAccuracyPct}% (${bestConfidenceCorrect ?? 0}/${bestConfidenceTotal ?? 0})`}
        </div>
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
    bestConfidenceAccuracy: PropTypes.number,
    bestConfidenceTotal: PropTypes.number,
    bestConfidenceCorrect: PropTypes.number
  })
};

SummaryCards.defaultProps = {
  summary: null
};

export default SummaryCards;

