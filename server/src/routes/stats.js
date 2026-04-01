const express = require('express');
const { getDb } = require('../db');

const router = express.Router();

const ALLOWED_COLLECTIONS = ['results', 'test_results'];

function getCollectionName(param) {
  if (!ALLOWED_COLLECTIONS.includes(param)) {
    const msg = `Invalid collection "${param}". Allowed: ${ALLOWED_COLLECTIONS.join(', ')}`;
    const err = new Error(msg);
    err.statusCode = 400;
    throw err;
  }
  return param;
}

function buildTimeRangeMatch(query) {
  const { from, to } = query;
  const timeFilter = {};

  if (from) {
    const fromDate = new Date(from);
    if (!Number.isNaN(fromDate.getTime())) {
      timeFilter.$gte = fromDate;
    }
  }
  if (to) {
    const toDate = new Date(to);
    if (!Number.isNaN(toDate.getTime())) {
      timeFilter.$lte = toDate;
    }
  }

  if (Object.keys(timeFilter).length === 0) {
    return {};
  }

  // Use anchor_ts as the primary reference timestamp for analysis
  return { anchor_ts: timeFilter };
}

router.get('/:collection/summary', async (req, res, next) => {
  try {
    const collectionName = getCollectionName(req.params.collection);
    const db = getDb();
    const collection = db.collection(collectionName);

    const matchStage = buildTimeRangeMatch(req.query);

    const effectivePnlExpr = {
      $cond: [
        { $gt: ['$pnl_multiplier', 0] },
        { $subtract: ['$pnl_multiplier', 1] },
        '$pnl_multiplier'
      ]
    };

    const summaryPipeline = [
      Object.keys(matchStage).length ? { $match: matchStage } : null,
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          correct: {
            $sum: {
              $cond: [{ $eq: ['$is_correct', true] }, 1, 0]
            }
          },
          totalPnl: { $sum: effectivePnlExpr },
          avgProbUp: { $avg: '$prob_up' },
          avgConfidence: { $avg: '$confidence' }
        }
      },
      {
        $project: {
          _id: 0,
          total: 1,
          correct: 1,
          accuracy: {
            $cond: [
              { $gt: ['$total', 0] },
              { $divide: ['$correct', '$total'] },
              null
            ]
          },
          totalPnl: 1,
          avgProbUp: 1,
          avgConfidence: 1
        }
      }
    ].filter(Boolean);

    const [summaryDoc = null] = await collection.aggregate(summaryPipeline).toArray();

    const bestConfidencePipeline = [
      Object.keys(matchStage).length ? { $match: matchStage } : null,
      {
        $addFields: {
          effectivePnl: effectivePnlExpr
        }
      },
      { $sort: { confidence: -1 } },
      {
        $setWindowFields: {
          sortBy: { confidence: -1 },
          output: {
            cumulativePnl: {
              $sum: '$effectivePnl',
              window: { documents: ['unbounded', 'current'] }
            },
            cumulativeTotal: {
              $sum: 1,
              window: { documents: ['unbounded', 'current'] }
            },
            cumulativeCorrect: {
              $sum: {
                $cond: [{ $eq: ['$is_correct', true] }, 1, 0]
              },
              window: { documents: ['unbounded', 'current'] }
            }
          }
        }
      },
      {
        $addFields: {
          thresholdAccuracy: {
            $cond: [
              { $gt: ['$cumulativeTotal', 0] },
              { $divide: ['$cumulativeCorrect', '$cumulativeTotal'] },
              null
            ]
          }
        }
      },
      { $sort: { cumulativePnl: -1 } },
      { $limit: 1 },
      {
        $project: {
          _id: 0,
          confidence: 1,
          cumulativePnl: 1,
          thresholdAccuracy: 1
        }
      }
    ].filter(Boolean);

    const [bestDoc = null] = await collection.aggregate(bestConfidencePipeline).toArray();

    const summary = summaryDoc
      ? {
          ...summaryDoc,
          bestConfidence: bestDoc ? bestDoc.confidence : null,
          bestConfidenceTotalPnl: bestDoc ? bestDoc.cumulativePnl : null,
          bestConfidenceAccuracy: bestDoc ? bestDoc.thresholdAccuracy : null
        }
      : {
          total: 0,
          correct: 0,
          accuracy: null,
          totalPnl: 0,
          avgProbUp: null,
          avgConfidence: null,
          bestConfidence: null,
          bestConfidenceTotalPnl: null,
          bestConfidenceAccuracy: null
        };

    res.json({
      collection: collectionName,
      range: {
        from: req.query.from || null,
        to: req.query.to || null
      },
      summary
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:collection/timeseries', async (req, res, next) => {
  try {
    const collectionName = getCollectionName(req.params.collection);
    const db = getDb();
    const collection = db.collection(collectionName);

    const { interval = '1h' } = req.query;
    const matchStage = buildTimeRangeMatch(req.query);

    const intervalConfig = {
      '5m': { unit: 'minute', binSize: 5 },
      '15m': { unit: 'minute', binSize: 15 },
      '1h': { unit: 'hour', binSize: 1 },
      '4h': { unit: 'hour', binSize: 4 },
      '1d': { unit: 'day', binSize: 1 }
    }[interval] || { unit: 'hour', binSize: 1 };

    const effectivePnlExpr = {
      $cond: [
        { $gt: ['$pnl_multiplier', 0] },
        { $subtract: ['$pnl_multiplier', 1] },
        '$pnl_multiplier'
      ]
    };

    const bestConfidencePipeline = [
      Object.keys(matchStage).length ? { $match: matchStage } : null,
      {
        $addFields: {
          effectivePnl: effectivePnlExpr
        }
      },
      { $sort: { confidence: -1 } },
      {
        $setWindowFields: {
          sortBy: { confidence: -1 },
          output: {
            cumulativePnl: {
              $sum: '$effectivePnl',
              window: { documents: ['unbounded', 'current'] }
            }
          }
        }
      },
      { $sort: { cumulativePnl: -1 } },
      { $limit: 1 },
      {
        $project: {
          _id: 0,
          confidence: 1
        }
      }
    ].filter(Boolean);

    const [bestDoc = null] = await collection.aggregate(bestConfidencePipeline).toArray();
    const threshold = bestDoc ? bestDoc.confidence : null;

    const timeseriesMatch = { ...matchStage };
    if (threshold != null) {
      timeseriesMatch.confidence = { $gte: threshold };
    }

    const pipeline = [
      Object.keys(timeseriesMatch).length ? { $match: timeseriesMatch } : null,
      {
        $group: {
          _id: {
            $dateTrunc: {
              date: '$anchor_ts',
              unit: intervalConfig.unit,
              binSize: intervalConfig.binSize,
              timezone: 'UTC'
            }
          },
          total: { $sum: 1 },
          correct: {
            $sum: {
              $cond: [{ $eq: ['$is_correct', true] }, 1, 0]
            }
          },
          totalPnl: { $sum: effectivePnlExpr },
          avgProbUp: { $avg: '$prob_up' },
          avgConfidence: { $avg: '$confidence' }
        }
      },
      {
        $project: {
          _id: 0,
          bucket_start: '$_id',
          total: 1,
          correct: 1,
          accuracy: {
            $cond: [
              { $gt: ['$total', 0] },
              { $divide: ['$correct', '$total'] },
              null
            ]
          },
          totalPnl: 1,
          avgProbUp: 1,
          avgConfidence: 1
        }
      },
      { $sort: { bucket_start: 1 } }
    ].filter(Boolean);

    const points = await collection.aggregate(pipeline).toArray();

    res.json({
      collection: collectionName,
      interval,
      range: {
        from: req.query.from || null,
        to: req.query.to || null
      },
      confidenceThreshold: threshold,
      points
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:collection/recent', async (req, res, next) => {
  try {
    const collectionName = getCollectionName(req.params.collection);
    const db = getDb();
    const collection = db.collection(collectionName);

    const limit = Number.parseInt(req.query.limit, 10) || 200;

    const docs = await collection
      .find({})
      .sort({ anchor_ts: -1 })
      .limit(Math.min(limit, 1000))
      .toArray();

    res.json({
      collection: collectionName,
      count: docs.length,
      items: docs
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:collection/streaks', async (req, res, next) => {
  try {
    const collectionName = getCollectionName(req.params.collection);
    const db = getDb();
    const collection = db.collection(collectionName);

    const matchStage = buildTimeRangeMatch(req.query);
    const query = Object.keys(matchStage).length ? matchStage : {};

    const cursor = collection
      .find(query)
      .project({ anchor_ts: 1, pnl_multiplier: 1 })
      .sort({ anchor_ts: 1 });

    const points = await cursor.toArray();

    if (!points.length) {
      res.json({
        collection: collectionName,
        range: {
          from: req.query.from || null,
          to: req.query.to || null
        },
        maxEarning: null,
        maxLoss: null
      });
      return;
    }

    const series = points.map((doc) => {
      const raw = typeof doc.pnl_multiplier === 'number' ? doc.pnl_multiplier : 0;
      const effective =
        raw > 0
          ? raw - 1
          : raw;

      return {
        ts: doc.anchor_ts,
        pnl: effective
      };
    });

    let maxSoFar = -Infinity;
    let maxEndingHere = 0;
    let maxStart = 0;
    let maxEnd = 0;
    let tempStart = 0;

    let minSoFar = Infinity;
    let minEndingHere = 0;
    let minStart = 0;
    let minEnd = 0;
    let tempMinStart = 0;

    series.forEach((point, idx) => {
      const value = point.pnl;

      if (maxEndingHere <= 0) {
        maxEndingHere = value;
        tempStart = idx;
      } else {
        maxEndingHere += value;
      }

      if (maxEndingHere > maxSoFar) {
        maxSoFar = maxEndingHere;
        maxStart = tempStart;
        maxEnd = idx;
      }

      if (minEndingHere >= 0) {
        minEndingHere = value;
        tempMinStart = idx;
      } else {
        minEndingHere += value;
      }

      if (minEndingHere < minSoFar) {
        minSoFar = minEndingHere;
        minStart = tempMinStart;
        minEnd = idx;
      }
    });

    const maxEarning =
      maxSoFar === -Infinity
        ? null
        : {
            totalPnl: maxSoFar,
            start_ts: series[maxStart].ts,
            end_ts: series[maxEnd].ts,
            length: maxEnd - maxStart + 1
          };

    const maxLoss =
      minSoFar === Infinity
        ? null
        : {
            totalPnl: minSoFar,
            start_ts: series[minStart].ts,
            end_ts: series[minEnd].ts,
            length: minEnd - minStart + 1
          };

    res.json({
      collection: collectionName,
      range: {
        from: req.query.from || null,
        to: req.query.to || null
      },
      maxEarning,
      maxLoss
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:collection/statistics', async (req, res, next) => {
  try {
    const collectionName = getCollectionName(req.params.collection);
    const db = getDb();
    const collection = db.collection(collectionName);

    const matchStage = buildTimeRangeMatch(req.query);

    const minConfidence = 0.5;
    const bucketSize = 0.05;
    const bucketCount = 10; // 0.50-0.55, ..., 0.95-1.00

    const effectivePnlExpr = {
      $cond: [
        { $gt: ['$pnl_multiplier', 0] },
        { $subtract: ['$pnl_multiplier', 1] },
        '$pnl_multiplier'
      ]
    };

    const pipeline = [
      Object.keys(matchStage).length ? { $match: matchStage } : null,
      {
        $match: {
          confidence: { $gte: minConfidence, $lte: 1 }
        }
      },
      {
        $addFields: {
          bucketIndex: {
            $floor: {
              $divide: [
                { $subtract: ['$confidence', minConfidence] },
                bucketSize
              ]
            }
          }
        }
      },
      {
        $match: {
          bucketIndex: { $gte: 0, $lt: bucketCount }
        }
      },
      {
        $group: {
          _id: '$bucketIndex',
          total: { $sum: 1 },
          correct: {
            $sum: {
              $cond: [{ $eq: ['$is_correct', true] }, 1, 0]
            }
          },
          totalPnl: { $sum: effectivePnlExpr }
        }
      },
      {
        $project: {
          _id: 0,
          bucketIndex: '$_id',
          total: 1,
          correct: 1,
          totalPnl: 1
        }
      },
      { $sort: { bucketIndex: 1 } }
    ].filter(Boolean);

    const rows = await collection.aggregate(pipeline).toArray();
    const byIndex = new Map(rows.map((r) => [r.bucketIndex, r]));

    const buckets = [];
    for (let i = 0; i < bucketCount; i += 1) {
      const from = minConfidence + i * bucketSize;
      const to = from + bucketSize;
      const row = byIndex.get(i);
      const total = row ? row.total : 0;
      const correct = row ? row.correct : 0;
      const totalPnl = row ? row.totalPnl : 0;

      buckets.push({
        from,
        to,
        total,
        correct,
        accuracy: total > 0 ? correct / total : null,
        totalPnl
      });
    }

    res.json({
      collection: collectionName,
      range: {
        from: req.query.from || null,
        to: req.query.to || null
      },
      buckets
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:collection/dates', async (req, res, next) => {
  try {
    const collectionName = getCollectionName(req.params.collection);
    const db = getDb();
    const collection = db.collection(collectionName);

    const matchStage = buildTimeRangeMatch(req.query);

    const pipeline = [
      Object.keys(matchStage).length ? { $match: matchStage } : null,
      {
        $group: {
          _id: {
            $dateTrunc: {
              date: '$anchor_ts',
              unit: 'day',
              timezone: 'UTC'
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ].filter(Boolean);

    const docs = await collection.aggregate(pipeline).toArray();
    const dates = docs
      .map((d) => (d._id instanceof Date ? d._id.toISOString().slice(0, 10) : null))
      .filter(Boolean);

    res.json({
      collection: collectionName,
      dates
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

