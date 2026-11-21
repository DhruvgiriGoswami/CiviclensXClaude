// Dedupe by id (first wins), then rank: exact match, then prefix on a word, then anywhere.
export function rankSearch(items, query, { key = (x) => x.id, label = (x) => x.label ?? x.name ?? '', limit = 10 } = {}) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return [];
  const seen = new Set();
  const scored = [];
  items.forEach((item, order) => {
    const id = key(item);
    if (seen.has(id)) return;
    const text = String(label(item)).toLowerCase();
    const idText = String(id ?? '').toLowerCase();
    let score = -1;
    if (text === q || idText === q) score = 0;
    else if (text.startsWith(q) || idText.startsWith(q)) score = 1;
    else if (text.split(/[\s,/()-]+/).some((w) => w.startsWith(q))) score = 2;
    else if (text.includes(q) || idText.includes(q)) score = 3;
    if (score < 0) return;
    seen.add(id);
    scored.push({ item, score, order });
  });
  scored.sort((a, b) => a.score - b.score || a.order - b.order);
  return scored.slice(0, limit).map((s) => s.item);
}
