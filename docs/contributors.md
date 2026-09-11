# 참여자 등록

마스터 Excel의 `09_Contributors`에서 한 사람당 한 행을 입력합니다. 현재 김형태·김정성은 대표 연구자, 박상희는 연구자로 등록되어 있습니다.

| 열 | 입력 방법 |
|---|---|
| contributor_id | 고유 ID. 예: CT000001. 필수이며 중복 불가 |
| affiliation | 소속 |
| name | 이름. 필수 |
| email | 이메일 주소 |
| taxon_scope | 담당 분류군을 자유롭게 기재. 예: 속·과 이름 또는 여러 분류군. 자동 taxon_id 연결은 하지 않음 |
| role | 사진 제공, 분류 검토, 형태 기록 등 참여 역할 |
| researcher_type | `lead` = 대표 연구자(Lead Researchers), `researcher` = 연구자(Researchers). 빈칸도 연구자로 표시. J열 드롭다운에서 선택 |
| email_public | TRUE일 때만 이메일 공개. FALSE 또는 빈칸이면 공개 JSON에서도 제외 |
| display_order | 0 이상의 정수. 작은 값부터 표시. 빈칸은 0으로 정렬 |
| status | active이면 참여자 페이지에 표시, inactive이면 제외. 필수 |

Excel을 저장한 뒤 프로젝트 루트에서 `.venv/bin/python -m scripts.pipeline`을 실행합니다. 검증 후 `web/public/data/contributors.json`이 갱신됩니다. 웹페이지는 이 공개 데이터만 읽습니다. 기존 배포 절차에 따라 갱신된 데이터와 웹 코드를 반영하면 됩니다.

대표 연구자와 연구자는 별도 구역으로 표시하며, 각 구역 안에서는 기존 `display_order` 순서를 유지합니다. `status=inactive`인 사람은 어느 구역에도 표시되지 않습니다. `role`은 참여 활동 설명이며 `researcher_type`과 별개입니다.

페이지 마지막의 참여 안내는 `10_Site_Text`의 `join_the_flora`(제목), `contributor_invitation`(본문)에서 수정합니다. `text`는 영어, `text_ko`는 한국어입니다. 문구만 바꿀 때는 `.venv/bin/python -m scripts.build_site_text`로 갱신합니다.

연락 안내에는 공개된 대표 연구자만 표시합니다. 이메일은 `email_public=TRUE`이고 실제 주소가 입력된 경우에만 연결합니다. 현재 김정성의 이메일은 비어 있으며, 임의 주소를 추가하지 않았습니다.

## 표지 사진 교체

웹 표지는 `web/public/backgrounds/coverimage.jpeg`를 사용합니다. 이 파일을 같은 이름의 JPEG 사진으로 교체하세요. 다른 사진을 폴더에 추가하기만 하면 자동 선택되는 방식은 아닙니다. 배포 중인 사이트는 교체 후 다시 배포해야 합니다.

처음 제공된 프로젝트 루트의 `coverimage.jpeg`는 보존했습니다. 웹에서 사용하는 파일은 위 폴더의 사본입니다.

## 이미지 파일명 열

`06_Images.filename`은 경로 생성에 사용되지 않아 제거했습니다. `original_filename`은 원본 파일을 찾는 데 필요하므로 유지해야 합니다. 파생 이미지 파일명은 image_id로 자동 결정됩니다.
