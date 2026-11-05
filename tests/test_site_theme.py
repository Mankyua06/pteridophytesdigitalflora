import pytest

from scripts.site_theme import DEFAULTS, resolve


def test_defaults_and_overrides():
    assert resolve([]) == DEFAULTS
    result = resolve([{"key": "accent_color", "value": "#123456"},
                      {"key": "body_font", "value": "serif"},
                      {"key": "base_font_size", "value": "20"},
                      {"key": "text_color", "value": None}])
    assert result["accent_color"] == "#123456"
    assert result["body_font"] == "serif"
    assert result["base_font_size"] == "20"
    assert result["text_color"] == DEFAULTS["text_color"]


@pytest.mark.parametrize("key,value", [
    ("accent_color", "red;display:none"), ("body_font", "unknown"),
    ("base_font_size", "200"), ("heading_font_size", "0"), ("unknown", "x"),
])
def test_invalid_theme(key, value):
    with pytest.raises(ValueError):
        resolve([{"key": key, "value": value}])


def test_duplicate_theme_key():
    with pytest.raises(ValueError):
        resolve([{"key": "body_font", "value": "serif"}] * 2)


def test_theme_only_refresh_and_invalid_input_preserve_release(ctx):
    import json

    from openpyxl import load_workbook

    from scripts.build_site_text import build
    from scripts.common import sha
    from tests.test_pipeline import release, run

    release(ctx)
    old = json.loads((ctx.public / "taxa/TX000001.json").read_text())
    book = load_workbook(ctx.master)
    book['11_Site_Theme'].append(['accent_color', '#123456', 'Test'])
    book.save(ctx.master)
    assert run(ctx, build, theme_only=True).ok
    assert json.loads((ctx.public / 'site-text.json').read_text())['theme']['accent_color'] == '#123456'
    new = json.loads((ctx.public / "taxa/TX000001.json").read_text())
    assert {k:v for k,v in old.items() if k != 'release_id'} == {k:v for k,v in new.items() if k != 'release_id'}
    previous = sha(ctx.public / 'release.json')
    book['11_Site_Theme']['B2'] = 'bad-color'
    book.save(ctx.master)
    assert not run(ctx, build, theme_only=True).ok
    assert sha(ctx.public / 'release.json') == previous
