# Excel 스키마

정확한 열·타입·기본키·외래키·필수값·enum은 `config/schema.yaml`이 기준입니다. YAML은 JSON 구문을 포함하므로 이 파일은 JSON 형태의 유효한 YAML로 관리합니다. 공개 필드는 `config/public_fields.yaml`의 허용 목록으로 제한합니다.

| 시트 | 기본키 | 관계 및 역할 |
|---|---|---|
| 01_Taxa | taxon_id | 분류군. accepted_taxon_id 선택, 자기 참조 허용 |
| 02_Cytotypes | cytotype_id | taxon_id → Taxa, genome_size_pg 양수 |
| 03_Morphology_Terms | term_id | 개념 정의. category는 general/vegetative/indumentum/reproductive |
| 04_Morphology_Tree | morphology_id | term_id 및 선택 parent_id. parent만으로 계층 결정 |
| 05_Taxon_Morphology | taxon_id + morphology_id | 분류군과 형태 연결, 선택 note |
| 06_Images | image_id | taxon_id, 선택 cytotype_id, 원본 상대경로. 등록 사진 전체 공개 |
| 07_Image_Morphology | image_id + morphology_id | 사진과 형태 연결 |
| 08_Synonyms | name_id | taxon_id와 연결된 scientific_synonym/korean_synonym |

ID는 문자열이며 문자로 시작하는 영문·숫자·`_`·`-`만 경로에 허용합니다. 길이와 숫자 부분은 통일하지 않습니다. 순서나 분류 의미를 ID에서 해석하지 않습니다. 기존 문자열의 선행 0을 보존하고 숫자 셀을 내부 ID로 변환하지 않습니다. 이 형식 밖의 기존 ID는 사용자 검토 전 발행을 중단합니다.

빈값은 null입니다. 숫자 ploidy/염색체수도 원문 보존을 위해 Excel에서 텍스트로 명시합니다. boolean은 Excel 실제 boolean 또는 대문자 TRUE/FALSE만 허용하며 숫자 0/1은 받지 않습니다. 날짜는 Excel 날짜 타입 또는 엄격한 `YYYY-MM-DD` 문자열입니다. 문자열 `01/02/2026`은 모호하므로 거부합니다.

선택값은 빈 셀과 선택 열 누락을 null로 읽습니다. 필수 열 누락은 오류, 선택 열 누락은 경고입니다. 새 템플릿은 모든 기본 열을 제공합니다. 추가 열은 원본에 남고 허용 목록에 없는 값은 공개되지 않습니다. 병합 셀과 핵심 열 수식은 오류입니다. 추가 도우미 열 수식은 경고 후 무시하며 Excel 수식을 평가하지 않습니다.

사진 자료 유무는 연결된 사진에서 계산합니다. 생물학적 존재·부재는 추정하지 않습니다. 05의 presence_status/documentation_status 및 04/06의 status는 사용하지 않습니다.

07의 role/representative/display_order는 사용하지 않습니다. 사진은 image_id 순서이며 첫 사진이 썸네일이 됩니다. 04의 display_order는 형태 트리 순서를 결정합니다. 형태 선택 시 직접 연결/하위 노드 포함 여부를 화면에서 선택합니다. 같은 사진은 한 번만 표시합니다.

형태 탐색 원칙은 사용자가 제공한 기존 합의(Whole plant → Frond/Rhizome, Frond → Blade/Petiole, Blade 아래 Sorus, Trichome 아래 Hair/Glandular hair)를 유지하는 것입니다. 코드가 기존 MO/MT의 뜻이나 부모를 임의 수정하지 않습니다. 전체 트리나 정의가 없으면 합성 학술 자료를 채우지 않습니다.

## 참여자 확장

`09_Contributors`는 선택 시트입니다. 이름·소속·이메일·담당 분류군·역할을 관리하며, active 행만 공개합니다. email_public이 TRUE가 아니면 이메일은 공개 JSON에서 null 처리합니다. 열별 입력 안내는 [참여자 등록](contributors.md)을 참고하세요.

## 화면 문구

`10_Site_Text` is optional and contains `key`, `text` (English), `text_ko` (Korean), and `description`. The two language columns override UI defaults; description is not published. Blank Korean text falls back to English. See [interface text](site-text.md).
