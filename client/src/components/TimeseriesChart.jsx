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
  ReferenceLine,
  Area
} from 'recharts';
import { formatUtc9AndEdt } from '../utils/time.js';

function TimeseriesChart({ points }) {
  if (!points || points.length === 0) {
    return null;
  }

  const data = points.map((p) => {
    const v = typeof p.totalPnl === 'number' ? p.totalPnl : 0;
    return {
      ...p,
      totalPnl: v,
      pnlPositive: v > 0 ? v : 0,
      pnlNegative: v < 0 ? v : 0
    };
  });

  const pnlValues = data
    .map((p) => p.totalPnl)
    .filter((v) => Number.isFinite(v));
  const maxPnL = pnlValues.length ? Math.max(...pnlValues) : 0;
  const minPnL = pnlValues.length ? Math.min(...pnlValues) : 0;
  const maxAbs = Math.max(Math.abs(maxPnL), Math.abs(minPnL), 0.1);
  const padding = maxAbs * 0.2;
  const yMin = -maxAbs - padding;
  const yMax = maxAbs + padding;

  return (
    <div className="chart-card">
      <h3>Best-confidence Total PnL over time</h3>
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
            domain={[yMin, yMax]}
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
          <Tooltip
            contentStyle={{
              background: '#020617',
              border: '1px solid rgba(148,163,184,0.5)',
              borderRadius: 8,
              fontSize: 12
            }}
          />
          <Legend />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="pnlPositive"
            stroke="none"
            fill="#4ade80"
            fillOpacity={0.4}
            activeDot={false}
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="pnlNegative"
            stroke="none"
            fill="#f97373"
            fillOpacity={0.4}
            activeDot={false}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="totalPnl"
            name="Total PnL"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
          />
          <ReferenceLine
            yAxisId="left"
            y={0}
            stroke="#e5e7eb"
            strokeWidth={1.6}
            strokeDasharray="4 4"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

TimeseriesChart.propTypes = {
  points: PropTypes.arrayOf(
    PropTypes.shape({
      bucket_start: PropTypes.string,
      totalPnl: PropTypes.number
    })
  )
};

TimeseriesChart.defaultProps = {
  points: []
};

export default TimeseriesChart;

