# PIURank Autofill (Chrome Extension)

`piurank.com/playinfo/write` 페이지 구조에 맞춰, JSON 기록을 드롭다운에서 선택해 폼에 자동 입력하는 크롬 확장 프로그램입니다.

## 현재 구현 범위

- 팝업에서 JSON 배열 형태의 기록 붙여넣기 + 저장
- `playinfo/write` 페이지 우측 하단에 레코드 드롭다운 패널 표시
- 선택한 기록을 아래 실제 필드 ID에 자동 반영
  - `pi_title`, `pi_c_seq`, `pi_mode`, `pi_level`
  - `pi_score`, `pi_grade`, `pi_judge`, `pi_break`
  - `pi_perfect`, `pi_great`, `pi_good`, `pi_bad`, `pi_miss`, `pi_maxcom`

## 데이터 포맷 예시

```json
[
  {
    "songTitle": "Canon-D",
    "chartType": "Single",
    "level": 17,
    "c_seq": 12345,
    "score": 998123,
    "judge": "VJ",
    "breakMode": "ON",
    "perfect": 1234,
    "great": 15,
    "good": 3,
    "bad": 1,
    "miss": 0,
    "maxCombo": 1400
  }
]
```

## 설치

1. `chrome://extensions` 이동
2. 개발자 모드 활성화
3. `압축해제된 확장 프로그램 로드` 클릭
4. 이 프로젝트 폴더 선택

## 주의사항 (중요)

`piurank`의 곡 선택은 `#pi_title` 자동완성(`searchFile`) 기반이며, 원래 페이지 스크립트에서 **자동완성 항목 select 이벤트 시** `pi_mode`, `pi_level`, `pi_c_seq`를 동기화합니다.

확장 프로그램은 값 자동 입력까지 수행하지만, 사이트 내부 검증 흐름을 100% 동일하게 맞추려면:

- 자동 입력 후 `pi_title`에 대해 자동완성 목록에서 곡을 한 번 직접 선택하는 것을 권장합니다.

## piu-db 연동 포인트

- `src/background/service-worker.js`의 `normalizeRecords()`에서 필드 매핑을 담당합니다.
- `chartType`은 `S/D/Single/Double/CO-OP` 등 입력값을 `Single/Double/CO-OP`로 정규화합니다.
- 추후 `piu-db` 결과 필드명이 다르면 `normalizeRecords()`만 수정하면 됩니다.
