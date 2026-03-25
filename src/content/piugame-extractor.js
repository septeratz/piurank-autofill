chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'EXTRACT_PIUGAME_RECORDS') return;

  try {
    const records = extractPiugameRecords();
    sendResponse({ ok: true, records });
  } catch (error) {
    sendResponse({ ok: false, error: error.message });
  }
  return true;
});

function extractPiugameRecords() {
  const fromWindow = extractFromWindowCaches();
  if (fromWindow.length) return fromWindow;

  const fromJsonScript = extractFromJsonScripts();
  if (fromJsonScript.length) return fromJsonScript;

  const fromTable = extractFromTables();
  if (fromTable.length) return fromTable;

  return extractFromCards();
}

function extractFromWindowCaches() {
  const candidates = [
    window.__NEXT_DATA__,
    window.__NUXT__,
    window.__APOLLO_STATE__,
    window.__PIUGAME_RECENT_RECORDS__
  ].filter(Boolean);

  const records = [];
  for (const candidate of candidates) {
    walkForRecords(candidate, records);
  }
  return dedupeRecords(records);
}

function extractFromJsonScripts() {
  const records = [];
  const scripts = [...document.querySelectorAll('script[type="application/json"], script#__NEXT_DATA__')];

  for (const script of scripts) {
    const text = script.textContent?.trim();
    if (!text) continue;

    try {
      const parsed = JSON.parse(text);
      walkForRecords(parsed, records);
    } catch (_) {
      // ignore broken JSON blocks
    }
  }

  return dedupeRecords(records);
}

function walkForRecords(node, out) {
  if (!node) return;

  if (Array.isArray(node)) {
    if (node.length && node.every((v) => typeof v === 'object' && v)) {
      node.forEach((item) => {
        const normalized = normalizeRawRecord(item);
        if (normalized.songTitle && (normalized.score || normalized.level)) {
          out.push(normalized);
        }
      });
    }
    node.forEach((child) => walkForRecords(child, out));
    return;
  }

  if (typeof node !== 'object') return;

  for (const [key, value] of Object.entries(node)) {
    const lower = key.toLowerCase();
    const likelyRecords = ['recent', 'record', 'history', 'play', 'scores', 'results'];
    if (likelyRecords.some((k) => lower.includes(k))) {
      walkForRecords(value, out);
      continue;
    }
    if (typeof value === 'object') {
      walkForRecords(value, out);
    }
  }
}

function extractFromTables() {
  const records = [];
  const tables = [...document.querySelectorAll('table')];

  for (const table of tables) {
    const headers = [...table.querySelectorAll('thead th, tr:first-child th, tr:first-child td')].map((th) => clean(th.textContent));
    const rows = [...table.querySelectorAll('tbody tr')];
    if (!rows.length) continue;

    for (const row of rows) {
      const cells = [...row.querySelectorAll('td')].map((td) => clean(td.textContent));
      if (!cells.length) continue;

      const obj = {};
      cells.forEach((cell, idx) => {
        const key = headers[idx] || `col${idx}`;
        obj[key] = cell;
      });

      const normalized = normalizeRawRecord(obj);
      if (normalized.songTitle && (normalized.score || normalized.level)) {
        records.push(normalized);
      }
    }
  }

  return dedupeRecords(records);
}

function extractFromCards() {
  const records = [];
  const candidates = [...document.querySelectorAll('[class*="record"], [class*="history"], [class*="score"], li, article')];

  for (const el of candidates) {
    const text = clean(el.textContent);
    if (!text || text.length < 10) continue;

    const scoreMatch = text.match(/(\d{6})/);
    const levelMatch = text.match(/(?:S|D|SP|DP|Single|Double|CO-?OP)\s*(\d{1,2})/i);
    if (!scoreMatch && !levelMatch) continue;

    const rec = {
      title: guessTitle(text),
      score: scoreMatch?.[1] ?? '',
      modeLevel: levelMatch ? `${levelMatch[0]}` : ''
    };
    const normalized = normalizeRawRecord(rec);
    if (normalized.songTitle) records.push(normalized);
  }

  return dedupeRecords(records).slice(0, 50);
}

function normalizeRawRecord(item) {
  const modeLevelRaw = str(
    item.modeLevel ?? item.chart ?? item.difficultyText ?? item.mode_level ?? item.modeLevelText
  );

  return {
    songTitle: str(item.songTitle ?? item.title ?? item.song ?? item.name ?? item['곡'] ?? item['곡명']),
    chartType: normalizeChartType(item.chartType ?? item.mode ?? item['모드'] ?? modeLevelRaw),
    level: str(item.level ?? item.lv ?? item['레벨'] ?? extractLevel(modeLevelRaw)),
    score: str(item.score ?? item['스코어'] ?? item.points),
    judge: str(item.judge ?? item.gradeType ?? item.grade ?? item['판정']),
    breakMode: str(item.breakMode ?? item.break ?? item['브레이크']),
    perfect: str(item.perfect ?? item['퍼펙트']),
    great: str(item.great ?? item['그레이트']),
    good: str(item.good ?? item['굿']),
    bad: str(item.bad ?? item['배드']),
    miss: str(item.miss ?? item['미스']),
    maxCombo: str(item.maxCombo ?? item.maxcom ?? item['맥스콤보'])
  };
}

function dedupeRecords(records) {
  const map = new Map();
  records.forEach((r) => {
    const key = `${r.songTitle}|${r.chartType}|${r.level}|${r.score}|${r.perfect}|${r.great}|${r.good}|${r.bad}|${r.miss}`;
    if (r.songTitle && !map.has(key)) map.set(key, r);
  });
  return [...map.values()];
}

function normalizeChartType(value) {
  const text = str(value).trim().toUpperCase();
  if (!text) return '';
  if (text.startsWith('S')) return 'Single';
  if (text.startsWith('D')) return 'Double';
  if (text.startsWith('C')) return 'CO-OP';
  if (['1', 'SINGLE'].includes(text)) return 'Single';
  if (['2', 'DOUBLE'].includes(text)) return 'Double';
  if (['3', 'CO-OP', 'COOP'].includes(text)) return 'CO-OP';
  return str(value);
}

function extractLevel(modeLevelRaw) {
  const match = str(modeLevelRaw).match(/(\d{1,2})$/);
  return match ? match[1] : '';
}

function guessTitle(text) {
  const firstLine = text.split('\n').map((v) => v.trim()).find(Boolean) ?? '';
  return firstLine.replace(/\s{2,}/g, ' ').slice(0, 120);
}

function clean(value) {
  return str(value).replace(/\s+/g, ' ').trim();
}

function str(value) {
  return value === undefined || value === null ? '' : String(value);
}
