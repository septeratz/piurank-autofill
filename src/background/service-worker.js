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

  if (message.type === 'IMPORT_FROM_PIUGAME_TAB') {
    importFromPiugameTab()
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
});

async function importFromPiugameTab() {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab?.id || !activeTab.url) {
    return { ok: false, error: '활성 탭을 찾지 못했습니다.' };
  }

  const isPiugame = /https:\/\/(www\.)?piugame\.com\//.test(activeTab.url);
  if (!isPiugame) {
    return { ok: false, error: '활성 탭이 piugame.com이 아닙니다.' };
  }

  const response = await chrome.tabs.sendMessage(activeTab.id, { type: 'EXTRACT_PIUGAME_RECORDS' });
  if (!response?.ok) {
    return { ok: false, error: response?.error ?? 'piugame 기록 추출 실패' };
  }

  const normalized = normalizeRecords(response.records ?? []);
  if (!normalized.length) {
    return { ok: false, error: '추출된 기록이 없습니다. 최근기록 페이지인지 확인해주세요.' };
  }

  await chrome.storage.local.set({ [STORAGE_KEY]: normalized });
  return { ok: true, count: normalized.length, records: normalized };
}

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
