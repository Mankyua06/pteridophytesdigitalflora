import json

from tests.conftest import append
from tests.test_pipeline import release


def test_contributors_publication_and_email_consent(ctx):
    for ident, status, consent, order in [
        ('CT000001', 'active', False, 2),
        ('CT000002', 'active', True, 1),
        ('CT000003', 'inactive', True, 0),
        ('CT000004', 'active', None, 3),
    ]:
        append(ctx, '09_Contributors', contributor_id=ident, name=ident,
               affiliation='Synthetic institution', email=f'{ident}@example.org',
               taxon_scope='Synthetic scope', email_public=consent,
               display_order=order, status=status, researcher_type='lead' if ident in ('CT000001','CT000003') else 'researcher')
    release(ctx)
    people = json.loads((ctx.public/'contributors.json').read_text())['contributors']
    assert [p['contributor_id'] for p in people] == ['CT000002', 'CT000001', 'CT000004']
    assert [p['email'] for p in people] == ['CT000002@example.org', None, None]
    assert [p['researcher_type'] for p in people] == ['researcher','lead','researcher']
    all_public = ''.join(p.read_text() for p in ctx.public.rglob('*.json'))
    for ident in ['CT000001', 'CT000003', 'CT000004']:
        assert f'{ident}@example.org' not in all_public
