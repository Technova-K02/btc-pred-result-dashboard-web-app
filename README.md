## BTC Prediction Result Dashboard

This is a small MERN-style dashboard for exploring the performance of your BTC prediction system using a local MongoDB instance.

### Structure

- **server**: Express + MongoDB API
  - Connects to your local `prediction` database.
  - Exposes analytics endpoints for the `results` and `test_results` collections.
- **client**: Vite + React single-page app
  - Two main views:
    - `Live Results` (uses the `results` collection)
    - `Test Results` (uses the `test_results` collection)
  - Shows summary stats and a simple time-series table.

### Expected MongoDB data

Both collections are expected to have documents shaped roughly like:

```json
{
  "anchor_ts": "2026-03-31T13:30:00.000Z",
  "decision_ts": "2026-03-31T13:32:00.000Z",
  "target_ts": "2026-03-31T13:35:00.000Z",
  "direction_pred": "UP",
  "prob_up": 0.80,
  "confidence": 0.80,
  "buy_price_btc": 66897.69,
  "token_side": "yes",
  "token_price": 81,
  "poly_open_price": 66746.42,
  "poly_close_price": 66827.43,
  "market_direction": "UP",
  "is_correct": true,
  "pnl_multiplier": 1.23,
  "created_at": "2026-03-31T13:32:04.080Z",
  "settled_at": "2026-03-31T13:36:22.499Z"
}
```

Only a subset of fields is required by the dashboard:

- `anchor_ts` (Date)
- `decision_ts` (Date)
- `target_ts` (Date)
- `is_correct` (Boolean)
- `pnl_multiplier` (Number)
- `prob_up` (Number, optional)
- `confidence` (Number, optional)

### Backend: API

From the `server` folder:

```bash
npm install
cp .env.example .env   # adjust if needed
npm run dev
```

The server listens on `http://localhost:4000` by default and provides:

- `GET /api/health` — simple health check.
- `GET /api/results/summary` — summary stats for the `results` collection.
- `GET /api/test_results/summary` — summary stats for the `test_results` collection.
- `GET /api/results/timeseries?interval=1h` — grouped performance over time (15m, 1h, 4h, 1d).
- `GET /api/test_results/timeseries?interval=1h` — same for `test_results`.
- `GET /api/results/recent?limit=200` — most recent predictions from `results`.
- `GET /api/test_results/recent?limit=200` — most recent predictions from `test_results`.

The API uses `anchor_ts` as the reference timestamp for time filtering and bucketing.

Environment variables:

- `MONGODB_URI` (default: `mongodb://127.0.0.1:27017`)
- `MONGODB_DB_NAME` (default: `prediction`)
- `PORT` (default: `4000`)

### Frontend: dashboard

From the `client` folder:

```bash
npm install
npm run dev
```

The Vite dev server runs on `http://localhost:5173` and proxies `/api` calls to the backend.

The React app has:

- Navigation tabs for `Live Results` and `Test Results`.
- Summary cards:
  - Total predictions
  - Correct predictions
  - Accuracy
  - Average PnL multiplier
  - Average `prob_up`
  - Average `confidence`
  - Average decision→target time (seconds)
- Time-series table showing:
  - Bucket start time (UTC)
  - Total predictions in bucket
  - Accuracy
  - Average PnL multiplier
  - Average `prob_up`
  - Average `confidence`

You can quickly compare `results` vs `test_results` by switching tabs; both run identical analytics against different collections.

### Next ideas / extensions

Some natural next steps:

- Add filters (date range, direction, confidence threshold).
- Show PnL curves and drawdowns.
- Separate stratified views for different tokens or venues.
- Export aggregated stats as CSV.

