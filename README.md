# Pteridophyte Digital Flora

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

## 사진 추가와 교체

1. 원본 사진을 `images_original/`에 넣습니다. 하위 폴더를 사용할 수 있으며 코드는 원본을 수정하지 않습니다.
2. `06_Images`에 영구 `image_id`, `taxon_id`, `original_filename`, `status`, 촬영자, 저작권 정보를 입력합니다.
3. `original_filename`은 `DSC_0001.jpeg` 또는 `2026/Jeju/DSC_0001.jpeg`처럼 `images_original/` 기준 상대경로를 입력합니다. 대소문자와 확장자도 실제 파일과 일치해야 합니다.
4. `07_Image_Morphology`에 사진과 형태 항목의 관계를 입력합니다. 형태 항목과 연결하지 않은 사진도 해당 taxon의 갤러리에는 포함됩니다.
5. `05_Taxon_Morphology`에는 사진 유무와 별개로 구조 존재 여부와 자료 확보 상태를 입력합니다.
6. 다음 명령을 실행합니다.

```bash
.venv/bin/python -m scripts.validate --stage source
.venv/bin/python -m scripts.pipeline --mode normal
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

아래 작업 전 루트로 이동하고 `git status --short`를 확인합니다. 여러 명령을 한 번에 붙여넣으면 앞 명령이 실패해도 다음 명령이 실행될 수 있습니다. 각 단계 성공 후 다음으로 진행합니다. commit 직전에는 `git diff --cached --stat`로 이전에 staging한 다른 변경도 함께 포함되는지 확인합니다.

### Excel 문구만 변경한 경우

```bash
.venv/bin/python -m scripts.build_site_text
npm --prefix web run check:deployment
npm --prefix web run build
git add web/public/data
git commit -m "Update site text"
git push
```

로컬 확인만 필요하면 첫 명령 후 브라우저를 새로고침하면 됩니다. 온라인 사이트는 생성된 JSON을 commit하고 push해야 Vercel이 다시 배포합니다.

### 분류군·형태·사진 메타데이터·참여자를 변경한 경우

```bash
.venv/bin/python -m scripts.pipeline --mode normal
npm --prefix web run check:deployment
npm --prefix web run build
git add web/public/data
git commit -m "Update flora data"
git push
```

Excel 파일 자체는 Git에 올리지 않습니다. Vercel에 반영되는 것은 pipeline이 생성한 공개 JSON입니다.

사진 status를 공개로 바꾸는 등 공개 이미지 목록이 늘어난 경우에는 메타데이터만 수정했어도 아래 사진 업로드 절차를 수행해야 합니다. 검사에서 이미지 누락이 나오면 그대로 배포하지 않습니다.

### 새 원본 사진을 추가한 경우

```bash
.venv/bin/python -m scripts.pipeline --mode normal
.venv/bin/python -m scripts.upload_images --dry-run
.venv/bin/python -m scripts.upload_images
.venv/bin/python -m scripts.verify_storage
npm --prefix web run check:deployment
npm --prefix web run build
git add web/public/data
git commit -m "Add flora photographs"
git push
```

Supabase 업로드를 먼저 완료하고 그 이미지들을 가리키는 JSON을 배포합니다. 이렇게 하면 Vercel 배포 직후 이미지가 없는 시간이 생기지 않습니다.

### 기존 원본 사진을 교체한 경우

```bash
.venv/bin/python -m scripts.pipeline --mode rebuild --image-id IM000001
.venv/bin/python -m scripts.upload_images --dry-run --replace-changed
.venv/bin/python -m scripts.upload_images --replace-changed
.venv/bin/python -m scripts.verify_storage
npm --prefix web run check:deployment
npm --prefix web run build
git add web/public/data
git commit -m "Replace flora photograph"
git push
```

이 프로젝트는 업로드 시 `config/pipeline.yaml`의 `cache_control: 3600` 값을 전달합니다. 이는 Supabase 전체의 고정 기본값이라는 뜻이 아닙니다. 교체 후 이전 이미지가 보이면 cache 가능성을 확인하고 다시 검증합니다. 일정 시간이 지났다는 이유만으로 성공으로 판단하지 말고 해시 검사 결과를 확인합니다. 같은 object URL을 사용하는 기존 배포도 이미지 교체의 영향을 받습니다.

### 코드, CSS, 표지 이미지 파일만 변경한 경우

웹 UI 코드나 CSS만 수정했다면 Excel pipeline은 필요하지 않습니다. 표지는 실제 웹 파일인 `web/public/backgrounds/coverimage.jpeg`를 교체합니다. 루트의 `coverimage.jpeg`를 수정하는 것만으로 자동 복사되지는 않습니다. Python 생성 코드나 `config/`를 변경했다면 해당 검사를 실행하고 공개 JSON을 다시 생성해야 하므로 아래 웹 전용 절차와 구분합니다.

```bash
npm --prefix web run lint
npm --prefix web run typecheck
npm --prefix web test
npm --prefix web run build
git add web
git commit -m "Update website"
git push
```

### Supabase 프로젝트나 bucket을 변경한 경우

1. 새 Supabase 프로젝트에 public bucket을 만듭니다.
2. 루트 `.env.local`의 URL, secret key, bucket을 바꿉니다.
3. `web/.env.local`의 공개 URL과 bucket을 같은 대상으로 바꿉니다.
4. 현재 release 이미지를 새 bucket에 업로드하고 `verify_storage`를 실행합니다.
5. Vercel Preview와 Production의 두 공개 환경변수도 바꿉니다.
6. 새 Vercel deployment를 실행하고 사진 URL을 확인합니다.

## 문제 해결

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
