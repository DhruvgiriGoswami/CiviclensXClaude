// Splits Claude's Markdown into blocks line by line, so a heading followed directly by a list still renders.
// Returns [{type: 'h', level, text} | {type: 'ul'|'ol', items} | {type: 'p', text}]. No HTML is ever produced.
export function mdBlocks(text) {
  const blocks = [];
  let para = [];
  const flush = () => { if (para.length) blocks.push({ type: 'p', text: para.join(' ') }); para = []; };
  for (const raw of String(text || '').split('\n')) {
    const line = raw.trim();
    const h = line.match(/^(#{1,4})\s+(.*)/);
    const li = line.match(/^[-*]\s+(.*)/) || line.match(/^\d+[.)]\s+(.*)/);
    const kind = line.match(/^[-*]\s/) ? 'ul' : 'ol';
    if (!line || /^(-{3,}|\*{3,})$/.test(line)) { flush(); continue; }
    if (h) { flush(); blocks.push({ type: 'h', level: h[1].length, text: h[2] }); continue; }
    if (li) {
      flush();
      const last = blocks[blocks.length - 1];
      if (last?.type === kind && last.open) last.items.push(li[1]);
      else blocks.push({ type: kind, items: [li[1]], open: true });
      continue;
    }
    const last = blocks[blocks.length - 1];
    if (last?.open && raw.startsWith(' ') && !para.length) { last.items[last.items.length - 1] += ` ${line}`; continue; }
    if (last) last.open = false;
    para.push(line);
  }
  flush();
  return blocks.map(({ open, ...b }) => b); // eslint-disable-line no-unused-vars
}
