# 합성 fixture

`tests/conftest.py`가 pytest 임시 디렉터리에 빈 8개 시트 템플릿, Synthetic taxon, 관계, 단색 JPEG를 생성합니다.
`tests/make_web_fixture.py`는 브라우저용 합성 자료만 `work/e2e-source`와 `work/e2e-web`에 생성합니다.
실제 연구 Excel, 실제 사진, 인증키는 테스트 fixture에 포함하지 않습니다.
