from openpyxl import load_workbook
from PIL import Image

from scripts.common import sha
from scripts.register_images import register, rows
from scripts.sync_images import sync
from tests.test_pipeline import release, run


def baseline(ctx):
    assert run(ctx, register, apply=True).ok
    release(ctx)


def test_delete_preview_then_apply(ctx):
    baseline(ctx)
    before = sha(ctx.master)
    (ctx.originals / "first.jpg").unlink()
    assert run(ctx, sync).ok
    assert sha(ctx.master) == before
    assert (ctx.derived / "thumb/IM000001.webp").exists()
    report = run(ctx, sync, apply=True)
    assert report.ok, report.issues
    wb = load_workbook(ctx.master)
    assert [r['image_id'] for r in rows(wb['06_Images'])] == ['IM000002']
    assert not (ctx.derived / "thumb/IM000001.webp").exists()
    assert list((ctx.root / "backups").glob("sync-*/1/thumb/IM000001.webp"))


def test_rename_replace_and_add(ctx):
    baseline(ctx)
    (ctx.originals / "first.jpg").rename(ctx.originals / "TX000001_MO0001_renamed.jpg")
    report = run(ctx, sync, apply=True)
    assert report.ok, report.issues
    wb = load_workbook(ctx.master)
    row = rows(wb['06_Images'])[0]
    assert row['image_id'] == 'IM000001'
    assert row['note'] == 'DO_NOT_PUBLISH'
    old = sha(ctx.derived / 'thumb/IM000001.webp')
    Image.new('RGB', (31, 32), 'purple').save(ctx.originals / row['original_filename'])
    Image.new('RGB', (35, 36), 'yellow').save(ctx.originals / 'TX000001_MO0002_new.jpg')
    report = run(ctx, sync, apply=True)
    assert report.ok, report.issues
    assert sha(ctx.derived / 'thumb/IM000001.webp') != old
    assert (ctx.derived / 'thumb/IM000003.webp').exists()


def test_empty_folder_and_invalid_batch_preserve_data(ctx):
    baseline(ctx)
    before = sha(ctx.master)
    for p in ctx.originals.rglob('*'):
        if p.is_file():
            p.unlink()
    assert not run(ctx, sync, apply=True).ok
    assert sha(ctx.master) == before
    Image.new('RGB', (20, 20)).save(ctx.originals / 'invalid.jpg')
    assert not run(ctx, sync, apply=True).ok
    assert sha(ctx.master) == before


def test_generation_failure_leaves_live_state_untouched(ctx, monkeypatch):
    baseline(ctx)
    before = sha(ctx.master), sha(ctx.state)
    Image.new('RGB', (20, 20), 'orange').save(ctx.originals / 'TX000001_MO0001_added.jpg')

    def fail(stage, report):
        report.add('error', 'TEST_FAILURE', 'Injected generation failure')

    monkeypatch.setattr('scripts.sync_images.build', fail)
    assert not run(ctx, sync, apply=True).ok
    assert (sha(ctx.master), sha(ctx.state)) == before


def test_ambiguous_rename_is_rejected(ctx):
    baseline(ctx)
    data = (ctx.originals / 'first.jpg').read_bytes()
    (ctx.originals / 'first.jpg').unlink()
    for suffix in ('a', 'b'):
        (ctx.originals / f'TX000001_MO0001_{suffix}.jpg').write_bytes(data)
    assert not run(ctx, sync, apply=True).ok
