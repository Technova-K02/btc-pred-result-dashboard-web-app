const express = require('express');

const router = express.Router();

const visitors = new Map();

function toUtc9DayKey(date) {
  const d = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function computeMetrics() {
  const now = new Date();
  const onlineWindowMs = 2 * 60 * 1000;
  const todayKey = toUtc9DayKey(now);

  let online = 0;
  const todaySet = new Set();

  visitors.forEach((value, clientId) => {
    if (now - value.lastSeen <= onlineWindowMs) {
      online += 1;
    }
    if (toUtc9DayKey(value.firstSeen) === todayKey) {
      todaySet.add(clientId);
    }
  });

  return {
    online,
    todayTotal: todaySet.size
  };
}

router.post('/heartbeat', (req, res) => {
  const { clientId } = req.body || {};

  if (!clientId) {
    res.status(400).json({ error: 'clientId is required' });
    return;
  }

  const now = new Date();
  const existing = visitors.get(clientId);

  if (existing) {
    existing.lastSeen = now;
  } else {
    visitors.set(clientId, {
      firstSeen: now,
      lastSeen: now
    });
  }

  const metrics = computeMetrics();

  res.json({
    clientId,
    ...metrics
  });
});

router.get('/visitors', (req, res) => {
  const metrics = computeMetrics();
  res.json(metrics);
});

module.exports = router;

