# 이번 구현의 기본값과 제한

아래 내용은 이번 구현에서 적용한 기본값입니다. 과거 합의였다고 간주하지 않습니다.

1. Excel이 유일한 연구 master이며 원본은 로컬 보존합니다. 공개 DB/Auth는 사용하지 않습니다. 실제 파일명이 있으므로 `master: Ferns_morphology_data.xlsx`를 명시했습니다. 신규 프로젝트의 기본 권장명은 `Fern_Digital_Flora.xlsx`입니다.
2. WebP 긴 변은 thumb 480, medium 1600, large 3000, quality 85, method 6입니다. 최종 화질은 실제 사진 검토 후 결정합니다. Pillow 버전과 처리 알고리즘도 설정 fingerprint에 포함합니다.
3. 등록된 모든 이미지(active/hidden/inactive)는 로컬 검증·파생 생성 대상입니다. JSON·업로드는 active만 대상입니다. 알 수 없는 상태는 enum 오류입니다.
4. 원본 해시·원본 경로·설정이 바뀌거나 기존 WebP가 손상되면 normal이 덮어쓰지 않습니다. manifest 없는 기존 파생 파일도 rebuild를 요구합니다. 누락 크기만 normal에서 복원합니다.
5. 색상 프로필 변환에 실패하면 해당 파일 생성을 실패로 보고합니다. EXIF 방향을 적용하고 파생물에 원본 EXIF/GPS/ICC를 복사하지 않습니다. RAW 지원을 가정하지 않습니다.
6. 공개 필드는 허용 목록으로 제한합니다. locality, original_filename, note는 기본 제외합니다. GBIF 상태는 추측하거나 분류군 공개 필터로 사용하지 않습니다.
7. source 검증 실패는 생성 단계 전체를 막습니다. 따라서 아직 준비되지 않은 이미지 예약 행도 작성이 끝나기 전에는 발행을 막습니다. 원본이 없는 현재 master를 통과 처리하지 않습니다.
8. 수식 처리: 스키마 핵심 열의 수식은 오류, 공개하지 않는 추가 도우미 열의 수식은 경고·무시입니다. 결과 캐시도 읽지 않습니다. 선택 열 누락은 null + 경고입니다. 제목 없는 실데이터 열은 오류입니다.
9. JSON release_id는 공개 payload의 SHA-256입니다. 공개 JSON에 실행 시각·원본 hash·로컬 경로를 넣지 않습니다. 로컬 source stamp는 업로드 전 master/설정의 변화를 감지합니다. 이미지 원본/파생 해시는 별도로 재검증합니다.
10. JSON은 임시 디렉터리에서 전체 검증 후 같은 파일시스템에서 디렉터리를 교체합니다. 기존 디렉터리를 `.data-previous`로 잠시 보관하여 교체 실패 시 복원합니다. 두 rename 사이 프로세스 중단에는 수동 복구가 필요하며 완전한 crash atomic exchange를 보장하지 않습니다. 동시 파이프라인 실행은 지원하지 않습니다.
11. Storage 경로는 `size/image_id.webp`로 고정합니다. cacheControl은 기본 3600초, 재시도는 기본 3회입니다. 이미지 내용은 다운로드 SHA-256으로 비교하며 ETag/크기/파일명 동일을 근거로 스킵하지 않습니다.
12. 같은 Storage 경로 교체는 CDN 지연이 있을 수 있고 JSON과 이미지의 완전한 원자적 배포·롤백을 보장하지 않습니다. 해시 query가 모든 CDN을 즉시 갱신한다고 가정하지 않습니다. 원격 검증 실패 시 배포하지 않습니다.
13. 브라우저는 이미 생성한 WebP를 `next/image unoptimized`로 직접 표시합니다. manifest 폭·높이, lazy loading, 크기별 URL을 사용합니다. 갤러리는 taxon 상세 JSON을 12개 taxon씩 가져옵니다. 최초 JS 번들에 전체 사진 상세를 넣지 않습니다.
14. 설치 시 레지스트리에서 Next.js 16.3.4 / React 19.2.8을 확인해 고정했습니다. Python supabase 2.31.0 및 Pillow 12.3.0 등 실제 해상 결과는 uv.lock에, npm 전체 버전은 package-lock.json에 고정합니다. 런타임 계정 검증은 아직 수행하지 않았습니다.
15. 원격 다운로드가 CDN 이전 값을 돌려주면 업로드 검증이 실패할 수 있습니다. 기다렸다가 verify_storage를 다시 실행합니다. 병렬 원격 작성자와의 원자적 조건부 교체는 SDK 표준 업로드 범위에서 보장하지 않습니다. 업로드를 동시에 실행하지 마세요.

공식 근거(구현 시 확인): [Next.js 설치](https://nextjs.org/docs/app/getting-started/installation), [Next Image](https://nextjs.org/docs/app/api-reference/components/image), [Supabase 공개 다운로드](https://supabase.com/docs/guides/storage/serving/downloads), [표준 업로드 및 캐시](https://supabase.com/docs/guides/storage/uploads/standard-uploads), [키 종류](https://supabase.com/docs/guides/getting-started/api-keys), [Python upload](https://supabase.com/docs/reference/python/storage-from-upload).
