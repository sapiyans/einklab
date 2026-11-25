from pathlib import Path

from django.conf import settings
from django.http import FileResponse, HttpRequest

SECTIONS = ('screensaver', 'firmware', 'xteink')


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


def frontend(request: HttpRequest) -> FileResponse:
    file = html_file(logical_path(request))
    if file is None:
        not_found = settings.FRONTEND_DIST / '404.html'
        return FileResponse(open(not_found, 'rb'), content_type='text/html; charset=utf-8', status=404)
    return FileResponse(open(file, 'rb'), content_type='text/html; charset=utf-8')
