const PANEL_ID = 'piurank-autofill-panel';

init().catch((error) => {
  console.error('[PIURank Autofill] initialization failed', error);
});

async function init() {
  if (document.getElementById(PANEL_ID)) return;

  const response = await sendMessage({ type: 'GET_RECORDS' });
  const records = response?.records ?? [];

  const panel = buildPanel(records);
  document.body.appendChild(panel);
}

function buildPanel(records) {
  const wrap = document.createElement('section');
  wrap.id = PANEL_ID;
  wrap.style.cssText = [
    'position: fixed',
    'right: 12px',
    'bottom: 12px',
    'z-index: 2147483647',
    'width: 340px',
    'background: #111827',
    'color: #f9fafb',
    'border-radius: 10px',
    'padding: 10px',
    'box-shadow: 0 10px 20px rgba(0,0,0,0.25)',
    'font-family: Arial, sans-serif',
    'font-size: 12px'
  ].join(';');

  const title = document.createElement('div');
  title.textContent = 'PIURank Autofill';
  title.style.fontWeight = '700';
  title.style.marginBottom = '8px';

  const desc = document.createElement('div');
  desc.textContent = 'playinfo/write 페이지 전용 자동 입력';
  desc.style.color = '#9ca3af';
  desc.style.marginBottom = '8px';

  const select = document.createElement('select');
  select.style.cssText = 'width:100%;padding:6px;border-radius:8px;margin-bottom:8px;';

  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = records.length ? '기록을 선택하세요' : '저장된 기록이 없습니다';
  select.appendChild(defaultOption);

  records.forEach((record) => {
    const option = document.createElement('option');
    option.value = record.id;
    option.textContent = makeRecordLabel(record);
    select.appendChild(option);
  });

  const fillBtn = document.createElement('button');
  fillBtn.type = 'button';
  fillBtn.textContent = '폼에 입력';
  fillBtn.style.cssText = 'width:100%;padding:8px;border:none;border-radius:8px;background:#2563eb;color:#fff;cursor:pointer;';

  const status = document.createElement('p');
  status.style.cssText = 'margin:8px 0 0;min-height:30px;color:#d1d5db;white-space:pre-line;';

  fillBtn.addEventListener('click', () => {
    const record = records.find((item) => item.id === select.value);
    if (!record) {
      status.textContent = '먼저 기록을 선택하세요.';
      return;
    }

    const result = applyRecordToPage(record);

    if (!result.appliedAny) {
      status.textContent = '입력 대상 필드를 찾지 못했습니다.\n/playinfo/write 페이지인지 확인해주세요.';
      return;
    }

    status.textContent = `적용 완료: ${record.songTitle || '(제목 없음)'}\n${result.note}`;
  });

  wrap.append(title, desc, select, fillBtn, status);
  return wrap;
}

function applyRecordToPage(record) {
  const valueMap = {
    pi_title: record.songTitle,
    pi_c_seq: record.cSeq,
    pi_level: record.level,
    pi_score: record.score,
    pi_grade: record.grade,
    pi_perfect: record.perfect,
    pi_great: record.great,
    pi_good: record.good,
    pi_bad: record.bad,
    pi_miss: record.miss,
    pi_maxcom: record.maxCombo
  };

  let appliedAny = false;

  for (const [id, value] of Object.entries(valueMap)) {
    if (value === undefined || value === null || value === '') continue;
    const el = document.getElementById(id);
    if (!el) continue;

    setElementValue(el, String(value));
    appliedAny = true;
  }

  const piJudge = document.getElementById('pi_judge');
  if (piJudge && record.judge) {
    selectByTextOrValue(piJudge, record.judge);
    appliedAny = true;
  }

  const piBreak = document.getElementById('pi_break');
  if (piBreak && record.breakMode) {
    selectByTextOrValue(piBreak, record.breakMode);
    appliedAny = true;
  }

  const piMode = document.getElementById('pi_mode');
  if (piMode && record.chartType) {
    selectByTextOrValue(piMode, record.chartType);
    appliedAny = true;
  }

  const note =
    '주의: pi_title 자동완성(searchFile)에서 곡을 직접 1회 선택해야\npi_c_seq/모드/레벨 동기화가 완전해질 수 있습니다.';

  return { appliedAny, note };
}

function setElementValue(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

function selectByTextOrValue(selectEl, wanted) {
  const target = String(wanted).trim().toLowerCase();
  const found = [...selectEl.options].find((opt) => {
    const byValue = String(opt.value).trim().toLowerCase() === target;
    const byText = String(opt.textContent).trim().toLowerCase() === target;
    return byValue || byText;
  });

  if (found) {
    selectEl.value = found.value;
    selectEl.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

function makeRecordLabel(record) {
  const song = record.songTitle || '(제목 없음)';
  const mode = record.chartType || '-';
  const lv = record.level ? `Lv.${record.level}` : 'Lv.?';
  const score = record.score || '-';
  return `${song} | ${mode} ${lv} | ${score}`;
}

function sendMessage(message) {
  return new Promise((resolve) => chrome.runtime.sendMessage(message, resolve));
}
