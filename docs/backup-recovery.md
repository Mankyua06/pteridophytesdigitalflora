# 백업과 복구

GitHub는 연구자료 백업이 아닙니다. `Ferns_morphology_data.xlsx`, `images_original/`, 필요한 로컬 설정과 운영 기록을 별도 위치에 백업합니다. 같은 디스크의 backups 폴더는 임시 사본일 뿐 독립 백업이 아닙니다. 외장 디스크 또는 별도의 접근 통제된 저장장치에 사본을 두고 주기적으로 hash와 복원 가능성을 확인합니다. 비밀키는 평문 공개 문서나 Git에 기록하지 않습니다.

Excel 편집 전 버전별 백업을 남기고 원본 사진은 촬영 폴더와 함께 보존합니다. 파일명만 같다고 동일 사진으로 간주하지 말고 복사 후 SHA-256을 비교합니다. 백업 대상의 수량·용량·날짜와 검증 기록을 보관합니다.

복구 순서:

1. GitHub의 코드·config·lockfile을 복원합니다.
2. 별도 백업에서 master와 images_original을 복원합니다. 설정의 master 이름을 일치시킵니다.
3. `uv sync --locked`, `npm --prefix web ci`, `uv run python -m scripts.init_workspace`를 실행합니다.
4. `uv run python -m scripts.validate --stage source`로 검증합니다.
5. `uv run python -m scripts.pipeline --mode rebuild`로 WebP와 JSON을 다시 만듭니다.
6. `.env.local` 설정을 안전한 저장소에서 복구하고 Storage dry-run → 업로드 → verify를 실행합니다.
7. 검증된 release를 GitHub에 반영하고 웹앱을 배포합니다.

JSON 교체 도중 중단되어 `web/public/.data-previous`가 남으면 먼저 파이프라인을 중지합니다. 현재 data가 없으면 `.data-previous`를 data로 복원하고 public 검증을 실행합니다. data가 이미 있고 검증이 통과하면 `.data-previous`를 별도 로컬 백업으로 옮긴 뒤 재시도합니다. 이전 폴더를 검증 없이 일괄 삭제하지 않습니다.

고정 Storage 경로의 이미지가 이미 교체되었다면 JSON만 이전 Git 버전으로 되돌려도 이미지가 함께 롤백되지 않습니다. 이전 master·원본·코드·설정으로 해당 이미지 바이트를 재생성해 명시적 교체·원격 검증을 수행해야 합니다.
