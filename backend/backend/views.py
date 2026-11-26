import html as html_module
import re
from pathlib import Path
from urllib.parse import quote
from uuid import UUID

from django.conf import settings
from django.http import FileResponse, HttpRequest, HttpResponse, HttpResponseBase
from django.shortcuts import redirect

from screensaver.models import Screensaver

SECTIONS = ('screensaver', 'firmware', 'xteink')

SECTION_LINK = re.compile(r'href="/(screensaver|firmware|xteink)(?=[/"#?])')

POST_PATH = re.compile(
    r'^/screensaver/post/'
    r'(?P<id>[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})'
    r'/?$'
)

TITLE_TAG = re.compile(r'<title>.*?</title>', re.DOTALL)

_html_cache: dict[tuple[str, int, str], str] = {}
_post_cache: dict[tuple[str, int, str, str, str], str] = {}


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


def set_meta(markup: str, key: str, value: str) -> str:
    """Troca o `content` de uma meta tag, seja `property` ou `name`."""
    pattern = re.compile(rf'(<meta (?:property|name)="{re.escape(key)}" content=")[^"]*(")')
    escaped = html_module.escape(value, quote=True)
    return pattern.sub(lambda match: f'{match.group(1)}{escaped}{match.group(2)}', markup)


def drop_meta(markup: str, key: str) -> str:
    return re.sub(rf'<meta (?:property|name)="{re.escape(key)}"[^>]*>', '', markup)


def media_url(request: HttpRequest, name: str) -> str:
    base = settings.MEDIA_URL.strip('/')
    return f'{site_origin(request)}/{base}/{quote(name)}'


def post_image(request: HttpRequest, screensaver: Screensaver) -> str | None:
    """Original do usuário é o que crawler aceita (PNG/JPEG); BMP e WebP não."""
    for field in (screensaver.original_file, screensaver.thumbnail):
        if field and field.storage.exists(field.name):
            return media_url(request, field.name)
    return None


def post_html(markup: str, request: HttpRequest, screensaver_id: str, page: Path) -> str:
    """Injeta título, descrição e imagem do post nas metas do shell pré-renderizado."""
    try:
        screensaver = Screensaver.objects.get(id=UUID(screensaver_id), is_active=True)
    except (Screensaver.DoesNotExist, ValueError):
        return markup

    origin = site_origin(request)
    key = (
        str(page),
        page.stat().st_mtime_ns,
        origin,
        str(screensaver.id),
        screensaver.updated_at.isoformat(),
    )
    cached = _post_cache.get(key)
    if cached is not None:
        return cached

    title = f'{screensaver.name} — Screensaver Xteink | Sapiens In'
    description = (screensaver.description or '').strip() or (
        f'Screensaver “{screensaver.name}” para {screensaver.get_model_name_display()} — '
        'veja e baixe de graça no Sapiens In.'
    )
    url = f'{origin}/screensaver/post/{screensaver.id}'

    markup = TITLE_TAG.sub(
        lambda _: f'<title>{html_module.escape(title)}</title>', markup
    )
    for meta_key, value in (
        ('og:type', 'article'),
        ('og:url', url),
        ('og:title', title),
        ('twitter:title', title),
        ('description', description),
        ('og:description', description),
        ('twitter:description', description),
    ):
        markup = set_meta(markup, meta_key, value)

    image = post_image(request, screensaver)
    if image:
        markup = set_meta(markup, 'og:image', image)
        markup = set_meta(markup, 'twitter:image', image)
        markup = set_meta(markup, 'og:image:alt', title)
        markup = set_meta(markup, 'twitter:image:alt', title)
        # As dimensões fixas do shell não valem para a imagem do post.
        markup = drop_meta(markup, 'og:image:width')
        markup = drop_meta(markup, 'og:image:height')

    _post_cache[key] = markup
    return markup


def frontend(request: HttpRequest) -> HttpResponseBase:
    target = cross_section_url(request)
    if target:
        return redirect(target, permanent=True)

    logical = logical_path(request)
    file = html_file(logical)
    if file is None:
        not_found = settings.FRONTEND_DIST / '404.html'
        return FileResponse(open(not_found, 'rb'), content_type='text/html; charset=utf-8', status=404)

    markup = host_aware_html(file, site_origin(request))

    post = POST_PATH.match(logical)
    if post:
        markup = post_html(markup, request, post.group('id'), file)

    return HttpResponse(markup, content_type='text/html; charset=utf-8')
