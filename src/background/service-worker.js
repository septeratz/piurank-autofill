const STORAGE_KEY = 'piuRecords';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get([STORAGE_KEY], ({ [STORAGE_KEY]: existing }) => {
    if (!Array.isArray(existing)) {
      chrome.storage.local.set({ [STORAGE_KEY]: [] });
    }
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message?.type) return;

  if (message.type === 'SAVE_RECORDS') {
    const normalized = normalizeRecords(message.payload ?? []);
    chrome.storage.local.set({ [STORAGE_KEY]: normalized }, () => {
      sendResponse({ ok: true, count: normalized.length });
    });
    return true;
  }

  if (message.type === 'GET_RECORDS') {
    chrome.storage.local.get([STORAGE_KEY], ({ [STORAGE_KEY]: records }) => {
      sendResponse({ ok: true, records: Array.isArray(records) ? records : [] });
    });
    return true;
  }
});

function normalizeRecords(records) {
  return records
    .filter((item) => item && typeof item === 'object')
    .map((item, index) => ({
      id: item.id ?? `record-${index + 1}`,
      songTitle: item.songTitle ?? item.title ?? item.song ?? item.pi_title ?? '',
      chartType: normalizeChartType(item.chartType ?? item.chart ?? item.mode ?? item.pi_mode),
      level: str(item.level ?? item.difficulty ?? item.pi_level),
      cSeq: str(item.cSeq ?? item.c_seq ?? item.pi_c_seq),
      score: str(item.score ?? item.pi_score),
      grade: str(item.grade ?? item.pi_grade),
      judge: str(item.judge ?? item.pi_judge),
      breakMode: str(item.breakMode ?? item.break ?? item.pi_break),
      perfect: str(item.perfect ?? item.pi_perfect),
      great: str(item.great ?? item.pi_great),
      good: str(item.good ?? item.pi_good),
      bad: str(item.bad ?? item.pi_bad),
      miss: str(item.miss ?? item.pi_miss),
      maxCombo: str(item.maxCombo ?? item.maxcom ?? item.pi_maxcom),
      playedAt: str(item.playedAt ?? item.date),
      sourceRaw: item
    }));
}

function str(value) {
  return value === undefined || value === null ? '' : String(value);
}

function normalizeChartType(value) {
  const text = str(value).trim().toUpperCase();
  if (!text) return '';

  if (['S', 'SINGLE', '1'].includes(text)) return 'Single';
  if (['D', 'DOUBLE', '2'].includes(text)) return 'Double';
  if (['COOP', 'CO-OP', 'CO_OP', '3'].includes(text)) return 'CO-OP';

  return value;
}
