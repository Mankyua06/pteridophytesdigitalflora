# 기존 Excel과 요청 스키마의 차이

2026-09-08 초기 파일을 읽기 전용으로 조사했습니다. 파일명은 `Ferns_morphology_data.xlsx`입니다. 초기 SHA-256은 `281b988b33cad67088a2fa95c9a91d0f96e3213dd1826fe18cdc7ce5a40ba60d`이며 원본을 덮어쓰지 않았습니다. 원시 검사 기록은 로컬 `reports/initial-inspection/workbook.json`에 있습니다.

| 위치 | 발견 | 처리 및 사용자 수정 |
|---|---|---|
| `01_Taxa` | 400개 데이터 행, `status` 열 | 의미를 단정하지 않고 추가 열로 보존·공개 제외. GBIF 처리 상태 열임을 확인한 뒤 사용자가 `gbif_status`로 명명 가능. 이 열로 분류군을 숨기지 않음 |
| `01_Taxa.I` | `acceptedScientificName` | 설정에서 `accepted_scientific_name`으로 읽는 별칭 지원. 원본 열 이름은 변경하지 않음 |
| `01_Taxa.J` | 400개 값이 있으나 제목 없음 | 검증 오류. 값이 GBIF key인지 코드가 추정하지 않음. 사용자가 의미를 확인하여 헤더 지정 |
| `01_Taxa` | `gbif_status`, `gbif_taxon_key`, `accepted_taxon_id` 없음 | 선택 열 누락 경고, 내부 null. 관계나 상태를 만들어 채우지 않음 |
| `03_Morphology_Terms` | 39개 행, 선택 `status`와 서식만 있는 빈 열 | 추가 열 보존, 빈 서식 셀은 데이터로 보지 않음. `MT0001` 형식을 유지 |
| `04_Morphology_Tree` | 58개 행, 추가 `status` | `MO0001`과 parent 관계 유지. `context_label`로 구조를 파싱하지 않음 |
| `05_Taxon_Morphology.C2:C5` | 추가 `context_label`에 VLOOKUP 수식 4개 | 핵심 스키마에 없는 도우미 열이므로 경고 후 공개 제외. 수식이나 캐시 값을 계산 결과로 사용하지 않음 |
| `06_Images.D` | 기존 `filename` | 경고·무시. 실제 파생 경로는 image_id와 크기로 결정 |
| `06_Images` 3~5행 | `IM000002`~`IM000004`만 있고 필수값 미입력 | taxon_id, original_filename, status 입력 필요. 자동 삭제·가상 데이터 보완하지 않음 |
| `06_Images` 2행 | `DSC_3821.JPG` 참조 | 해당 경로 원본이 있어야 처리 가능. 파일명 자동 치환 안 함 |
| `07_Image_Morphology.C2:C4` | 제목 없는 도우미 VLOOKUP 3개 | 경고·제외. 사용자가 헤더를 붙여도 공개 허용 목록 밖에 유지 |
| `08_Synonyms` | 시트 없음 | 검증 오류. 6개 헤더만 있는 빈 시트를 추가 가능. 이명 레코드는 실제 자료가 있을 때 입력 |

전체 Excel을 자동 마이그레이션하지 않습니다. 현재 호환 처리는 **명시적인 열 별칭·선택 열 null·추가 열 보존/공개 제외·도우미 수식 경고**에 한정합니다. 핵심 열의 수식은 오류입니다. 새 템플릿을 참고하려면 `uv run python -m scripts.init_master --filename work/schema-template.xlsx`를 실행하세요.

작업 중 `images_original/`에 `DSC_0001.jpeg`~`DSC_0015.jpeg`가 추가되었습니다. 초기 Excel에 미등록 상태여서 리사이즈하지 않았습니다. 해당 사진의 분류군·형태·촬영 정보는 추정하지 않습니다.
