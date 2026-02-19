const inputEl = document.getElementById('recordsInput');
const statusEl = document.getElementById('status');
const saveBtn = document.getElementById('saveBtn');
const loadSampleBtn = document.getElementById('loadSampleBtn');

loadCurrent();

saveBtn.addEventListener('click', async () => {
  try {
    const parsed = JSON.parse(inputEl.value.trim() || '[]');
    if (!Array.isArray(parsed)) {
      throw new Error('JSON 최상위는 배열이어야 합니다.');
    }

    const response = await sendMessage({ type: 'SAVE_RECORDS', payload: parsed });
    if (!response?.ok) throw new Error('저장 실패');

    statusEl.textContent = `${response.count}개 기록을 저장했습니다.`;
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
        songTitle: 'Canon-D',
        chartType: 'Single',
        level: 17,
        c_seq: 12345,
        score: 998123,
        judge: 'VJ',
        breakMode: 'ON',
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

function sendMessage(message) {
  return new Promise((resolve) => chrome.runtime.sendMessage(message, resolve));
}
