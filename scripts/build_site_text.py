"""Refresh only UI copy while retaining the previous verified research payload."""
from .build_json import write_release
from .common import cli, digest, read_json, safe_path, sha
from .site_text import read_master
from .site_theme import read_master as read_theme


def build(ctx, report, theme_only=False):
    try:
        text = None if theme_only else read_master(ctx)
        release = read_json(ctx.public / 'release.json')
        payload = {}
        for name, fingerprint in release['files'].items():
            path = safe_path(ctx.public, name)
            if sha(path) != fingerprint:
                raise ValueError('Existing release fingerprint mismatch')
            value = read_json(path)
            if value['release_id'] != release['release_id']:
                raise ValueError('Mixed existing release')
            payload[name] = {k:v for k,v in value.items() if k not in ('schema_version','release_id')}
        if digest(payload) != release['release_id']:
            raise ValueError('Existing release content mismatch')
        if theme_only:
            payload['site-text.json']['theme'] = read_theme(ctx)
        else:
            theme = payload['site-text.json'].get('theme')
            payload['site-text.json'] = dict(text, theme=theme if theme is not None else read_theme(ctx))
        release_id = digest(payload)
        for value in payload.values():
            value.update(schema_version=ctx.config['schema_version'], release_id=release_id)
        if ctx.fingerprint() != report.fingerprint:
            raise ValueError('Master changed during text refresh')
        write_release(ctx, report, payload, release_id)
        if report.ok:
            report.add('info', 'SITE_THEME_ONLY' if theme_only else 'SITE_TEXT_ONLY',
                       'Theme refreshed' if theme_only else '문구만 갱신했습니다. 연구 데이터는 이전 공개 릴리스를 유지합니다.')
    except (ValueError, KeyError, TypeError, OSError) as error:
        report.add('error','SITE_TEXT_INVALID',str(error))


if __name__ == '__main__':
    cli('site-text', lambda p: None, lambda c,r,a: build(c,r))
