# Pteridophyte Digital Flora

## 먼저 알아둘 용어

이 문서에서는 아래 전체 이름과 뜻을 먼저 설명한 뒤 약어를 사용합니다. 파일명, 환경변수명, 실행 명령은 그대로 입력해야 하므로 풀어 쓰지 않습니다.

| 전체 이름과 약어 | 이 프로젝트에서의 뜻 |
|---|---|
| Cascading Style Sheets (CSS) | 웹페이지의 글꼴, 색상, 여백, 크기, 배치 등 화면 디자인을 지정하는 언어입니다. 예를 들어 사진 카드 간격이나 버튼 색상을 바꾸는 작업이 해당합니다. 주요 파일은 `web/src/app/globals.css`입니다. |
| JavaScript Object Notation (JSON) | 데이터를 텍스트로 저장하는 형식입니다. Python이 Excel에서 만든 공개 데이터를 웹사이트가 이 형식으로 읽습니다. |
| Uniform Resource Locator (URL) | 웹페이지나 사진 등 인터넷 자원의 주소입니다. |
| User Interface (UI) | 사용자가 보는 화면, 버튼, 메뉴, 입력란 등의 사용자 인터페이스입니다. |
| HyperText Markup Language (HTML) | 웹페이지의 제목, 문단, 목록, 입력란 같은 구조를 표현하는 언어입니다. |
| Application Programming Interface (API) | 프로그램끼리 기능과 데이터를 주고받는 인터페이스입니다. API key는 접근을 위해 사용하는 키입니다. |
| Software Development Kit (SDK) | 외부 서비스 기능을 프로그램에서 사용할 수 있도록 제공하는 개발 도구 모음입니다. |
| Command-Line Interface (CLI) | 터미널에 명령어를 입력하여 프로그램을 실행하는 방식입니다. GitHub CLI의 실행 명령은 `gh`입니다. |
| Hypertext Transfer Protocol Secure (HTTPS) | 암호화된 연결을 사용하는 웹 통신 방식입니다. 주소가 `https://`로 시작합니다. |
| Row-Level Security (RLS) | 데이터베이스에서 행 단위로 접근 권한을 제어하는 기능입니다. |
| Exchangeable image file format (Exif, EXIF) | 사진 파일에 촬영 시각, 카메라 설정 등의 메타데이터를 기록하는 규격입니다. |
| Global Positioning System (GPS) | 위성 기반 위치 결정 시스템입니다. 사진 메타데이터에 촬영 위치 좌표가 포함될 수 있습니다. |
| Identifier (ID) | 분류군이나 사진 등을 구별하는 식별자입니다. 예: `taxon_id`, `image_id`. |
| Pixel (px) | 이미지 크기를 나타내는 픽셀 단위입니다. |

WebP는 이미지 형식의 이름이며 여기서 임의의 풀네임으로 확장하지 않습니다. Git, GitHub, Python, Next.js, Supabase, Vercel, uv, npm도 제품·도구 이름으로 사용합니다. Auth는 authentication(인증)의 줄임말입니다.

운영 안내 · 코드 확인일: 2026-09-12. 이 문서의 명령은 별도 표시가 없으면 `FernDigitalFlora` 루트에서 실행합니다. 명령은 하나씩 실행하고, 실패하면 다음 업로드·commit·push로 넘어가지 않습니다. 이 문서는 연결 방법을 설명하며 원격 업로드나 배포 완료를 보증하는 상태 보고서가 아닙니다.

Excel master와 로컬 원본 사진으로 만드는 한국 양치식물(Pteridophytes) 디지털 도감입니다. Python은 Excel 검증, WebP 생성, 공개 JSON 생성, Supabase Storage 업로드를 담당합니다. `web/`의 Next.js 앱은 공개 JSON과 Supabase의 공개 이미지 URL만 사용합니다. 현재 구조에는 Supabase Database와 Auth가 필요하지 않습니다.

## 데이터와 폴더 구조

| 경로 | 역할 | Git 포함 여부 |
|---|---|---|
| `Ferns_morphology_data.xlsx` | 연구 데이터와 사이트 문구의 master | 제외 |
| `images_original/` | 사용자가 보관하는 원본 사진 | 제외 |
| `images_web/` | Python이 생성한 `thumb`, `medium`, `large` WebP | 제외 |
| `web/public/data/` | 웹사이트가 읽는 공개 JSON | 포함 |
| `web/public/backgrounds/` | 표지 등 웹 정적 이미지 | 포함 |
| `.env.local` | 로컬 Supabase 업로드 설정과 비밀키 | 제외 |
| `web/.env.local` | 로컬 Next.js 공개 환경변수 | 제외 |
| `reports/`, `.state/`, `backups/`, `work/` | 실행 보고서, 상태, 백업, 임시 작업물 | 제외 |

웹사이트는 Excel을 직접 읽지 않습니다. Excel을 저장한 뒤 반드시 Python 생성 명령을 실행해야 `web/public/data/`가 갱신됩니다. Vercel도 Excel이나 원본 사진을 받지 않으며 Git에 포함된 공개 JSON과 코드를 빌드합니다.

## 설치와 로컬 실행

Python 3.11 이상, Node.js 22 이상, [uv](https://docs.astral.sh/uv/getting-started/installation/)가 필요합니다. macOS에서 uv가 없으면 `brew install uv`로 설치할 수 있습니다.

```bash
cd /Users/kimhyoungtae/webapp/FernDigitalFlora
uv sync --locked
uv run python -m scripts.init_workspace
npm --prefix web ci
npm --prefix web run dev
```

개발 서버 기본 포트는 3000입니다. 이 프로젝트에서 사용하던 3100 포트로 실행하려면 아래 명령을 사용합니다. 이미 서버가 실행 중이면 같은 포트에 중복 실행하지 않습니다.

```bash
npm --prefix web run dev -- --port 3100
```

Supabase가 없어도 공개 JSON의 분류군과 형태 자료를 탐색할 수 있습니다. 로컬 파생 사진까지 표시하려면 `web/.env.local`에 `NEXT_PUBLIC_LOCAL_PREVIEW=true`를 넣고 개발 서버를 다시 시작합니다. 이 기능은 development에서만 동작합니다. `npm run build` 후 `npm run start`로 실행하는 production 모드나 Vercel에서는 로컬 원본/파생 폴더를 읽지 않습니다.

이 문서의 Python 명령은 현재 프로젝트에 이미 만들어진 `.venv`를 기준으로 표기합니다. 다음 두 명령 형식은 같은 환경을 사용합니다.

```bash
.venv/bin/python -m scripts.pipeline --mode normal
uv run python -m scripts.pipeline --mode normal
```

## Excel 시트 수정 후 로컬 웹에 반영

### 보유 상태

`01_Taxa`에 `holding_status` 열을 추가하고 해당 분류군에만 `held`를 입력합니다. 빈 셀은 미보유입니다. `held`는 현재 살아 있는 식물체를 보유하거나 과거 보유한 식물체의 필요한 사진 촬영을 완료한 경우입니다. 이 값은 사진 개수에서 자동 추정하지 않습니다. 다른 문자열은 검증 오류입니다.

저장 후 `.venv/bin/python -m scripts.pipeline --mode normal`을 실행합니다. 검색 결과와 분류군 상세 페이지에 보유/미보유가 표시됩니다. 통계에는 보유 분류군 ÷ 전체 분류군, 공개 사진이 1장 이상 있는 보유 분류군 ÷ 보유 분류군이 표시됩니다. 분모가 0이면 비율을 —로 표시합니다. 사진이 있다는 사실은 전체 촬영 완료를 뜻하지 않습니다. 새 UI 문구는 `config/site_text.json`, `config/site_text_ko.json`에 기본값이 있으며 동일 키를 `10_Site_Text`에 추가하면 수정할 수 있습니다.

### 학명의 이탤릭 표시

기존 `01_Taxa.scientific_name`과 `acceptedScientificName` 셀에 `[i]...[/i]`를 직접 입력합니다. 별도 display 열은 필요하지 않습니다. `08_Synonyms.name`에도 같은 표기를 사용할 수 있습니다.

```text
[i]Genus species[/i] Author var. [i]epithet[/i] Author
```

표시 범위 안만 이탤릭이고 명명자·`var.` 등 범위 밖 텍스트는 로마체입니다. 표시가 없는 이름은 전체 로마체이며 자동 추정하지 않습니다. Excel 자체의 글꼴 서식은 읽지 않습니다. 닫는 `[/i]` 누락이나 중첩은 검증 오류로 시트·행·열을 보고합니다. 검색과 드롭다운에는 마크를 제거한 이름을 사용하며, 기본 HTML 드롭다운에서는 부분 이탤릭을 표시하지 않습니다. 저장 후 `.venv/bin/python -m scripts.pipeline --mode normal`을 실행하고 새로고침합니다.

Excel을 완전히 저장하고 프로젝트 루트에서 수정 범위에 맞는 명령을 실행합니다.

| 변경 내용 | 실행할 명령 |
|---|---|
| `10_Site_Text`만 수정 | `.venv/bin/python -m scripts.build_site_text` |
| `01_Taxa`부터 `09_Contributors`까지의 데이터 시트 중 하나 이상 수정 | `.venv/bin/python -m scripts.pipeline --mode normal` |
| 데이터 시트와 `10_Site_Text`를 함께 수정 | `.venv/bin/python -m scripts.pipeline --mode normal` |
| 코드, CSS, 웹 정적 이미지 파일만 수정 | Python pipeline 불필요 |

현재 master에는 `01_Taxa`, `02_Cytotypes`, `03_Morphology_Terms`, `04_Morphology_Tree`, `05_Taxon_Morphology`, `06_Images`, `07_Image_Morphology`, `09_Contributors`, `10_Site_Text`가 있습니다. 향후 선택 시트인 `08_Synonyms`를 추가한 경우에도 전체 pipeline을 실행합니다.

`build_site_text`는 `10_Site_Text`만 다시 읽고 기존 연구 데이터는 유지합니다. 다만 한 번의 공개 release가 서로 같은 `release_id`를 가져야 하므로 `web/public/data/` 아래 여러 JSON 파일이 함께 변경될 수 있습니다. Git 반영 시 `site-text.json` 하나만 고르지 말고 `web/public/data/`의 전체 변경을 검토합니다.

이 명령은 기존 정상 공개 release가 있어야 합니다. 또한 현재 구현은 `.state/release-source.json`을 갱신하지 않습니다. 문구만 갱신한 후 `upload_images` 또는 `verify_storage`를 실행하면 `STALE_RELEASE`가 발생할 수 있으므로, 이 두 명령을 실행하기 전에는 전체 `pipeline --mode normal`을 실행합니다. 문구만 배포하면서 이미 올라간 사진을 확인할 때는 `npm --prefix web run check:deployment`를 사용합니다.

`pipeline --mode normal`은 다음 순서로 실행됩니다.

1. Excel과 원본 사진 검증
2. 필요한 WebP 파생 파일 생성
3. 파생 파일 검증
4. 공개 JSON 생성
5. 공개 JSON 재검증

검증 오류가 있으면 명령이 종료 코드 1로 끝나고 기존 정상 공개 JSON은 유지됩니다. 터미널에 표시된 `reports/<run_id>/summary.md`와 단계별 보고서에서 시트명, 셀 위치, 오류 내용을 확인합니다. 성공 후 로컬 페이지를 새로고침합니다. 환경변수를 바꾼 경우에는 Next.js 개발 서버도 종료 후 다시 실행해야 합니다.

## 색상·글꼴 변경 (`11_Site_Theme`)

`key`는 그대로 두고 `value`만 수정합니다. `description`은 입력 안내이며 공개되지 않습니다. 빈 value는 기본값으로 돌아갑니다. 색상은 `#RRGGBB` 형식입니다. background_color(배경), text_color(본문), muted_color(보조 글자), border_color(테두리), accent_color(강조), surface_color(보조 배경)을 설정할 수 있습니다. 특수 상태 배지·사진 자체의 색은 이 설정의 대상이 아닙니다.

body_font(본문)와 heading_font(제목)은 `system`, `sans`, `serif` 중 하나입니다. 새 글꼴을 다운로드하지 않고 기기에 설치된 글꼴과 한글 대체 글꼴을 사용하므로 기기별 모양은 다를 수 있습니다. base_font_size는 12–24, heading_font_size는 24–72 범위의 정수 픽셀 값이며 value 셀은 텍스트 형식을 유지합니다. 주 제목은 작은 화면에서 자동 축소되며 개별 버튼·보조 글자 등 고정 크기는 그대로 유지됩니다. 학명의 `[i]…[/i]` 표시는 별도로 유지됩니다.

```bash
# Excel을 저장하고 닫은 뒤 테마만 검증하고 갱신합니다. 연구 자료와 사진은 재생성하지 않습니다.
.venv/bin/python -m scripts.build_site_theme
```

성공 후 로컬 페이지를 새로고침합니다. 잘못된 키·중복 키·허용 범위를 벗어난 값은 오류로 중단하며 기존 공개 데이터를 유지합니다. 전체 `pipeline --mode normal`도 테마를 반영합니다. `build_site_text`는 문구만, `build_site_theme`는 테마만 갱신합니다. 온라인 반영은 공개 데이터를 commit/push하는 기존 절차를 따릅니다. 이번 기능을 처음 배포할 때는 scripts/config/web/src와 공개 데이터를 함께 commit해야 합니다.

## 사진 추가와 교체

### 원본 폴더 변경 동기화 (추가·삭제·이름 변경·내용 교체)

Excel을 저장하고 닫은 뒤 아래 명령을 하나씩 실행합니다. 다른 등록·pipeline 명령을 동시에 실행하지 않습니다.

```bash
# 마지막 등록 기록의 파일명·SHA-256(파일 내용의 지문)과 현재 원본을 비교합니다.
# reports/<run_id>/sync-plan.json에서 add/delete/rename/replace 내역을 확인합니다.
.venv/bin/python -m scripts.sync_images

# 검증 후 Excel과 images_web를 함께 동기화합니다. 신규·교체 사진은 크기별 파일을 생성합니다.
.venv/bin/python -m scripts.sync_images --apply

# 변경된 Excel과 사진을 기반으로 웹 공개 데이터를 생성합니다.
.venv/bin/python -m scripts.pipeline --mode normal
```

신규 사진은 파일명 규칙에 따라 등록합니다. 삭제된 사진은 06의 행과 07의 연결, images_web의 세 파일을 제거합니다. 02와 05의 연구 기록은 유지합니다. 내용이 같은 파일의 명확한 이름 변경은 기존 image_id와 수동 메타데이터를 유지합니다. 이름 변경으로 taxon이나 형태를 변경할 수 없으며 모호한 중복 파일은 오류로 중단합니다. 같은 경로의 내용 교체는 기존 image_id로 파생 사진을 다시 생성합니다. 삭제된 번호는 재사용하지 않습니다.

적용 전에 임시 작업 폴더에서 검증·생성을 완료하며, 실패하면 실제 Excel과 파생 파일은 바꾸지 않습니다. 적용 시 `backups/sync-<run_id>/`에 Excel, 기존 images_web 전체, 이미지 manifest와 등록 기록을 백업합니다. `recovery.json`에 원래 경로와 백업 위치가 기록됩니다. 기존 파생 사진은 이 복구 폴더에 남습니다. 삭제한 원본 자체를 복구하는 기능은 아니므로 원본은 별도로 백업하세요. 작업 중 프로세스가 강제 종료되었다면 재실행 전에 이 백업과 `.state/sync-images.lock`을 확인합니다. 원본 폴더가 없거나 등록 사진이 있는데 폴더에 사진이 하나도 없으면 대량 삭제를 방지하기 위해 중단합니다.

동기화는 로컬 작업입니다. 신규 사진은 아래 업로드 절차, 교체 사진은 `--replace-changed` 업로드 절차를 수행한 뒤 공개 데이터와 코드를 배포합니다. 원격 사진은 자동 삭제하지 않습니다. 배포를 확인한 뒤 필요하면 별도로 삭제합니다. `register_images`는 기존의 추가 전용 명령이며, 원본의 삭제·이름 변경·내용 교체를 처리하려면 `sync_images`를 사용합니다.

### 이명과 보조 열

`08_Synonyms`의 열은 `name_id`, `taxon_id`, `name`, `name_type`, `status`, `note`입니다. 실제 이명을 입력할 때 앞의 네 열은 필수입니다. `name_id`는 고유 식별자(예: `SN000001`), `taxon_id`는 01의 분류군 식별자이며, `name_type`은 `scientific_synonym` 또는 `korean_synonym`입니다. status와 note는 선택 사항입니다. status는 이명 검색의 공개/비공개 필터로 사용하지 않습니다. 빈 시트에는 테스트 이명을 임의로 채우지 않습니다.

01의 `gbif_taxon_key`와 `accepted_taxon_id`는 현재 기능에 필요하지 않아 스키마에서 제거했습니다. `status`와 `acceptedScientificName`은 계속 사용합니다. `config/pipeline.yaml`의 `helper_columns`에 등록한 보조 열은 원본을 보존하고 공개 데이터에서 제외하며 경고 대신 정보로 보고합니다. 등록되지 않은 추가 열은 입력 실수를 발견할 수 있도록 계속 경고합니다.

1. 원본 사진을 `images_original/`에 넣습니다. 하위 폴더를 사용할 수 있으며 코드는 원본을 수정하지 않습니다.
2. 새 파일명은 `TX000365_MO0001_001.jpg`처럼 `taxon_id_morphology_id_구분문자.확장자` 형식으로 지정합니다. 첫 두 식별자는 Excel에 존재해야 하며 마지막 부분에는 밑줄도 사용할 수 있습니다. 기존 등록 사진은 이름을 바꾸지 않아도 됩니다.
3. Excel을 저장하고 닫은 다음 아래 등록 명령으로 미리 확인하고 적용합니다. `05_Taxon_Morphology`, `06_Images`, `07_Image_Morphology`에 필요한 행만 추가됩니다. `image_id`는 `IM000001` 형식의 영구 연속 번호이며 재실행해도 기존 번호나 수동 정보를 덮어쓰지 않습니다.
4. 촬영자, 저작권, cytotype, note 등은 등록 후 Excel에서 보완합니다. `original_filename`은 원본 폴더 기준 상대경로로 자동 기록됩니다.
5. 모든 등록 사진이 공개 대상입니다. 사진 유무는 연결된 사진에서 계산하며, 사진이 없다고 구조가 없다고 판단하지 않습니다. 형태 트리의 `display_order`는 유지하고 사진은 image_id 순으로 표시합니다.
6. 다음 명령을 실행합니다.

```bash
.venv/bin/python -m scripts.register_images
.venv/bin/python -m scripts.register_images --apply
.venv/bin/python -m scripts.validate --stage source
.venv/bin/python -m scripts.pipeline --mode normal
```

등록 명령은 기본적으로 미리보기입니다. 적용 시 변경 전 Excel을 `backups/`에 보관합니다. 신규 사진 중 잘못된 이름이나 없는 분류군·형태 식별자는 SKIPPED_FILENAME 경고로 기록하고 건너뜁니다. 원본 파일은 그대로 보존하며 유효한 사진은 계속 처리합니다. 중복 사진 또는 사라진 등록 원본은 추가 전용 등록 명령에서 오류가 됩니다. 원본 이름 변경은 등록 명령이 자동 추정하지 않으므로 sync_images를 사용합니다. 동기화 후 유효한 등록 사진이 하나도 남지 않으면 대량 삭제 보호로 중단합니다. `.state/image-id-registry.json`도 함께 백업하여 삭제된 번호의 재사용을 방지하세요. 로컬 생성 이후 원격 사진 업로드와 웹 배포는 아래 절차를 별도로 수행합니다.

사진 파일명에서 확인한 taxon_id가 `02_Cytotypes`에 없으면 해당 taxon_id만 있는 준비 행을 자동으로 추가합니다. cytotype_id와 나머지 값은 비워 두며, 기존 행이 있으면 중복 추가하거나 수정하지 않습니다. 사진의 cytotype_id도 자동 지정하지 않습니다. 준비 행은 웹의 cytotype 자료에 포함되지 않습니다. 생물학적 정보를 입력할 때는 고유한 cytotype_id를 함께 부여하세요. 한 분류군에 여러 cytotype을 등록할 수 있습니다.

이전 형식의 Excel은 한 번만 다음 명령으로 전환합니다. 02와 04의 status, 05의 presence_status/documentation_status, 06의 status, 07의 role/representative/display_order를 제거합니다. 다른 시트의 status는 유지합니다.

```bash
.venv/bin/python -m scripts.register_images --migrate
.venv/bin/python -m scripts.register_images --migrate --apply
```

등록되지 않은 원본 파일은 리사이즈하지 않습니다. 기존 ID를 바꾸거나 재번호화하지 마세요. `normal`은 이미 정상인 WebP를 유지하고 새 사진이나 누락된 크기만 만듭니다.

| WebP 종류 | 긴 변의 최대 길이 | 웹 사용 위치 |
|---|---:|---|
| `thumb` | 480 px | 사진 목록 썸네일 |
| `medium` | 1600 px | 사진을 클릭했을 때 기본 뷰어 |
| `large` | 3000 px | 뷰어의 큰 사진 선택 |

가로세로 비율을 유지하며 작은 원본을 확대하지 않습니다. 따라서 원본이 작으면 세 파일의 픽셀 크기가 같을 수 있습니다. 현재 WebP quality 설정은 85이며 크기와 품질은 `config/pipeline.yaml`에서 관리합니다. 생성은 로컬에서 이루어지고 별도 업로드 명령을 실행해야 Supabase에 저장됩니다.

같은 `image_id`의 원본 사진 자체를 교체했거나 크기·품질 설정을 변경한 경우에는 명시적으로 다시 생성합니다.

```bash
# 한 사진만 재생성
.venv/bin/python -m scripts.pipeline --mode rebuild --image-id IM000001

# 등록된 모든 사진을 재생성
.venv/bin/python -m scripts.pipeline --mode rebuild
```

이미 Supabase에 같은 경로의 이전 이미지가 있으면 아래 설명처럼 `--replace-changed`를 사용해야 합니다.

## Supabase Storage 연결

### 1. 이 프로젝트에서 Supabase가 하는 일

Supabase에는 웹 공개용 WebP만 올립니다.

- 업로드 대상: `thumb/<image_id>.webp`, `medium/<image_id>.webp`, `large/<image_id>.webp`
- 업로드하지 않는 자료: Excel, 원본 사진, EXIF/GPS, 보고서, 백업, `.env.local`
- 웹의 이미지 읽기: 공개 URL
- 업로드와 검증: 로컬 Python과 비밀키

따라서 Supabase Database 테이블, Auth, frontend Supabase SDK는 현재 필요하지 않습니다.

### 2. Supabase 프로젝트와 public bucket 만들기

1. 사용할 Supabase 계정으로 로그인하고 새 프로젝트를 만듭니다. 처음에는 Free plan을 선택할 수 있으며 현재 한도는 [Supabase Pricing](https://supabase.com/pricing)에서 확인합니다.
2. Dashboard의 **Storage**에서 **New bucket**을 선택합니다.
3. 이번 프로젝트에서 사용할 bucket 이름은 `pteridophytes-images`입니다. 기존 bucket이 있으면 이름을 확인해 그대로 사용합니다. 코드와 예제 환경변수 파일의 기본값은 `fern-images`이므로 아래처럼 실제 이름을 반드시 명시합니다.
4. **Public bucket**을 켜고 생성합니다.

public bucket은 URL을 아는 사용자가 파일을 읽을 수 있게 합니다. 업로드, 교체, 삭제 권한까지 공개되는 것은 아닙니다. 이 프로젝트는 익명 `INSERT`, `UPDATE`, `DELETE` 정책을 만들지 않고 로컬 비밀키로만 씁니다.

### 3. 프로젝트 URL과 비밀키 확인

Supabase Dashboard의 **Connect** 또는 **Project Settings → API Keys**에서 다음 값을 확인합니다. Dashboard 문구는 Supabase 업데이트에 따라 달라질 수 있습니다.

- Project URL: `https://<project-ref>.supabase.co`
- Secret key: `sb_secret_...`

현재 Supabase가 권장하는 secret key를 사용합니다. 이 키는 RLS를 우회할 수 있는 서버용 자격 증명이므로 브라우저 코드, `web/.env.local`, Vercel, Git, 문서, 화면 캡처에 넣지 않습니다. 기존 프로젝트의 legacy `service_role` key도 코드가 호환 변수 `SUPABASE_SERVICE_ROLE_KEY`로 읽지만 새 설정은 `SUPABASE_SECRET_KEY`를 사용합니다.

### 4. 로컬 업로드 환경변수 설정

처음 설정할 때만 예제 파일을 복사합니다. `-n`은 기존 `.env.local`이 있으면 덮어쓰지 않습니다.

```bash
cd /Users/kimhyoungtae/webapp/FernDigitalFlora
cp -n .env.example .env.local
```

루트 `.env.local`을 열어 실제 값을 입력합니다.

```dotenv
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
SUPABASE_STORAGE_BUCKET=pteridophytes-images
```

한 컴퓨터에서 서로 다른 Supabase 계정이나 프로젝트를 사용하는 것은 문제되지 않습니다. 이 프로젝트의 루트 `.env.local`에 적힌 URL과 key가 실제 업로드 대상을 결정합니다. 업로드 전에 URL의 `<project-ref>`가 이번 도감 프로젝트인지 확인하면 PlantCollection 등 다른 프로젝트와 섞이지 않습니다.

단, 터미널에 이미 `export SUPABASE_URL=...` 등으로 설정한 환경변수는 `.env.local`보다 우선합니다. 코드가 `load_dotenv(..., override=False)`를 사용하기 때문입니다. 다른 프로젝트의 변수를 export한 터미널에서는 이를 정리하거나 새 터미널을 사용하고, 명령이 출력하는 `target`과 `bucket`을 확인합니다. 숨김 파일은 `ls -a`로 확인하고 `nano .env.local`로 편집할 수 있습니다. nano에서는 Control+O, Enter로 저장하고 Control+X로 종료합니다.

### 5. 로컬 웹의 공개 이미지 환경변수 설정

```bash
cp -n web/.env.example web/.env.local
```

`web/.env.local`에는 공개 정보만 입력합니다.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=pteridophytes-images
NEXT_PUBLIC_LOCAL_PREVIEW=false
```

루트와 웹의 URL 및 bucket 이름은 같아야 합니다. `SUPABASE_SECRET_KEY`는 절대로 `web/.env.local`에 추가하지 않습니다. 값을 바꾼 뒤에는 `npm --prefix web run dev`를 다시 시작합니다.

### 6. 테스트 자료 해제 후 이미지 업로드

`config/pipeline.yaml`의 `test_dataset.enabled`가 `true`이면 임의로 연결한 TX000365 테스트 사진을 실데이터로 오인해 공개하지 않도록 원격 업로드가 `TEST_DATASET_LOCAL_ONLY` 오류로 중단됩니다. 실제 사진, Excel 연결, 촬영자와 저작권을 검토해 교체한 뒤에만 다음 값을 바꿉니다. 현재 설정은 `false`입니다.

```yaml
test_dataset:
  enabled: false
```

그다음 공개 release와 업로드 계획을 검증합니다.

```bash
.venv/bin/python -m scripts.validate --stage source
.venv/bin/python -m scripts.pipeline --mode normal
.venv/bin/python -m scripts.upload_images --dry-run
```

dry-run에서 프로젝트, bucket, 신규 파일 수, 변경 파일 수를 확인한 뒤 실제로 업로드하고 공개 URL을 검증합니다.

```bash
.venv/bin/python -m scripts.upload_images
.venv/bin/python -m scripts.verify_storage
npm --prefix web run check:deployment
```

같은 object 경로의 내용이 다르면 기본 업로드는 안전하게 실패합니다. 기존 사진을 의도적으로 교체한 경우에만 dry-run 결과를 확인하고 다음 명령을 사용합니다.

```bash
.venv/bin/python -m scripts.upload_images --dry-run --replace-changed
.venv/bin/python -m scripts.upload_images --replace-changed
.venv/bin/python -m scripts.verify_storage
```

코드는 원격 파일을 자동 삭제하지 않습니다. Excel에서 사진을 hidden/inactive로 바꾸면 공개 JSON에서는 빠지지만 이미 public bucket에 올라간 파일은 URL로 접근할 수 있습니다. `REMOTE_ORPHAN` 보고서를 검토한 후 삭제가 필요한 정확한 세 object를 Supabase Dashboard에서 직접 선택합니다.

공개 URL 형식은 다음과 같습니다.

```text
https://<project-ref>.supabase.co/storage/v1/object/public/pteridophytes-images/thumb/IM000001.webp
```

## GitHub와 Vercel 연결

이 프로젝트에서 Vercel과 Supabase를 별도의 marketplace integration으로 직접 연결할 필요는 없습니다. 로컬 Python이 Supabase Storage에 이미지를 올리고, Vercel의 Next.js 앱은 환경변수에 지정한 공개 Storage URL로 그 이미지를 읽습니다.

### 1. GitHub 저장소 준비

이 프로젝트가 아직 Git 저장소가 아니라면 GitHub에서 빈 저장소를 만든 뒤 프로젝트 루트에서 초기화합니다. `<account>`와 `<repository>`는 실제 값으로 바꿉니다.

```bash
cd /Users/kimhyoungtae/webapp/FernDigitalFlora
git init
git branch -M main
git add .
git status --short
git remote add origin https://github.com/<account>/<repository>.git
```

이미 Git 저장소와 origin이 설정되어 있다면 위 초기화·remote 추가 명령을 반복하지 않습니다. `git remote -v`로 현재 대상을 확인합니다. 이 프로젝트에서 확인한 origin은 `https://github.com/Mankyua06/pteridophytesdigitalflora.git`입니다.

GitHub는 HTTPS Git 작업에서 계정 비밀번호 인증을 지원하지 않습니다. 위 `gh auth login`이 표시하는 일회용 코드와 브라우저 안내에 따라 해당 GitHub 계정으로 로그인합니다. 브라우저 승인이 끝난 뒤 `gh auth status`로 계정이 맞는지 확인하고 push합니다. 터미널이 다시 Username과 Password를 묻는다면 계정 비밀번호를 입력하지 말고 `gh auth setup-git`을 다시 실행합니다.

`gh auth status`가 실패했다고 바로 토큰 만료로 단정하지 않습니다. 네트워크 제한이나 자격 증명 저장소 접근 문제도 확인합니다. 재인증이 필요하면 `gh auth login`을 다시 실행합니다. logout은 해당 계정의 저장된 CLI 인증을 제거하므로 필요한 경우에만 사용합니다.

`git add` 후에는 다음 자료가 추적되지 않는지 반드시 확인합니다.

```bash
git check-ignore -v Ferns_morphology_data.xlsx images_original/ .env.local web/.env.local
git ls-files Ferns_morphology_data.xlsx .env.local web/.env.local images_original images_web
```

첫 번째 명령은 각 경로가 ignore된 이유를 보여주어야 합니다. 두 번째 명령은 아무것도 출력하지 않아야 합니다. 공개 JSON인 `web/public/data/`는 Vercel 빌드에 필요하므로 Git에 포함합니다.

위 확인은 **commit/push 전에** 완료합니다. `.gitignore`는 이미 추적된 파일을 자동으로 제외하지 않습니다. 이어서 변경 목록을 검토합니다.

```bash
git diff --cached --stat
gh auth login --hostname github.com --git-protocol https --web
gh auth setup-git
gh auth status --hostname github.com
git commit -m "Initial Pteridophyte Digital Flora"
git push -u origin main
```

GitHub CLI(`gh`)가 없는 Mac에서는 Homebrew가 설치되어 있을 때 `brew install gh`로 설치할 수 있습니다. 브라우저에서 의도한 GitHub 계정으로 승인합니다. 변경이 없으면 commit할 필요가 없습니다. 위 인증 방법의 근거는 [GitHub 인증 안내](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-authentication-to-github)입니다.

### 2. Vercel Dashboard에서 프로젝트 Import

1. Vercel에서 **Add New → Project**를 선택합니다.
2. GitHub 저장소 접근을 허용하고 위 저장소를 **Import**합니다.
3. 다음 빌드 설정을 사용합니다.

| Vercel 설정 | 값 |
|---|---|
| Framework Preset | Next.js |
| Root Directory | `web` |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | Next.js 기본값, 별도 입력하지 않음 |

`Root Directory`가 저장소 루트로 남아 있으면 Vercel이 `web/package.json`을 올바르게 찾지 못하므로 반드시 `web`으로 지정합니다.

### 3. Vercel 환경변수 입력

Vercel 프로젝트의 **Settings → Environment Variables**에서 Preview와 Production에 다음 두 변수만 입력합니다.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=pteridophytes-images
```

`SUPABASE_SECRET_KEY`는 Vercel에 넣지 않습니다. Vercel은 이미 Supabase에 올라간 공개 이미지를 읽기만 합니다. `NEXT_PUBLIC_` 값은 Next.js 빌드 결과에 포함되므로 Vercel에서 값을 바꾸면 새 deployment를 실행해야 합니다.

### 4. 첫 배포 전 검사와 배포

이미지 업로드와 원격 검증을 먼저 끝낸 다음 아래 검사를 실행합니다.

```bash
.venv/bin/python -m scripts.verify_storage
npm --prefix web run check:deployment
npm --prefix web run lint
npm --prefix web run typecheck
npm --prefix web test
npm --prefix web run build
```

검사가 통과하면 변경된 코드, 설정, 문서, `web/public/data/`를 commit하고 GitHub에 push합니다. Git 연동 Vercel 프로젝트는 Production branch인 `main`의 push를 Production에, 다른 branch의 push를 Preview deployment에 반영합니다. Vercel Dashboard에서 build가 성공했는지 확인한 뒤 배포 URL의 Home, Taxa, Morphology, Photo Gallery, Statistics, Contributors와 실제 사진을 확인합니다.

### 5. 환경변수만 수정한 경우의 재배포

Vercel의 환경변수 변경은 기존 deployment를 수정하지 않습니다. Settings에서 저장한 뒤 Deployments에서 대상 deployment의 Redeploy를 실행하거나 새 commit을 push해 다시 빌드합니다. Preview와 Production의 변수 적용 범위를 각각 확인합니다. [Vercel 환경변수 안내](https://vercel.com/docs/environment-variables).

이 문서는 저장소 루트 안의 `web`을 배포하는 Git 연동 방식으로 통일합니다. 별도 CLI 배포는 프로젝트 연결 위치와 Root Directory가 맞아야 하므로 Git 배포 명령과 혼용하지 않습니다. `vercel env pull` 또한 필수 단계가 아니며 기존 로컬 환경변수 파일을 교체할 수 있습니다.

## 변경 후 업데이트와 재배포

일상적인 업데이트는 아래 세 가지로 구분합니다. 모든 명령은 `FernDigitalFlora` 루트에서 실행하고, Excel은 저장하고 닫습니다. **각 명령이 성공한 뒤 다음 명령을 실행합니다.** 오류가 있으면 commit·push를 진행하지 않습니다.

```bash
# 현재 수정 파일과 이미 commit 대상으로 준비된 파일을 확인합니다.
git status --short
```

로컬 데이터 생성이나 build만으로 온라인 사이트가 바뀌지는 않습니다. 아래 push 후에는 Vercel의 해당 브랜치 배포가 성공했는지 확인하고, 실제 사이트에서 변경 내용을 확인합니다. Excel, 원본 사진, 백업, 비밀 환경변수는 Git에 올리지 않습니다.

### 1. 코드가 변경되었을 때

화면 코드, CSS(Cascading Style Sheets), Python 스크립트, 설정, 테스트, 문서 변경에 사용합니다. **화면·스타일·테스트·문서만 바뀌었다면 첫 pipeline 명령은 생략합니다.** 데이터 생성 코드나 스키마·공개 필드 설정이 바뀌었다면 실행해야 합니다. 이미지 크기·품질 설정을 변경했다면 `--mode rebuild`로 생성하고 3번의 원격 업로드 절차도 수행합니다.

```bash
# 데이터 처리 코드나 설정이 바뀐 경우에만 공개 데이터를 다시 생성합니다.
.venv/bin/python -m scripts.pipeline --mode normal

# Python 테스트와 코드 규칙을 검사합니다.
.venv/bin/python -m pytest -q
.venv/bin/ruff check scripts tests

# 웹 코드 규칙, 자료형, 단위 테스트를 검사합니다.
npm --prefix web run lint
npm --prefix web run typecheck
npm --prefix web test

# 별도 합성 데이터로 브라우저 동작을 검사합니다. 실제 Excel은 수정하지 않습니다.
npm --prefix web run test:e2e

# 배포할 데이터가 참조하는 원격 사진과 파일 해시를 확인합니다.
npm --prefix web run check:deployment

# 공개 데이터를 검증하고 로컬에서 배포용 웹사이트를 빌드합니다.
npm --prefix web run build

# 코드, 설정, 테스트, 문서, 생성된 공개 데이터를 함께 commit 대상으로 준비합니다.
git add README.md config docs scripts tests web .github pyproject.toml uv.lock

# 실제 포함되는 파일을 확인합니다. 위 경로 밖의 필요한 변경은 별도로 추가합니다.
git diff --cached --stat

# 로컬 Git 이력에 기록하고 원격 저장소로 전송합니다.
git commit -m "Update website code and data"
git push
```

브라우저 실행 파일이 없다는 오류가 나오면 최초 한 번 `cd web` → `npx playwright install chromium` → `cd ..`를 실행한 뒤 브라우저 검사를 다시 수행합니다. 표지 이미지는 `web/public/backgrounds/coverimage.jpeg`를 수정해야 하며 루트의 표지 파일만 바꾸면 자동 복사되지 않습니다.

### 2. Excel 데이터만 변경되었을 때

분류군, 형태, cytotype, 이명, 참여자, 사진 메타데이터, 문구 또는 테마를 수정한 경우입니다. 원본 사진 파일도 바뀌었다면 3번을 사용합니다.

```bash
# Excel을 검증하고 공개 데이터를 갱신합니다. 원격 업로드는 하지 않습니다.
.venv/bin/python -m scripts.pipeline --mode normal

# 원격 사진의 존재와 파일 해시를 검사합니다.
npm --prefix web run check:deployment

# 갱신된 데이터로 웹사이트가 정상 빌드되는지 검사합니다.
npm --prefix web run build

# Excel 자체가 아니라 생성된 공개 데이터만 commit 대상으로 준비합니다.
git add web/public/data

# 다른 변경이 이미 준비되어 있지 않은지 확인합니다.
git diff --cached --stat

# 로컬 이력에 기록하고 온라인 배포를 위한 변경을 전송합니다.
git commit -m "Update flora data"
git push
```

**문구·테마만 수정했다면** 위 첫 pipeline 명령 대신 아래에서 해당 명령만 사용합니다. 이후 검사·build·commit·push는 동일합니다. 두 시트를 모두 바꾸었다면 두 명령을 순서대로 실행하거나 전체 pipeline을 사용합니다.

```bash
# 10_Site_Text만 변경: 연구 자료와 사진을 다시 만들지 않고 문구만 갱신합니다.
.venv/bin/python -m scripts.build_site_text

# 11_Site_Theme만 변경: 연구 자료와 사진을 다시 만들지 않고 테마만 갱신합니다.
.venv/bin/python -m scripts.build_site_theme
```

로컬 확인만 필요하면 데이터 생성 후 개발 서버에서 페이지를 새로고침하면 됩니다. 새 사진을 Excel에 수동 등록하여 공개 사진 목록이 늘어난 경우에도 3번의 업로드 절차가 필요합니다.

### 3. 사진이 추가·교체·이름 변경·삭제되었을 때

새 원본은 `taxon_id_morphology_id_구분문자.확장자` 형식을 사용합니다. 변경을 미리 확인한 뒤 Excel과 `images_web`를 함께 동기화합니다. 이 절차에서는 `register_images --apply`를 먼저 실행하지 않습니다.

```bash
# 원본과 이전 기록을 비교합니다. 보고서에서 추가·삭제·이름 변경·교체 목록을 확인합니다.
.venv/bin/python -m scripts.sync_images

# 백업 후 Excel과 웹용 사진을 동기화합니다. 02/05의 연구 기록은 유지합니다.
.venv/bin/python -m scripts.sync_images --apply

# 변경된 Excel과 웹용 사진으로 공개 데이터를 생성합니다.
.venv/bin/python -m scripts.pipeline --mode normal

# 업로드 대상과 교체할 파일을 미리 확인합니다. 원격 파일은 아직 변경하지 않습니다.
.venv/bin/python -m scripts.upload_images --dry-run --replace-changed

# 신규·변경 파일을 업로드합니다. 같은 내용의 파일은 건너뛰고 다른 내용은 교체합니다.
.venv/bin/python -m scripts.upload_images --replace-changed

# 원격 파일이 현재 공개 데이터와 일치하는지 검증합니다.
.venv/bin/python -m scripts.verify_storage
npm --prefix web run check:deployment

# 배포용 웹사이트를 로컬에서 빌드하여 확인합니다.
npm --prefix web run build

# 생성된 공개 데이터를 commit 대상으로 준비하고 포함 파일을 확인합니다.
git add web/public/data
git diff --cached --stat

# 변경 이력을 기록하고 온라인 배포를 위한 변경을 전송합니다.
git commit -m "Synchronize flora photographs"
git push
```

삭제 또는 이름 변경만 있었고 `check:deployment`가 통과한다면 두 upload 명령은 생략할 수 있습니다. `--replace-changed`는 원격의 기존 사진도 교체하므로 dry-run의 대상 프로젝트·bucket·변경 내역을 확인한 뒤 사용합니다. 같은 사진 주소를 사용하는 기존 배포에도 교체가 반영될 수 있습니다.

사진 삭제 시 온라인 화면에서는 새 공개 데이터 배포 후 사라집니다. **원격 저장소의 오래된 사진 파일은 자동 삭제되지 않습니다.** 배포 확인 후 다른 사용처가 없는지 검토하여 별도로 삭제합니다. 원본 폴더가 비어 있으면 대량 삭제 보호로 동기화가 중단됩니다. 삭제한 사진을 다시 등록하거나 교체 후 먼저 등록 명령을 실행해서 오류가 난 경우에는 작업을 멈추고 보고서를 확인합니다. 동기화의 복구 자료는 `backups/sync-<run_id>/recovery.json`에 기록됩니다.

**여러 종류를 함께 수정한 경우:** 사진 동기화 → 데이터 생성 → 필요한 원격 업로드 → 검사·build 순으로 실행하고, 1번의 코드·설정·공개 데이터 경로를 함께 commit합니다. 같은 단계는 반복할 필요가 없습니다.

## 문제 해결

### 환경변수 또는 호스팅 설정만 변경한 경우

환경변수는 Git에 commit하지 않습니다. 로컬 환경변수를 바꾸었다면 개발 서버를 재시작합니다. 온라인 환경변수 변경은 기존 배포에 자동 적용되지 않으므로 Vercel에서 새 배포를 실행하고 실제 페이지를 확인합니다.

저장소 프로젝트나 bucket을 바꾼 경우에는 루트의 업로드 설정, 웹의 공개 설정, 온라인 환경변수가 같은 대상을 가리키도록 맞춥니다. 새 대상에 사진을 업로드하고 원격 검증이 통과한 뒤 배포합니다. 구체적인 초기 설정은 위 연결 안내를 참고하세요.

### 174개 업로드가 모두 실패한 경우 (2026-09-11 확인)

당시 로컬 설정의 연결 대상은 `https://cbiajwdmlkqrbpqnevsv.supabase.co`, bucket은 `pteridophytes-images`였습니다. 이 진단은 당시 설정에 대한 기록이며 현재 인증·업로드 성공 여부는 명령으로 다시 확인해야 합니다. bucket 이름은 루트 `.env.local`, `web/.env.local`, Vercel에 동일하게 입력합니다.

이번 실패에서는 `SUPABASE_SECRET_KEY` 변수에 **publishable key**가 입력되어 있었습니다. 변수 이름을 secret으로 적어도 키의 권한은 바뀌지 않습니다. Supabase의 해당 프로젝트 → Settings → API Keys에서 **Secret key (`sb_secret_...`)**를 확인해 루트 `.env.local`의 값을 교체하세요. legacy 키를 사용하는 경우에는 `anon`이 아닌 `service_role`이어야 합니다. 비밀키는 채팅이나 웹 환경변수에 붙여넣지 않습니다.

Storage 화면에서 `pteridophytes-images` bucket이 실제로 존재하고 Public인지 확인합니다. publishable key로 조회한 빈 bucket 목록은 bucket이 없다는 확정 근거가 아닙니다. 수정한 코드는 공개용 키와 접근 불가능한/private bucket을 파일 전송 전에 거부합니다. dry-run은 파일을 쓰지 않으므로 성공하더라도 실제 쓰기 성공을 보장하지는 않습니다.

설정 수정 후 아래 명령을 **하나씩 실행하고 PASS를 확인한 후 다음으로 진행**합니다.

```bash
.venv/bin/python -m scripts.upload_images --dry-run
.venv/bin/python -m scripts.upload_images
.venv/bin/python -m scripts.verify_storage
npm --prefix web run check:deployment
```

기존 127개 warning은 업로드 권한 오류와 별개입니다. 촬영자/저작권 미입력, 선택 열·시트 누락 등을 보고서에서 확인하고 실제 값을 입력합니다. 없는 정보를 임의로 채우지 않습니다.

| 증상 | 확인할 내용 |
|---|---|
| Excel을 저장했지만 화면이 그대로임 | 수정 시트에 맞는 Python 명령을 실행했는지, 명령이 종료 코드 0인지, `web/public/data/` 수정 시간이 바뀌었는지 확인합니다. |
| `10_Site_Text`만 바뀌지 않음 | `.venv/bin/python -m scripts.build_site_text`를 실행하고 브라우저를 새로고침합니다. 다른 데이터 시트는 이 명령으로 갱신되지 않습니다. |
| pipeline이 중단됨 | 터미널이 가리키는 `reports/<run_id>/summary.md`와 validation 보고서의 시트·셀 오류를 수정합니다. |
| `TEST_DATASET_LOCAL_ONLY` | TX000365의 임의 테스트 자료가 활성화되어 있습니다. 실제 자료와 권리 정보를 검토하기 전에는 해제하지 않습니다. |
| 사진이 로컬에서 안 보임 | `web/.env.local`의 `NEXT_PUBLIC_LOCAL_PREVIEW=true`와 개발 서버 재시작 또는 Supabase 공개 URL 설정을 확인합니다. |
| 사진이 Vercel에서 안 보임 | Supabase bucket이 public인지, URL·bucket 변수가 맞는지, object가 `thumb/`, `medium/`, `large/` 경로에 있는지 확인합니다. |
| `upload_images`가 변경 파일에서 실패함 | 의도한 사진 교체인지 먼저 확인하고 `--dry-run --replace-changed` 후 `--replace-changed`를 사용합니다. |
| Vercel에 예전 내용이 보임 | 공개 JSON이 commit/push되었는지, 최신 deployment가 성공했는지, 환경변수 수정 후 재배포했는지 확인합니다. |
| Vercel이 package.json을 찾지 못함 | Vercel Root Directory가 `web`인지 확인합니다. |
| 다른 Supabase 프로젝트로 올라감 | 루트 `.env.local`의 Project URL `<project-ref>`와 key 조합을 다시 확인합니다. |

## 전체 검사

```bash
uv run pytest -q
uv run ruff check scripts tests
uv run python -m scripts.validate --stage public
npm --prefix web test
npm --prefix web run lint
npm --prefix web run typecheck
npm --prefix web run build
cd web
npx playwright install chromium
cd ..
npm --prefix web run test:e2e
```

브라우저 테스트는 `work/e2e-source`, `work/e2e-web`에 합성 자료를 생성하며 실제 master, 원본, 공개 JSON을 교체하지 않습니다. 모든 Python CLI는 `--help`를 지원합니다. **이 문서의 `.venv/bin/python -m scripts...` 명령은 프로젝트 루트에서 실행해야 합니다.** 실행된 코드 내부의 데이터 경로는 루트를 기준으로 해석되지만, 다른 디렉터리에서는 상대 실행파일 경로나 `scripts` 모듈 검색이 실패할 수 있습니다. `--root`는 데이터 작업 대상을 바꾸는 옵션입니다. 성공 종료 코드는 0, 검증·실행 실패는 1, 잘못된 인자는 2입니다.

## 관련 문서와 공식 자료

프로젝트 문서: [스키마](docs/schema.md), [구현 결정](docs/decisions.md), [자료 업데이트](docs/workflow.md), [Supabase Storage](docs/supabase-storage.md), [GitHub·Vercel 배포](docs/deployment.md), [백업과 복구](docs/backup-recovery.md), [사이트 문구](docs/site-text.md), [통계 산정](docs/statistics.md), [참여자·표지](docs/contributors.md), [TX000365 로컬 테스트](docs/local-test-TX000365.md).

공식 자료: [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys), [Supabase Storage quickstart](https://supabase.com/docs/guides/storage/quickstart), [Supabase bucket 유형](https://supabase.com/docs/guides/storage/buckets/fundamentals), [Vercel Git 배포](https://vercel.com/docs/git), [Vercel 환경변수](https://vercel.com/docs/environment-variables), [Vercel CLI 배포](https://vercel.com/docs/projects/deploy-from-cli).
