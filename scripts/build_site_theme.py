"""Refresh theme settings without rebuilding research data or photographs."""
from .build_site_text import build
from .common import cli

if __name__ == "__main__":
    cli("site-theme", lambda p: None, lambda c, r, a: build(c, r, theme_only=True))
