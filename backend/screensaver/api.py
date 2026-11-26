from uuid import UUID
from django.db.models import Q, F
from django.db import transaction
from django.shortcuts import get_object_or_404
from ninja import File, Form, Router
from ninja.files import UploadedFile
from ninja.pagination import PageNumberPagination, paginate
from PIL import Image, UnidentifiedImageError

from .models import Screensaver
from .schemas import ErrorOut, ScreensaverOut

router = Router(tags=["screensavers"])

MAX_NAME = 60
MAX_AUTHOR = 30
MAX_DESC = 200
MAX_TAGS = 12
MAX_TAG_LEN = 20
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

CROP_EXTENSIONS = {"PNG": ".png", "JPEG": ".jpg", "WEBP": ".webp"}

VALID_DEVICES = {c.value for c in Screensaver.Device}
VALID_MODELS = {c.value for c in Screensaver.ModelName}
VALID_COLORS = {c.value for c in Screensaver.Color}
VALID_ORIENTATIONS = {c.value for c in Screensaver.Orientation}


def _crop_extension(upload: UploadedFile) -> str | None:
    """Extensão do recorte a partir do formato real; None se não for imagem aceita."""
    upload.seek(0)
    try:
        with Image.open(upload) as img:
            fmt = img.format
    except (UnidentifiedImageError, OSError):
        return None
    finally:
        upload.seek(0)
    return CROP_EXTENSIONS.get(fmt)


def _validate(name, author, description, tags, devices, model_name, color, orientation):
    if not name or not name.strip():
        return "Nome é obrigatório"
    if len(name) > MAX_NAME:
        return f"Nome deve ter no máximo {MAX_NAME} caracteres"
    if author and len(author) > MAX_AUTHOR:
        return f"Autor deve ter no máximo {MAX_AUTHOR} caracteres"
    if description and len(description) > MAX_DESC:
        return f"Descrição deve ter no máximo {MAX_DESC} caracteres"
    if len(tags) > MAX_TAGS:
        return f"Máximo de {MAX_TAGS} tags"
    for t in tags:
        if len(t) > MAX_TAG_LEN:
            return f"Cada tag deve ter no máximo {MAX_TAG_LEN} caracteres"
    if devices not in VALID_DEVICES:
        return "Dispositivo inválido"
    if model_name not in VALID_MODELS:
        return "Modelo inválido"
    if color not in VALID_COLORS:
        return "Cor inválida"
    if orientation not in VALID_ORIENTATIONS:
        return "Orientação inválida"
    return None


@router.get("/list", response=list[ScreensaverOut])
@paginate(PageNumberPagination, page_size=20)
def list_screensavers(
    request,
    search: str | None = None,
    devices: str | None = None,
    model_name: str | None = None,
    color: str | None = None,
    orientation: str | None = None,
    ordering: str | None = None,
    tags: str | None = None,
):
    screens = Screensaver.objects.filter(is_active=True)

    if search:
        search = search.strip()
        screens = screens.filter(
            Q(name__icontains=search)
            | Q(author__icontains=search)
            | Q(description__icontains=search)
            | Q(tags__icontains=search)
        )

    if devices:
        screens = screens.filter(devices__icontains=devices.strip())

    if model_name:
        screens = screens.filter(model_name__icontains=model_name.strip())

    if color:
        screens = screens.filter(color__icontains=color.strip())

    if orientation:
        screens = screens.filter(orientation=orientation)

    if tags:
        tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()]
        for tag in tag_list:
            screens = screens.filter(tags__icontains=tag)

    if ordering:
        allowed_orderings = {
            "id": "id", "-id": "-id",
            "name": "name", "-name": "-name",
            "created_at": "created_at", "-created_at": "-created_at",
        }
        order_field = allowed_orderings.get(ordering)
        screens = screens.order_by(order_field or "-created_at")
    else:
        screens = screens.order_by("-created_at")

    return screens


@router.post(
    "/",
    response={201: ScreensaverOut, 400: ErrorOut},
)
def create_screensaver(
    request,
    crop: UploadedFile = File(...),
    original_file: UploadedFile = File(...),
    name: str = Form(...),
    author: str = Form(""),
    description: str = Form(""),
    tags: str = Form(""),
    devices: str = Form("xteink"),          # ← novo campo
    model_name: str = Form(...),
    color: str = Form(...),
    orientation: str = Form(...),
):
    if crop.size > MAX_FILE_SIZE or original_file.size > MAX_FILE_SIZE:
        return 400, {"detail": f"Arquivo maior que {MAX_FILE_SIZE // (1024*1024)}MB"}

    crop_ext = _crop_extension(crop)
    if crop_ext is None:
        return 400, {
            "detail": "Recorte inválido: envie PNG ou JPEG — o BMP é gerado no navegador no download"
        }

    tag_list = [t.strip().lower() for t in tags.split(",") if t.strip()]

    err = _validate(
        name.strip(), author.strip(), description.strip(),
        tag_list, devices, model_name, color, orientation,
    )
    if err:
        return 400, {"detail": err}

    with transaction.atomic():
        ss = Screensaver(
            name=name.strip(),
            author=author.strip() or None,
            description=description.strip() or None,
            tags=tag_list,
            devices=devices,
            model_name=model_name,
            color=color,
            orientation=orientation,
        )
        ss.save()

        ss.crop.save(f"{ss.id}{crop_ext}", crop, save=False)

        orig_ext = original_file.name.rsplit(".", 1)[-1].lower() if "." in original_file.name else "png"
        ss.original_file.save(f"{ss.id}_original.{orig_ext}", original_file, save=False)

        ss.save()

    return 201, ss


@router.get(
    "/",
    response={200: ScreensaverOut, 404: ErrorOut},
)
def get_screensaver(request, id: UUID):
    screensaver = get_object_or_404(Screensaver, id=id, is_active=True)
    return 200, screensaver


@router.post("/{id}/count/downloads", response={200: ScreensaverOut, 404: ErrorOut})
def downloads_count(request, id: UUID):
    try:
        ss = Screensaver.objects.get(pk=id)
    except Screensaver.DoesNotExist:
        return 404, {"detail": "Screensaver não encontrado"}

    Screensaver.objects.filter(pk=id).update(downloads=F('downloads') + 1)
    ss.refresh_from_db()
    return 200, ss


@router.post("/{id}/count/views", response={200: ScreensaverOut, 404: ErrorOut})
def views_count(request, id: UUID):
    try:
        ss = Screensaver.objects.get(pk=id)
    except Screensaver.DoesNotExist:
        return 404, {"detail": "Screensaver não encontrado"}

    Screensaver.objects.filter(pk=id).update(views=F('views') + 1)
    ss.refresh_from_db()
    return 200, ss