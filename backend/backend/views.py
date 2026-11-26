import re
from pathlib import Path

from django.conf import settings
from django.http import FileResponse, HttpRequest, HttpResponse, HttpResponseBase
from django.shortcuts import redirect

SECTIONS = ('screensaver', 'firmware', 'xteink')

SECTION_LINK = re.compile(r'href="/(screensaver|firmware|xteink)(?=[/"#?])')

_html_cache: dict[tuple[str, int, str], str] = {}


def cross_section_url(request: HttpRequest) -> str | None:
    host = request.get_host()
    label = host.split('.')[0]
    if label not in SECTIONS:
        return None

    first = request.path.strip('/').split('/')[0]
    if first not in SECTIONS or first == label:
        return None

    root = host[len(label) + 1:]
    if not root:
        return None

    rest = request.path[len(first) + 1:] or '/'
    query = request.META.get('QUERY_STRING')
    if query:
        rest = f'{rest}?{query}'
    scheme = request.headers.get('x-forwarded-proto') or request.scheme
    return f'{scheme}://{first}.{root}{rest}'


def logical_path(request: HttpRequest) -> str:
    label = request.get_host().split(':')[0].split('.')[0]
    path = request.path
    if label not in SECTIONS:
        return path
    if path == f'/{label}' or path.startswith(f'/{label}/'):
        path = path[len(label) + 1:]
    return f'/{label}{path}'


def html_file(logical: str) -> Path | None:
    if '..' in logical or '\\' in logical:
        return None

    root = settings.FRONTEND_DIST
    page = root / 'index.html' if logical == '/' else root / logical.strip('/') / 'index.html'
    if page.is_file():
        return page

    parts = logical.strip('/').split('/')
    if len(parts) == 3 and parts[1] == 'post' and parts[0] in SECTIONS:
        shell = root / parts[0] / 'post' / '@id_post' / 'index.html'
        if shell.is_file():
            return shell

    return None


def site_origin(request: HttpRequest) -> str:
    host = request.get_host()
    label = host.split('.')[0]
    root = host[len(label) + 1:] if label in SECTIONS else host
    root = root.removeprefix('www.')
    scheme = request.headers.get('x-forwarded-proto') or request.scheme
    return f'{scheme}://{root}'


def host_aware_html(page: Path, origin: str) -> str:
    key = (str(page), page.stat().st_mtime_ns, origin)
    cached = _html_cache.get(key)
    if cached is not None:
        return cached

    scheme, _, root = origin.partition('://')
    html = page.read_text(encoding='utf-8')
    html = SECTION_LINK.sub(lambda match: f'href="{scheme}://{match.group(1)}.{root}', html)
    _html_cache[key] = html
    return html


def frontend(request: HttpRequest) -> HttpResponseBase:
    target = cross_section_url(request)
    if target:
        return redirect(target, permanent=True)

    file = html_file(logical_path(request))
    if file is None:
        not_found = settings.FRONTEND_DIST / '404.html'
        return FileResponse(open(not_found, 'rb'), content_type='text/html; charset=utf-8', status=404)

    return HttpResponse(host_aware_html(file, site_origin(request)), content_type='text/html; charset=utf-8')
