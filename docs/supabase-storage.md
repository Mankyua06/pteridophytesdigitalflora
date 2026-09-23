# Supabase Storage 설정

Dashboard에서 **public** bucket `fern-images`를 준비합니다. 공개 읽기와 쓰기는 별개입니다. 익명 INSERT/UPDATE/DELETE 정책은 열지 않습니다. 여기서는 계정·bucket을 자동 생성하지 않습니다.

로컬 `.env.local`만 다음 설정을 가집니다.

```dotenv
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SECRET_KEY=
SUPABASE_STORAGE_BUCKET=fern-images
```

현행 secret key(`sb_secret_...`)를 사용하며 기존 service_role 키는 `SUPABASE_SERVICE_ROLE_KEY`라는 호환 변수로도 읽습니다. 두 변수가 있으면 SUPABASE_SECRET_KEY가 우선입니다. 실제 권한은 SDK 연결 후 원격에서 검증해야 하며 이 구현에서 실계정 검증은 아직 하지 않았습니다. SDK 버전은 uv.lock에 고정합니다.

Python의 공식 `supabase.create_client`와 `storage.from_().list/upload`를 사용합니다. 목록은 offset 100개씩 페이지네이션하고 폴더를 순회합니다. public URL의 응답 바이트를 SHA-256으로 검증합니다. 로그에는 키나 SDK 예외 본문을 남기지 않습니다.

대상 파일은 공개 release의 image-manifest에 있는 `thumb/ID.webp`, `medium/ID.webp`, `large/ID.webp`뿐입니다. 실행 직전 source stamp·원본·파생 파일을 재검증합니다. 원본·Excel·로컬 manifest·내부 보고서는 올리지 않습니다. Content-Type은 image/webp입니다.

dry-run도 원격 목록 조회·다운로드는 할 수 있지만 upload/delete는 호출하지 않습니다. 같은 경로의 내용이 다르면 기본적으로 실패하며 `--replace-changed`에서만 upsert합니다. 누락 객체는 신규 생성합니다. 제한된 재시도 후 부분 실패는 release 검증 실패입니다. 자동 삭제는 없습니다.

공개 URL은 `https://<project-ref>.supabase.co/storage/v1/object/public/fern-images/thumb/IM000001.webp` 형식입니다. 정밀 locality·촬영 원본의 EXIF/GPS는 공개하지 않습니다. 웹앱에는 공개 URL과 bucket만 필요하며 frontend Supabase SDK나 API key는 필요하지 않습니다.

## hidden 전환과 삭제

등록 사진은 모두 공개 대상입니다. Excel에서 사진 행과 관련 연결 행을 제거하고 JSON을 재생성하더라도 이미 공개 bucket에 올라간 객체는 URL로 계속 접근할 수 있습니다. upload/verify 보고서의 REMOTE_ORPHAN에 해당 객체가 표시됩니다. 삭제가 필요하면 운영자가 해당 image_id의 세 경로와 다른 사용처를 검토한 뒤 Dashboard에서 **명시적으로 선택하여 삭제**합니다. 이 작업은 로컬 원본 삭제와 무관합니다. 캐시된 사본의 즉시 제거를 보장할 수 없으므로 민감한 사진은 최초 업로드 전에 공개 적합성을 확인합니다.

기본 cacheControl은 3600초이며 pipeline.yaml에서 변경합니다. 교체 후 verify_storage가 이전 hash를 받으면 캐시 지연 가능성을 확인하고 이후 다시 검사합니다. 해시 query만으로 즉시 갱신을 보장하지 않습니다.

근거: [공개 다운로드](https://supabase.com/docs/guides/storage/serving/downloads), [표준 업로드](https://supabase.com/docs/guides/storage/uploads/standard-uploads), [Python SDK 업로드](https://supabase.com/docs/reference/python/storage-from-upload), [키 지원](https://supabase.com/docs/guides/getting-started/api-keys).
