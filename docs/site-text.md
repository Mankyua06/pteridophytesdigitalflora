# English and Korean interface text

The header button switches between English and Korean. The choice is saved in the `fern-language` cookie for one year; English is the default. Both server-rendered pages and client controls use the same language. The current URL, query parameters, and client selections are retained. Scientific names, Korean common names, bilingual morphology terms, captions, and contributor records remain source data and are not automatically translated.

| 열 | 사용 방법 |
|---|---|
| key | 코드와 연결되는 고유 키. 변경하지 마세요. |
| text | English wording. Existing English edits are preserved. |
| text_ko | Korean wording. Blank means use this row's English wording. |
| description | 문구를 찾기 위한 원래 한국어 문구 또는 참고 설명. 웹에 공개하지 않습니다. |

예를 들어 `morphology`는 Morphology 메뉴, `documenting_ferns`와 `exploring_their_forms`는 첫 화면 제목, `start_with_a_name`은 검색 영역 제목입니다. 설명 열에서 기존 한국어 문구를 검색하여 수정할 행을 찾을 수 있습니다.

1. Edit `text` and/or `text_ko`, then save the workbook.
2. 프로젝트 루트에서 아래 명령을 실행합니다.

```bash
.venv/bin/python -m scripts.build_site_text
```

이 명령은 문구만 검증하고 갱신합니다. 분류군·사진·참여자는 이전 공개 데이터 그대로 유지합니다. 다른 시트의 미완성 행 때문에 문구 수정이 막히지 않습니다. 실행 중인 개발 서버는 변경을 다시 읽으며 필요하면 브라우저를 새로고침합니다. 실제 배포 사이트는 수정 후 다시 빌드·배포해야 합니다.

`01_Taxa`~`09_Contributors` 중 하나라도 수정했거나 전체 연구 데이터까지 갱신하려면 `.venv/bin/python -m scripts.pipeline --mode normal`을 사용합니다. `01`~`09`와 `10_Site_Text`를 함께 수정했을 때도 이 명령 하나를 사용합니다. 이때는 모든 시트의 필수값 검증을 통과해야 합니다.

## 입력 규칙

- Preserve placeholders such as `{v0}`, `{v1}`, `{count}`, `{covered}`, and `{total}` exactly. Their order can change to suit the language.
- 문구는 일반 텍스트입니다. HTML이나 스크립트를 입력해도 실행하지 않습니다.
- Duplicate or unknown keys, formulas, empty English text, and mismatched placeholders stop publication. Korean text can be blank.
- 일부 문구는 숫자나 이름 앞뒤에 붙습니다. 의도된 앞뒤 공백은 유지하세요.
- Missing rows use versioned defaults in `config/site_text.json` and `config/site_text_ko.json`. An explicitly blank Korean cell falls back to that row's current English text. New keys require corresponding code/default entries.

There are now 186 entries. `korean_ferns` controls the homepage scope label; `korean_scope_description` controls the footer and metadata description. `statistics` controls the statistics navigation/title. After a text refresh, check both languages. Production sites require a new build and deployment; the development server recompiles changed text automatically.

The bilingual migration changed only `10_Site_Text` and preserved all other worksheet XML byte-for-byte. The backup is recorded in `work/bilingual/input.json`.

## 이번 갱신 범위

2026-09-10 문구 갱신 시 기존 09_Contributors의 2~4행에서 ID 형식 오류와 status 누락을 발견했습니다. 기존 행과 연구 시트는 수정하지 않고, 10_Site_Text만 추가했습니다. 전체 데이터 갱신 전에 참여자 ID를 CT000001 같은 문자열로, status를 active 또는 inactive로 입력해야 합니다. 이 안내는 해당 참여자 정보를 새로 공개했다는 의미가 아닙니다.

후속 수정: 참여자 ID를 CT000001~CT000003으로, status를 active로 수정하여 전체 데이터 갱신과 세 참여자 공개를 완료했습니다.
