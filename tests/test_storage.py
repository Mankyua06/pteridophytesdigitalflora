from scripts.upload_images import Storage, upload
from scripts.verify_storage import verify
from tests.test_pipeline import release, run


class FakeStorage:
    def __init__(self):
        self.files, self.writes, self.attempts, self.failures = {}, 0, 0, 0
        self.permanent = None

    def list_all(self):
        return set(self.files)

    def download(self, key):
        return self.files[key]

    def upload(self, key, content, replace, cache_control):
        self.attempts += 1
        if self.failures:
            self.failures -= 1
            raise ConnectionError()
        if key == self.permanent:
            raise ConnectionError()
        if key in self.files and not replace:
            raise ValueError()
        self.files[key] = content
        self.writes += 1


TARGET = ("https://synthetic.supabase.co", "fern-images")


def test_dry_run_and_all_registered_images(ctx):
    release(ctx)
    storage = FakeStorage()
    report = run(ctx, upload, dry_run=True, storage=storage, target=TARGET)
    assert report.ok and storage.writes == 0 and not storage.files
    report = run(ctx, upload, storage=storage, target=TARGET)
    assert report.ok and len(storage.files) == 6
    assert any("IM000002" in k for k in storage.files)
    report = run(ctx, upload, storage=storage, target=TARGET)
    assert report.ok and report.counts["skipped"] == 6 and storage.writes == 6
    assert run(ctx, verify, storage=storage, target=TARGET).ok


def test_changed_remote_and_partial_failure(ctx):
    release(ctx)
    storage = FakeStorage()
    storage.files["thumb/IM000001.webp"] = b"same name wrong bytes"
    assert not run(ctx, upload, storage=storage, target=TARGET).ok
    assert run(ctx, upload, replace_changed=True, storage=storage, target=TARGET).ok
    assert storage.files["thumb/IM000001.webp"] == (ctx.derived / "thumb/IM000001.webp").read_bytes()
    storage = FakeStorage()
    storage.permanent = "medium/IM000001.webp"
    report = run(ctx, upload, storage=storage, target=TARGET)
    assert not report.ok and report.counts["failed"] == 1 and len(storage.files) == 5
    assert not run(ctx, verify, storage=storage, target=TARGET).ok


def test_retry_and_preflight(ctx):
    release(ctx)
    storage = FakeStorage()
    storage.failures = 1
    assert run(ctx, upload, storage=storage, target=TARGET).ok
    assert storage.attempts == 7
    (ctx.derived / "thumb/IM000001.webp").write_bytes(b"tampered")
    storage.writes = 0
    assert not run(ctx, upload, storage=storage, target=TARGET).ok
    assert storage.writes == 0


def test_pagination():
    class API:
        def __init__(self):
            self.offsets = []

        def list(self, prefix, options):
            self.offsets.append(options["offset"])
            return [
                {"name": f"{i}.webp", "id": str(i), "metadata": {}}
                for i in range(options["offset"], min(options["offset"] + 100, 205))
            ]

    storage = Storage.__new__(Storage)
    storage.api = API()
    assert len(storage.list_all()) == 205
    assert storage.api.offsets == [0, 100, 200]


def test_upload_credential_validation():
    import base64
    import json

    import pytest

    from scripts.upload_images import StorageConfigError, validate_upload_key

    validate_upload_key('sb_secret_synthetic')
    for role in ['anon', 'service_role']:
        payload = base64.urlsafe_b64encode(json.dumps({'role': role}).encode()).decode()
        token = f'header.{payload}.signature'
        if role == 'service_role':
            validate_upload_key(token)
        else:
            with pytest.raises(StorageConfigError):
                validate_upload_key(token)
    for key in ['sb_publishable_synthetic', 'invalid']:
        with pytest.raises(StorageConfigError) as error:
            validate_upload_key(key)
        assert key not in str(error.value)


def test_dry_run_rejects_public_key(ctx, monkeypatch):
    release(ctx)
    monkeypatch.setenv('SUPABASE_URL', TARGET[0])
    monkeypatch.setenv('SUPABASE_STORAGE_BUCKET', TARGET[1])
    monkeypatch.setenv('SUPABASE_SECRET_KEY', 'sb_publishable_synthetic')
    assert not run(ctx, upload, dry_run=True).ok
    assert not run(ctx, verify).ok
