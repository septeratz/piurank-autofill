# PIURank Autofill (Chrome Extension)

목표는 다음 2가지입니다.

1. `piugame.com` 최근 플레이 기록을 브라우저에서 추출하고
2. 그 데이터를 `piurank.com/playinfo/write` 폼에 자동으로 채워 넣기

## 핵심 기능

- **piugame 탭 직접 가져오기**: 활성 탭이 `piugame.com`이면 content script가 최근기록 데이터를 추출
- **JSON 변환기**: piugame 응답/원본 JSON을 piurank 입력용 필드로 변환
- **piurank 자동입력**: 우하단 패널에서 기록 선택 후 `playinfo/write` 필드 자동 입력

## piugame 기록 추출 방식

`src/content/piugame-extractor.js`에서 아래 우선순위로 추출합니다.

1. 페이지 전역 캐시(`__NEXT_DATA__`, `__NUXT__`, 기타 전역 객체) 순회
2. `script[type="application/json"]` 블록 파싱
3. 표(`table`) 기반 파싱
4. 카드/리스트 텍스트 기반 fallback 파싱

즉, 특정 API 1개에 하드코딩하지 않고 페이지 구조가 달라도 동작하도록 다중 fallback을 둔 방식입니다.

## 사용 방법

1. `piugame.com` 최근기록 페이지를 연 상태에서 확장 팝업 열기
2. `현재 piugame 탭에서 가져오기` 클릭
3. 필요하면 `piugame JSON 변환` 클릭(원본 JSON 직접 붙여넣었을 때)
4. `저장` 클릭
5. `https://piurank.com/playinfo/write`에서 우하단 패널로 항목 선택 후 `폼에 입력`

## 데이터 필드 매핑

자동입력 대상 필드 ID:

- `pi_title`, `pi_c_seq`, `pi_mode`, `pi_level`
- `pi_score`, `pi_grade`, `pi_judge`, `pi_break`
- `pi_perfect`, `pi_great`, `pi_good`, `pi_bad`, `pi_miss`, `pi_maxcom`

## 주의사항

- `pi_title`은 사이트 자동완성(`searchFile`) 이벤트와 연동되어 `pi_c_seq / pi_mode / pi_level`이 동기화됩니다.
- 자동입력 후에도 정확도를 위해 `pi_title` 자동완성 목록에서 곡을 한 번 직접 선택하는 것을 권장합니다.

## 설치

1. `chrome://extensions` 이동
2. 개발자 모드 활성화
3. `압축해제된 확장 프로그램 로드` 클릭
4. 이 프로젝트 폴더 선택

## 참고

- 이 환경에서는 외부 GitHub 접근이 403으로 차단되어 `piu-db` 저장소 코드를 직접 내려받아 대조할 수 없었습니다.
- 대신 목적(= piugame 데이터 수집 + piurank 자동입력)에 필요한 추출/변환/입력 파이프라인을 확장 내부에 구현했습니다.
