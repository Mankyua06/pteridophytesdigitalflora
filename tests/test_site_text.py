import json

import pytest

from scripts.build_site_text import build
from scripts.common import Report
from scripts.site_text import resolve
from tests.conftest import append
from tests.test_pipeline import release


def test_text_refresh_preserves_research_and_ignores_unfinished_contributors(ctx):
    release(ctx)
    before = json.loads((ctx.public/'catalog.json').read_text())['taxa']
    append(ctx, '10_Site_Text', key='start_with_a_name', text='A revised heading', description='Test')
    append(ctx, '09_Contributors', contributor_id=1, name='Unfinished entry')
    report = Report(ctx, 'text-test')
    build(ctx, report)
    assert report.ok, report.issues
    assert json.loads((ctx.public/'site-text.json').read_text())['text']['start_with_a_name'] == 'A revised heading'
    assert json.loads((ctx.public/'catalog.json').read_text())['taxa'] == before
    assert json.loads((ctx.public/'contributors.json').read_text())['contributors'] == []


def test_text_keys_and_placeholders_are_validated(ctx):
    defaults = resolve(ctx, [])
    key = next(k for k,v in defaults.items() if '{v0}' in v)
    with pytest.raises(ValueError):
        resolve(ctx, [{'key':key,'text':'Missing placeholder'}])
    with pytest.raises(ValueError):
        resolve(ctx, [{'key':'mistyped_key','text':'New copy'}])
    assert resolve(ctx, [{'key':key,'text':'New {v0}'}])[key] == 'New {v0}'


def test_korean_override_fallback_and_placeholder_validation(ctx):
    rows = [{'key':'compare_taxa_count','text':'Compare {count} taxa','text_ko':'{count}개 비교'}]
    assert resolve(ctx, rows, 'ko')['compare_taxa_count'] == '{count}개 비교'
    rows[0]['text_ko'] = None
    assert resolve(ctx, rows, 'ko')['compare_taxa_count'] == 'Compare {count} taxa'
    rows[0]['text_ko'] = '   '
    assert resolve(ctx, rows, 'ko')['compare_taxa_count'] == 'Compare {count} taxa'
    rows[0]['text_ko'] = '잘못된 문구'
    with pytest.raises(ValueError):
        resolve(ctx, rows)


def test_korean_text_only_refresh(ctx):
    release(ctx)
    append(ctx, '10_Site_Text', key='start_with_a_name', text='Edited English', text_ko='엑셀에서 수정한 제목')
    report = Report(ctx, 'bilingual-text-test')
    build(ctx, report)
    assert report.ok, report.issues
    content = json.loads((ctx.public/'site-text.json').read_text())
    assert content['text']['start_with_a_name'] == 'Edited English'
    assert content['text_ko']['start_with_a_name'] == '엑셀에서 수정한 제목'
