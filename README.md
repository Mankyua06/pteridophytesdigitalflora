# Pteridophyte Digital Flora

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

개발 서버 기본 주소는 `http://127.0.0.1:3000`입니다. 다른 포트를 사용 중이면 터미널에 표시된 주소를 엽니다. Supabase가 없어도 분류군과 형태 자료를 탐색할 수 있습니다. 로컬 파생 사진까지 표시하려면 `web/.env.local`에 `NEXT_PUBLIC_LOCAL_PREVIEW=true`를 넣고 개발 서버를 다시 시작합니다.

이 문서의 Python 명령은 현재 프로젝트에 이미 만들어진 `.venv`를 기준으로 표기합니다. 다음 두 명령 형식은 같은 환경을 사용합니다.

```bash
.venv/bin/python -m scripts.pipeline --mode normal
uv run python -m scripts.pipeline --mode normal
```

## Excel 시트 수정 후 로컬 웹에 반영

Excel을 완전히 저장하고 프로젝트 루트에서 수정 범위에 맞는 명령을 실행합니다.

| 변경 내용 | 실행할 명령 |
|---|---|
| `10_Site_Text`만 수정 | `.venv/bin/python -m scripts.build_site_text` |
| `01_Taxa`부터 `09_Contributors`까지의 데이터 시트 중 하나 이상 수정 | `.venv/bin/python -m scripts.pipeline --mode normal` |
| 데이터 시트와 `10_Site_Text`를 함께 수정 | `.venv/bin/python -m scripts.pipeline --mode normal` |
| 코드, CSS, 웹 정적 이미지 파일만 수정 | Python pipeline 불필요 |

현재 master에는 `01_Taxa`, `02_Cytotypes`, `03_Morphology_Terms`, `04_Morphology_Tree`, `05_Taxon_Morphology`, `06_Images`, `07_Image_Morphology`, `09_Contributors`, `10_Site_Text`가 있습니다. 향후 선택 시트인 `08_Synonyms`를 추가한 경우에도 전체 pipeline을 실행합니다.

`build_site_text`는 `10_Site_Text`만 다시 읽고 기존 연구 데이터는 유지합니다. 다만 한 번의 공개 release가 서로 같은 `release_id`를 가져야 하므로 `web/public/data/` 아래 여러 JSON 파일이 함께 변경될 수 있습니다. Git 반영 시 `site-text.json` 하나만 고르지 말고 `web/public/data/`의 전체 변경을 검토합니다.

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
3. bucket 이름을 `fern-images`로 입력합니다.
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
SUPABASE_STORAGE_BUCKET=fern-images
```

한 컴퓨터에서 서로 다른 Supabase 계정이나 프로젝트를 사용하는 것은 문제되지 않습니다. 이 프로젝트의 루트 `.env.local`에 적힌 URL과 key가 실제 업로드 대상을 결정합니다. 업로드 전에 URL의 `<project-ref>`가 이번 도감 프로젝트인지 확인하면 PlantCollection 등 다른 프로젝트와 섞이지 않습니다.

### 5. 로컬 웹의 공개 이미지 환경변수 설정

```bash
cp -n web/.env.example web/.env.local
```

`web/.env.local`에는 공개 정보만 입력합니다.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=fern-images
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
https://<project-ref>.supabase.co/storage/v1/object/public/fern-images/thumb/IM000001.webp
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
git commit -m "Initial Pteridophyte Digital Flora"
git remote add origin https://github.com/<account>/<repository>.git
git push -u origin main
```

`git add` 후에는 다음 자료가 추적되지 않는지 반드시 확인합니다.

```bash
git check-ignore -v Ferns_morphology_data.xlsx images_original/ .env.local web/.env.local
git ls-files Ferns_morphology_data.xlsx .env.local web/.env.local images_original images_web
```

첫 번째 명령은 각 경로가 ignore된 이유를 보여주어야 합니다. 두 번째 명령은 아무것도 출력하지 않아야 합니다. 공개 JSON인 `web/public/data/`는 Vercel 빌드에 필요하므로 Git에 포함합니다.

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
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=fern-images
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

### 5. Vercel CLI를 사용하는 선택 방법

Dashboard 연결이 기본 방법입니다. CLI가 필요한 경우 [Vercel CLI](https://vercel.com/docs/cli)를 설치한 뒤 `web` 디렉터리에서 실행합니다.

```bash
cd /Users/kimhyoungtae/webapp/FernDigitalFlora/web
vercel link
vercel env pull .env.local
vercel             # Preview deployment
vercel --prod      # Production deployment
```

`vercel link`는 `.vercel/`을 만들며 이 폴더는 Git에서 제외됩니다. `vercel env pull`은 Vercel에 저장한 Development 환경변수를 로컬 `web/.env.local`로 가져옵니다. Production 배포는 공개 사이트를 바꾸므로 검사 완료 후 실행합니다.

## 변경 후 업데이트와 재배포

### Excel 문구만 변경한 경우

```bash
.venv/bin/python -m scripts.build_site_text
npm --prefix web run build
git add web/public/data
git commit -m "Update site text"
git push
```

로컬 확인만 필요하면 첫 명령 후 브라우저를 새로고침하면 됩니다. 온라인 사이트는 생성된 JSON을 commit하고 push해야 Vercel이 다시 배포합니다.

### 분류군·형태·사진 메타데이터·참여자를 변경한 경우

```bash
.venv/bin/python -m scripts.pipeline --mode normal
npm --prefix web run build
git add web/public/data
git commit -m "Update flora data"
git push
```

Excel 파일 자체는 Git에 올리지 않습니다. Vercel에 반영되는 것은 pipeline이 생성한 공개 JSON입니다.

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

Supabase public object의 기본 cache가 3600초이므로 교체 직후 이전 이미지가 잠시 보일 수 있습니다. `verify_storage`가 이전 hash를 받으면 cache 시간이 지난 뒤 다시 검사합니다.

### 코드, CSS, 표지 이미지 파일만 변경한 경우

Excel이나 pipeline을 실행할 필요가 없습니다.

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

실제 연결 대상은 `https://cbiajwdmlkqrbpqnevsv.supabase.co`, bucket은 `pteridophytes-images`입니다. 위 예제의 `fern-images` 대신 실제 생성한 bucket 이름을 루트 `.env.local`, `web/.env.local`, Vercel에 동일하게 입력합니다.

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

브라우저 테스트는 `work/e2e-source`, `work/e2e-web`에 합성 자료를 생성하며 실제 master, 원본, 공개 JSON을 교체하지 않습니다. 모든 Python CLI는 `--help`를 지원합니다. Python 명령은 실행 위치와 무관하게 프로젝트 루트를 기준으로 경로를 해석하며 다른 루트는 `--root`로 지정합니다. 성공 종료 코드는 0, 검증·실행 실패는 1, 잘못된 인자는 2입니다.

## 관련 문서와 공식 자료

프로젝트 문서: [스키마](docs/schema.md), [구현 결정](docs/decisions.md), [자료 업데이트](docs/workflow.md), [Supabase Storage](docs/supabase-storage.md), [GitHub·Vercel 배포](docs/deployment.md), [백업과 복구](docs/backup-recovery.md), [사이트 문구](docs/site-text.md), [통계 산정](docs/statistics.md), [참여자·표지](docs/contributors.md), [TX000365 로컬 테스트](docs/local-test-TX000365.md).

공식 자료: [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys), [Supabase Storage quickstart](https://supabase.com/docs/guides/storage/quickstart), [Supabase bucket 유형](https://supabase.com/docs/guides/storage/buckets/fundamentals), [Vercel Git 배포](https://vercel.com/docs/git), [Vercel 환경변수](https://vercel.com/docs/environment-variables), [Vercel CLI 배포](https://vercel.com/docs/projects/deploy-from-cli).
