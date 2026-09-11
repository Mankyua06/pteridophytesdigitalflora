# GitHub와 Vercel 배포

이 프로젝트는 작업 시작 시 Git 저장소가 아니었습니다. 실제 원격 생성·push·배포는 아직 하지 않았습니다.

## Git 저장 정책

코드, config, docs, CI, tests, 합성 fixture 생성 코드, .env.example, uv.lock, package-lock.json, web/public/data를 버전 관리합니다. 실제 xlsx/xls·images_original·images_web·.state·reports·backups·work·.env.local은 제외합니다.

연결할 GitHub 저장소가 확정되면 프로젝트 루트에서 Git을 초기화하고 원격을 연결합니다. push 전 `git status --short`, `git ls-files`, `git check-ignore`로 실제 master·사진·키가 추적되지 않는지 확인합니다. `.gitignore`는 이미 추적한 파일을 소급 제거하지 않습니다. 비밀값을 추적했다면 공개 전 추적 제거와 필요시 키 교체가 필요합니다.

## Vercel 프로젝트

| 설정 | 값 |
|---|---|
| Framework Preset | Next.js |
| Root Directory | web |
| Install Command | npm ci |
| Build Command | npm run build |
| Output Directory | Next.js 기본값 |

GitHub 저장소를 Vercel Import Project에서 연결하고 Preview/Production에 각각 `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`을 지정합니다. 공개 환경변수는 빌드에 포함되므로 변경 후 새 빌드가 필요합니다. 업로드 비밀키는 Vercel에 넣지 않습니다. Excel·원본·Python은 Vercel 빌드에 필요하지 않습니다.

## 운영 배포 전 검증

```bash
uv run python -m scripts.verify_storage
npm --prefix web run check:deployment
npm --prefix web run build
```

`check:deployment`는 공개 환경변수가 없으면 빈 release에서도 실패합니다. 설정이 있으면 브라우저가 사용하는 공개 URL의 모든 객체를 다운로드해 release manifest의 hash와 비교합니다. `verify_storage` 기록은 `.state/remote/`에서 대상 프로젝트·bucket·release_id·검증 run_id로 확인합니다. 배포할 release.json의 release_id가 기록과 같아야 합니다. 해당 검사 후 데이터를 바꾸면 다시 검사합니다.

원격 이미지 준비를 먼저 완료하고 그 JSON을 commit/push합니다. GitHub 연결 이후 Vercel이 빌드하도록 설정하고 배포 URL에서 홈·분류군·형태·갤러리 및 이미지 실패 화면을 확인합니다. 고정 이미지 경로를 공유하므로 Preview와 Production 간 다른 이미지 내용을 동시에 격리하지 못합니다. 필요하면 별도 프로젝트/bucket 설정을 사용합니다.

현재 빈 초기 JSON은 로컬 화면 개발용입니다. 실제 연구자료를 발행했다고 설명하지 않습니다. 실계정 업로드와 Vercel 응답 검증은 별도 작업입니다.
