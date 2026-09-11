# 일엽초 58장 로컬 테스트

2026-09-09 사용자 요청으로 `TX000365`(기존 01_Taxa의 일엽초)에 테스트 사진을 연결했습니다.

- 01_Taxa, 02_Cytotypes, 03_Morphology_Terms, 04_Morphology_Tree의 worksheet XML은 바꾸지 않았습니다. 기존 스타일 항목도 유지하고 수정 시트에 필요한 줄바꿈 스타일만 추가했습니다.
- 수정 전 master 사본은 `backups/Ferns_morphology_data.before-TX000365-test-36ced433dc7f.xlsx`에 있습니다.
- 04_Morphology_Tree의 기존 행 순서에 따라 `DSC_0001.jpeg`~`DSC_0058.jpeg`를 1:1 연결했습니다. 노드의 ID나 부모 관계를 바꾸지 않았습니다. 이후 Excel 행 순서가 바뀌어도 저장된 ID 관계가 기준입니다.
- 05_Taxon_Morphology: 58행, 모두 `unknown` / `not_examined`. 임의 연결 사진이 실제 구조의 존재나 자료 확보를 입증하지 않기 때문입니다. note에 테스트용임을 명시했습니다.
- 06_Images: `IM000001`~`IM000058`, taxon_id TX000365, 원본 상대경로, active, 테스트 caption. 확인하지 못한 cytotype·촬영자·장소·촬영일·저작권은 빈값입니다. 기존 첫 테스트 행에 있던 다른 원본의 촬영 정보는 새 사진에 복사하지 않았습니다. 기존 filename 열은 유지하되 값은 비우고 경로 결정에 사용하지 않습니다.
- 07_Image_Morphology: 58개의 고유한 image/node 연결, primary, 실제 boolean TRUE, 표시 순서 1~58. 제목 없던 도우미 열은 context_label로 지정했습니다.

원본은 50장 766×1026px, 8장 1026×766px입니다. thumb는 긴 변 480px이며 medium/large는 원본보다 확대하지 않으므로 긴 변 1026px입니다. WebP 3종이 생성되어도 원본보다 상세 정보가 늘어나지는 않습니다.

## Excel을 유지하기 위한 호환 처리

`config/pipeline.yaml`의 `ignored_unnamed_columns: {01_Taxa: [J]}`는 제목 없는 기존 J열을 원본에 그대로 남기고 공개하지 않는 명시적 설정입니다. 그 값의 의미를 GBIF key 등으로 추정하지 않습니다. 다른 제목 없는 열의 데이터는 계속 오류입니다. `08_Synonyms`는 현재 없는 선택 시트로 지정하여 빈 이명 목록으로 읽습니다. 학명과 국명 검색은 01_Taxa로 동작합니다. 향후 실제 이명 시트를 추가하면 정상적으로 읽습니다.

## 실행

```bash
cd /Users/kimhyoungtae/webapp/FernDigitalFlora
uv run python -m scripts.pipeline --mode normal
npm --prefix web run dev -- --port 3100
```

uv가 PATH에 없더라도 이미 설치된 프로젝트 환경에서 `.venv/bin/python -m scripts.pipeline --mode normal`을 실행할 수 있습니다.

현재 `web/.env.local`의 `NEXT_PUBLIC_LOCAL_PREVIEW=true`로 로컬 미리보기를 켰습니다. 개발 서버에서만 `/local-images/<size>/<imageId>`로 검증된 images_web 파일을 표시합니다. 경로 탈출, 미등록 ID, 공개 manifest에 없는 파일, 해시 불일치는 거부합니다. 원본 JPEG는 이 경로로 제공하지 않습니다. production에서는 해당 route가 404이며 Supabase URL을 사용합니다.

웹에서 ‘일엽초’ 검색 → TX000365 상세 → 사진 58장을 확인합니다. 각 caption에 대응한 morphology_id와 context_label, 임의 연결임이 표시됩니다. 형태 노드 페이지에서는 직접 연결된 1장 또는 하위 노드를 포함한 사진을 선택할 수 있습니다. 확대창에서 medium/large 전환, 방향키 이전/다음, Esc 닫기를 지원합니다.

## 테스트 자료의 외부 발행 방지

`test_dataset.enabled: true`인 동안 원격 업로드 preflight는 실패합니다. 실제 종·형태·촬영 정보와 저작권을 확인하고 Excel 관계를 교체한 뒤 이 설정을 해제하고 파이프라인부터 다시 실행해야 합니다. 이번 작업은 로컬 웹 확인이며 Supabase 업로드·GitHub push·Vercel 배포는 수행하지 않습니다.

## 2026-09-09 화면 및 GBIF 매핑 수정

- 이름 검색과 목→과→속 탐색을 분리. 상위 선택 변경 시 하위 선택 초기화.
- 종별 기본 정보, 형태·자료 상태, 사진 탐색을 독립 주소로 분리.
- 전체 형태 탐색은 전체 트리 유지. 종별 사진 트리는 사진 연결 노드와 상위 경로만 표시.
- 사용자가 `01_Taxa.status`의 의미를 GBIF 처리 상태로 확인하여 `gbif_status` 별칭으로 연결.
- `acceptedScientificName`은 기존 별칭으로 읽고 화면 제목은 `GBIF accepted scientific name`으로 표시.
- 엑셀 파일과 원본 사진은 이번 UI 수정에서 변경하지 않음.

## 사진 도감과 비교

사진 도감 및 형태 상세의 사진 영역은 분류군을 선택하기 전에는 상세 JSON이나 사진을 불러오지 않습니다. 선택을 해제하면 사진을 숨깁니다.

사진 도감의 ‘여러 종의 형태 사진 비교’로 `/compare` 페이지에 들어갑니다. 형태 항목 하나와 분류군 두 개 이상을 선택한 뒤 비교 버튼을 누르면 종별 사진이 나란히 표시됩니다. 형태 상세에서 이동하면 해당 형태가 미리 선택됩니다. 비교는 선택한 morphology_id에 직접 연결된 사진만 사용하며 하위 항목을 포함하지 않습니다. 사진이 없는 종은 빈 자료 안내를 표시합니다. 새 조건은 비교 버튼으로 적용합니다.

실제 사진은 현재 TX000365에만 있으므로 여러 종에 사진이 있는 상황은 분리된 합성 테스트 자료로 검증했습니다.
