from __future__ import annotations

from html import escape
from html.parser import HTMLParser
from typing import Iterable, List, Sequence, Tuple
from urllib.parse import urlsplit

# Allow a conservative subset of HTML tags for the login notice.
_ALLOWED_TAGS = {
    'a',
    'br',
    'em',
    'i',
    'li',
    'ol',
    'p',
    'strong',
    'u',
    'ul',
}

_SELF_CLOSING_TAGS = {'br'}

_ALLOWED_ATTRS = {
    'a': {'href', 'title'},
}

_ALLOWED_SCHEMES = {'http', 'https', 'mailto'}


def _is_safe_url(value: str | None) -> bool:
    if value is None:
        return False
    stripped = value.strip()
    if not stripped:
        return False
    parsed = urlsplit(stripped)
    if parsed.scheme == '':
        # Treat relative URLs as safe.
        return not stripped.lower().startswith('javascript:')
    return parsed.scheme.lower() in _ALLOWED_SCHEMES


class _LoginNoticeSanitizer(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self._parts: List[str] = []

    def handle_starttag(self, tag: str, attrs: Sequence[Tuple[str, str | None]]) -> None:
        if tag not in _ALLOWED_TAGS:
            return
        attributes = self._sanitize_attrs(tag, attrs)
        self._parts.append(self._build_start_tag(tag, attributes))

    def handle_startendtag(self, tag: str, attrs: Sequence[Tuple[str, str | None]]) -> None:
        if tag not in _ALLOWED_TAGS:
            return
        attributes = self._sanitize_attrs(tag, attrs)
        self._parts.append(self._build_start_tag(tag, attributes, self_closing=True))

    def handle_endtag(self, tag: str) -> None:
        if tag not in _ALLOWED_TAGS or tag in _SELF_CLOSING_TAGS:
            return
        self._parts.append(f'</{tag}>')

    def handle_data(self, data: str) -> None:
        self._parts.append(escape(data))

    def handle_entityref(self, name: str) -> None:  # pragma: no cover - defensive
        self._parts.append(f'&{name};')

    def handle_charref(self, name: str) -> None:  # pragma: no cover - defensive
        self._parts.append(f'&#{name};')

    def handle_comment(self, data: str) -> None:
        # Strip HTML comments entirely.
        return

    def get_html(self) -> str:
        return ''.join(self._parts)

    def _sanitize_attrs(
        self,
        tag: str,
        attrs: Sequence[Tuple[str, str | None]],
    ) -> Iterable[Tuple[str, str]]:
        allowed = _ALLOWED_ATTRS.get(tag, set())
        for name, value in attrs:
            if name not in allowed:
                continue
            if tag == 'a' and name == 'href' and not _is_safe_url(value):
                continue
            if value is None:
                continue
            yield name, escape(value, quote=True)

    def _build_start_tag(
        self,
        tag: str,
        attrs: Iterable[Tuple[str, str]],
        self_closing: bool = False,
    ) -> str:
        rendered_attrs = ' '.join(f'{name}="{value}"' for name, value in attrs)
        suffix = ' /' if self_closing and tag not in _SELF_CLOSING_TAGS else ''
        if rendered_attrs:
            return f'<{tag} {rendered_attrs}{suffix}>'
        return f'<{tag}{suffix}>'


def sanitize_login_notice_html(raw_html: str) -> str:
    """
    Sanitize the provided HTML string for safe display on the login screen.
    """

    parser = _LoginNoticeSanitizer()
    parser.feed(raw_html or '')
    parser.close()
    return parser.get_html()
