const inputEl = document.getElementById('recordsInput');
const statusEl = document.getElementById('status');
const saveBtn = document.getElementById('saveBtn');
const loadSampleBtn = document.getElementById('loadSampleBtn');
const transformBtn = document.getElementById('transformBtn');

loadCurrent();

saveBtn.addEventListener('click', async () => {
  try {
    const parsed = parseJsonArray(inputEl.value);
    const response = await sendMessage({ type: 'SAVE_RECORDS', payload: parsed });
    if (!response?.ok) throw new Error('저장 실패');

    statusEl.textContent = `${response.count}개 기록을 저장했습니다.`;
    statusEl.style.color = '#166534';
  } catch (error) {
    statusEl.textContent = error.message;
    statusEl.style.color = '#b91c1c';
  }
});

transformBtn.addEventListener('click', () => {
  try {
    const parsed = parseJsonArray(inputEl.value);
    const transformed = parsed.map(transformPiugameRecord);

    inputEl.value = JSON.stringify(transformed, null, 2);
    statusEl.textContent = `${transformed.length}개 항목을 piurank 입력용으로 변환했습니다.`;
    statusEl.style.color = '#166534';
  } catch (error) {
    statusEl.textContent = error.message;
    statusEl.style.color = '#b91c1c';
  }
});

loadSampleBtn.addEventListener('click', () => {
  inputEl.value = JSON.stringify(
    [
      {
        title: 'Canon-D',
        mode: 'S',
        level: 17,
        score: 998123,
        judge: 'VJ',
        break: 'ON',
        perfect: 1234,
        great: 15,
        good: 3,
        bad: 1,
        miss: 0,
        maxCombo: 1400
      }
    ],
    null,
    2
  );
});

async function loadCurrent() {
  const response = await sendMessage({ type: 'GET_RECORDS' });
  if (response?.ok && Array.isArray(response.records)) {
    inputEl.value = JSON.stringify(response.records.map((v) => v.sourceRaw ?? v), null, 2);
  }
}

function parseJsonArray(rawText) {
  const parsed = JSON.parse(rawText.trim() || '[]');

  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.records)) return parsed.records;
  if (Array.isArray(parsed.data)) return parsed.data;
  if (Array.isArray(parsed.items)) return parsed.items;

  throw new Error('JSON 최상위가 배열이 아니며 records/data/items 배열도 찾지 못했습니다.');
}

function transformPiugameRecord(item) {
  const modeLevelRaw = str(item.modeLevel ?? item.chart ?? item.difficultyText);
  const chartType = normalizeChartType(item.chartType ?? item.mode ?? modeLevelRaw);

  return {
    songTitle: str(item.songTitle ?? item.title ?? item.song ?? item.name),
    chartType,
    level: str(item.level ?? extractLevel(modeLevelRaw)),
    c_seq: str(item.c_seq ?? item.cSeq ?? item.chartSeq),
    score: str(item.score),
    judge: str(item.judge ?? item.gradeType),
    breakMode: str(item.breakMode ?? item.break),
    perfect: str(item.perfect),
    great: str(item.great),
    good: str(item.good),
    bad: str(item.bad),
    miss: str(item.miss),
    maxCombo: str(item.maxCombo ?? item.maxcom)
  };
}

function normalizeChartType(value) {
  const text = str(value).trim().toUpperCase();
  if (text.startsWith('S')) return 'Single';
  if (text.startsWith('D')) return 'Double';
  if (text.startsWith('C')) return 'CO-OP';
  if (['1', 'SINGLE'].includes(text)) return 'Single';
  if (['2', 'DOUBLE'].includes(text)) return 'Double';
  if (['3', 'CO-OP', 'COOP'].includes(text)) return 'CO-OP';
  return value;
}

function extractLevel(modeLevelRaw) {
  const match = str(modeLevelRaw).match(/(\d{1,2})$/);
  return match ? match[1] : '';
}

function str(value) {
  return value === undefined || value === null ? '' : String(value);
}

function sendMessage(message) {
  return new Promise((resolve) => chrome.runtime.sendMessage(message, resolve));
}
