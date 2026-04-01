import { useEffect, useState } from 'react';

function getOrCreateClientId() {
  if (typeof window === 'undefined') return null;
  const key = 'btc_dashboard_client_id';
  let existing = window.localStorage.getItem(key);
  if (existing) return existing;

  const random = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(key, random);
  return random;
}

function VisitorStats() {
  const [online, setOnline] = useState(null);
  const [todayTotal, setTodayTotal] = useState(null);

  useEffect(() => {
    const clientId = getOrCreateClientId();
    if (!clientId) return;

    let cancelled = false;

    async function heartbeat() {
      try {
        const res = await fetch('/api/metrics/heartbeat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ clientId })
        });
        if (!res.ok) {
          // eslint-disable-next-line no-console
          console.error('Heartbeat failed', res.status);
          return;
        }
        const json = await res.json();
        if (!cancelled) {
          setOnline(json.online ?? null);
          setTodayTotal(json.todayTotal ?? null);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
      }
    }

    heartbeat();
    const id = setInterval(heartbeat, 30 * 1000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="visitor-stats">
      <span>
        Online: <strong>{online != null ? online : '–'}</strong>
      </span>
      <span>
        Today: <strong>{todayTotal != null ? todayTotal : '–'}</strong>
      </span>
    </div>
  );
}

export default VisitorStats;

