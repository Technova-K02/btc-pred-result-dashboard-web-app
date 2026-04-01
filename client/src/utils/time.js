export function formatUtc9AndEdt(iso, { includeDate = true } = {}) {
  if (!iso) return '';
  const base = new Date(iso);
  if (Number.isNaN(base.getTime())) return '';

  const utc9Minutes = 9 * 60;
  const edtMinutes = -4 * 60;

  function formatWithOffset(offsetMinutes) {
    const d = new Date(base.getTime() + offsetMinutes * 60 * 1000);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mi = String(d.getUTCMinutes()).padStart(2, '0');
    return {
      date: `${yyyy}-${mm}-${dd}`,
      time: `${hh}:${mi}`
    };
  }

  const utc9 = formatWithOffset(utc9Minutes);
  const edt = formatWithOffset(edtMinutes);

  if (includeDate) {
    return `${utc9.date} ${utc9.time} (UTC+9) [${edt.time} EDT]`;
  }

  return `${utc9.time} (UTC+9) [${edt.time} EDT]`;
}

