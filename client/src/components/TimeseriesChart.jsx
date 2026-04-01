import PropTypes from 'prop-types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { formatUtc9AndEdt } from '../utils/time.js';

function TimeseriesChart({ points, bestAccuracy }) {
  if (!points || points.length === 0) {
    return null;
  }

  const data = points.map((p) => ({
    ...p,
    accuracyPct: p.accuracy != null ? p.accuracy * 100 : null
  }));

  return (
    <div className="chart-card">
      <h3>Best-confidence Accuracy and Total PnL over time</h3>
      <div className="chart-scroll">
        <div className="chart-inner">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis
                dataKey="bucket_start"
                tickFormatter={(value) => formatUtc9AndEdt(value, { includeDate: false })}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                label={{
                  value: 'Total PnL',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 10,
                  fill: '#e5e7eb',
                  fontSize: 11
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                label={{
                  value: 'Accuracy (%)',
                  angle: -90,
                  position: 'insideRight',
                  offset: 10,
                  fill: '#e5e7eb',
                  fontSize: 11
                }}
              />
              <Tooltip
                contentStyle={{
                  background: '#020617',
                  border: '1px solid rgba(148,163,184,0.5)',
                  borderRadius: 8,
                  fontSize: 12
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="totalPnl"
                name="Total PnL"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="accuracyPct"
                name="Accuracy (%)"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={false}
              />
              {bestAccuracy != null && (
                <ReferenceLine
                  yAxisId="right"
                  y={bestAccuracy * 100}
                  stroke="#f97316"
                  strokeDasharray="4 4"
                  label={{
                    position: 'insideTopRight',
                    value: 'Best Conf. Acc.',
                    fill: '#f97316',
                    fontSize: 10
                  }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

TimeseriesChart.propTypes = {
  points: PropTypes.arrayOf(
    PropTypes.shape({
      bucket_start: PropTypes.string,
      totalPnl: PropTypes.number,
      accuracy: PropTypes.number
    })
  ),
  bestAccuracy: PropTypes.number
};

TimeseriesChart.defaultProps = {
  points: [],
  bestAccuracy: null
};

export default TimeseriesChart;

