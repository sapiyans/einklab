from datetime import datetime
from uuid import UUID

from ninja import ModelSchema, Schema

from .models import Screensaver


class ScreensaverOut(ModelSchema):
    id: UUID
    class Meta:
        model = Screensaver
        fields = "__all__"

    @staticmethod
    def resolve_url(obj, context):
        return context["request"].build_absolute_uri(obj.file.url)

    @staticmethod
    def resolve_preview_url(obj, context):
        if not obj.preview:
            return None
        return context["request"].build_absolute_uri(obj.preview.url)


class ErrorOut(Schema):
    detail: str