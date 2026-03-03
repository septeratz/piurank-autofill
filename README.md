# PIURank Autofill (Chrome Extension)

목표는 단순합니다.

1. `piugame.com`에서 얻은 최근 플레이 기록 데이터를 준비하고
2. 그 데이터를 `piurank.com/playinfo/write` 폼에 자동으로 채워 넣기

이 프로젝트는 위 2단계를 위한 브라우저 자동입력 도구입니다.

## 현재 구현 범위

- 팝업에서 piugame JSON을 붙여넣고 **piurank 입력 포맷으로 변환**
- 변환한 기록을 확장 로컬 저장소에 저장
- `playinfo/write` 페이지 우측 하단 드롭다운에서 기록 선택 후 자동입력
- 실제 필드 ID 반영
  - `pi_title`, `pi_c_seq`, `pi_mode`, `pi_level`
  - `pi_score`, `pi_grade`, `pi_judge`, `pi_break`
  - `pi_perfect`, `pi_great`, `pi_good`, `pi_bad`, `pi_miss`, `pi_maxcom`

## 사용 방법

1. 확장 팝업에 piugame 최근기록 JSON을 붙여넣습니다.
   - 배열(`[]`) 형태면 바로 가능
   - 객체라면 `records`, `data`, `items` 키 아래 배열도 자동 인식
2. `piugame JSON 변환` 버튼 클릭
3. `저장` 버튼 클릭
4. `https://piurank.com/playinfo/write` 페이지에서 드롭다운 항목 선택 후 `폼에 입력`

## 변환 입력 JSON 예시 (piugame 쪽 원본 가정)

```json
[
  {
    "title": "Canon-D",
    "mode": "S",
    "level": 17,
    "score": 998123,
    "judge": "VJ",
    "break": "ON",
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

## 주의사항

- `pi_title`은 사이트의 자동완성(`searchFile`) 이벤트와 연동되어 `pi_c_seq / pi_mode / pi_level`이 동기화됩니다.
- 자동입력 후에도 안정성을 위해 `pi_title` 자동완성 목록에서 곡을 한 번 직접 선택하는 것을 권장합니다.
