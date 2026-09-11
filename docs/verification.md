# 로컬 구현 검증 기록

2026-09-08, 외부 연구 데이터 서비스에 쓰기 없이 검증했습니다.

| 검사 | 결과 |
|---|---|
| Python 합성 fixture 테스트 | 28개 통과 |
| TypeScript 탐색·URL 단위 테스트 | 4개 통과 |
| Playwright 브라우저 테스트 | 3개 통과 |
| Python lint | 통과 |
| 웹 ESLint / TypeScript | 통과 |
| 공개 JSON fingerprint·관계·허용 필드 | 빈 초기 release 통과 |
| Next.js 프로덕션 빌드 | 통과 |
| agent-browser 화면 확인 | 빈 데이터 안내, 검색·탐색 요소, 오류 오버레이 없음 확인 |
| Git ignore 규칙 | 임시 Git 저장소에서 연구자료·키 제외 및 JSON·lockfile 포함 12개 경로 확인 |
| CLI --help | 8개 명령 확인 |
| 실제 master source validation | 의도적으로 실패. 제목 없는 열·누락 시트·미입력 사진 행·없는 등록 원본을 보고 |
| 운영 배포 검사, 공개 환경변수 미설정 | 의도적으로 종료 코드 1 |
| Supabase secret key 형식 | SDK 클라이언트 초기화만 확인. 실제 인증·권한 확인 아님 |
| 실제 Supabase/Vercel/GitHub 연결 | 실행하지 않음 |

Python 테스트는 중복키, FK, 트리 순환, cytotype 불일치, 원본 누락/손상/경로 탈출, 첫 생성, 반복 스킵의 hash/mtime 유지, 한 크기 복구, stale, 특정 ID rebuild, EXIF 방향·축소·확대 금지, hidden 제외, 내부 필드 제외, 결정적 JSON, 실패 시 기존 JSON 보존을 검사합니다. 업로드는 FakeStorage로 동일 객체 스킵·내용 차이·명시적 교체·재시도·부분 실패·페이지네이션·dry-run 무쓰기를 검사합니다.

브라우저는 합성 이명 검색 결과의 taxon 이동, cytotype/자료 상태, 이미지 실패 대체 화면, 확대창 방향키·Esc·포커스 복원, 부모 형태 하위 포함/제외, 모바일 가로 넘침, 잘못된 ID의 404를 검사합니다. 환경변수 없는 이미지 URL은 단위 테스트에서 null임을 확인했으며 실제 웹앱은 빈 공개 데이터 상태로 화면 확인했습니다.

실제 master와 원본 사진은 수정하지 않았습니다. 초기 master SHA-256과 최종 확인 값은 `281b988b33cad67088a2fa95c9a91d0f96e3213dd1826fe18cdc7ce5a40ba60d`로 같습니다. 사용자 사진 15개는 현재 Excel 미등록 상태여서 처리하지 않았습니다. 실자료를 검증 통과했다고 간주하지 않습니다.

스크린샷과 실행별 JSON/Markdown은 로컬 reports/에 있으며 Git에 포함하지 않습니다. 테스트 합성 Excel/사진/JSON은 임시 폴더 또는 work/에만 생성됩니다. 계정 설정·실제 사진 화질 검토·실제 CDN 응답·운영 배포는 사용자 데이터가 준비된 뒤 별도 검증해야 합니다.
