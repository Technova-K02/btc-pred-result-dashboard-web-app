require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { connectToDb } = require('./db');
const statsRouter = require('./routes/stats');
const metricsRouter = require('./routes/metrics');

const app = express();

const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', statsRouter);
app.use('/api/metrics', metricsRouter);

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error(err);
  const status = err.statusCode || 500;
  res.status(status).json({
    error: {
      message: err.message || 'Internal server error',
      status
    }
  });
});

async function start() {
  try {
    await connectToDb();
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

start();

