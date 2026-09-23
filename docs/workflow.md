# 자료 업데이트

1. 원본 사진을 보존하고 `images_original/`에 사본 또는 관리 원본을 배치합니다. Excel의 original_filename과 상대경로·대소문자를 맞춥니다.
2. 새 원본을 `taxon_id_morphology_id_구분문자.jpg` 형식으로 지정하고 `.venv/bin/python -m scripts.register_images`로 미리 확인한 뒤 `--apply`를 추가하여 적용합니다. 기존 ID와 메타데이터는 유지됩니다. 촬영자·저작권 등은 Excel에서 보완합니다. 이전 열 구조의 전환에는 `--migrate`를 사용합니다. 자세한 예시는 README의 사진 추가 절차를 참고하세요.
3. `uv run python -m scripts.validate --stage source`. 오류가 있으면 `reports/<run_id>/validation.md`의 셀 위치를 확인합니다. 경고는 검토 후 진행할 수 있습니다.
4. `uv run python -m scripts.pipeline --mode normal`. source → 이미지 → derived → JSON → public 단계입니다. 최초 파생 파일 부재는 source 오류가 아닙니다.
5. `uv run python -m scripts.upload_images --dry-run`으로 프로젝트·bucket·파일 수·용량·교체 필요를 확인합니다. 대상/키가 없으면 오프라인 계획임을 경고하며 실제 비교했다고 표시하지 않습니다.
6. `uv run python -m scripts.upload_images`. 내용이 달라 교체가 필요할 때만 `--replace-changed`를 명시합니다.
7. `uv run python -m scripts.verify_storage`. 공개 URL에서 내려받은 모든 이미지 SHA-256이 해당 release와 일치해야 합니다.
8. 코드·config·공개 JSON diff와 git 추적 파일을 검토하여 GitHub 반영 후 Vercel 배포합니다. 이 저장소에는 연구 master·원본·비밀키를 포함하지 않습니다.

보고서는 실행마다 별도 run_id 디렉터리에 남습니다. 실행된 단계만 JSON/Markdown 결과와 summary.md가 생깁니다. pipeline의 각 단계도 별도 run_id를 사용합니다. 검사·생성·스킵·실패·오류·경고·시간·입력 fingerprint가 포함됩니다. 실패한 명령이 만든 부분 파생 파일은 다음 검증에 걸리며 기존 정상 공개 JSON은 유지됩니다.

원본 변경·품질 설정 변경·손상·manifest 분실은 `build_images --mode rebuild`로 복구합니다. 특정 파일은 `--image-id IM000001`을 사용합니다. 지정하지 않으면 전체 등록 사진이 대상입니다. 사진 한 장이 실패해도 다른 사진의 처리 결과와 실패를 수집하지만 전체 명령 종료 코드는 1입니다.

업로드 중 실패하면 같은 명령을 재실행합니다. 이미 동일한 원격 바이트는 비교 후 건너뜁니다. 업로드 기록은 `.state/uploads/<프로젝트+bucket 해시>.json`이고, 기록 자체를 원격 일치 근거로 신뢰하지 않습니다. 원격 확인 기록은 `.state/remote/`에 해당 release_id와 함께 남습니다.
