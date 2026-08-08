export async function fetchSummary(lat, lon) {
  const res = await fetch(`/api/forecast?lat=${lat}&lon=${lon}`);
  return res.json();
}

export async function ask(lat, lon, question) {
  const res = await fetch('/api/qa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lat, lon, question }) });
  return res.json();
}
