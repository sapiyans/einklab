from django.db import models
import uuid
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile


class Screensaver(models.Model):
    class ModelName(models.TextChoices):
        X3 = "x3", "XTEINK X3"
        X4 = "x4", "XTEINK X4"
        X4_PRO = "x4pro", "XTEINK X4 Pro"

    class Color(models.TextChoices):
        BLACK = "black", "Preto"
        WHITE = "white", "Branco"

    class Orientation(models.TextChoices):
        PORTRAIT = "portrait", "Retrato"
        LANDSCAPE = "landscape", "Paisagem"

    class Device(models.TextChoices):
        XTEINK  = "xteink", "Xteink"
    

        
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.FileField(
        upload_to="screensavers/final/%Y/",
        verbose_name="Arquivo Final (PNG)",
        help_text="Arquivo processado do screensaver em PNG"
    )
    original_file = models.FileField(
        upload_to="screensavers/originals/%Y/",
        blank=True,
        null=True,
        verbose_name="Arquivo Original",
        help_text="Arquivo base sem edições enviado pelo usuário"
    )
    thumbnail = models.ImageField(upload_to="screensavers/thumbs/%Y/", blank=True, null=True)
    name = models.CharField(max_length=60, verbose_name="Nome", help_text="Nome do screensaver")
    author = models.CharField(max_length=30, blank=True, null=True, verbose_name="Autor", help_text="Quem criou o screensaver")
    description = models.TextField(max_length=200, blank=True, null=True, verbose_name="Descrição", help_text="Descrição curta do screensaver")
    tags = models.JSONField(default=list, blank=True, verbose_name="Tags", help_text="Lista de tags em JSON")
    devices = models.CharField(max_length=20, choices=Device.choices, verbose_name="Dispositivos", help_text="Dispositivos")
    model_name = models.CharField(max_length=20, choices=ModelName.choices, verbose_name="Modelo", help_text="Modelo do dispositivo")
    color = models.CharField(max_length=10, choices=Color.choices, verbose_name="Cor", help_text="Cor do dispositivo")
    orientation = models.CharField(max_length=10, choices=Orientation.choices, verbose_name="Orientação", help_text="Orientação da tela")
    is_active = models.BooleanField(default=True, verbose_name="Ativo", help_text="Desmarque para ocultar sem apagar o arquivo")
    downloads = models.PositiveIntegerField(default=0, verbose_name="Downloads", help_text="Número de downloads realizados")
    views = models.PositiveIntegerField(default=0, verbose_name="Visualizações", help_text="Número de visualizações")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Criado em")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Atualizado em")

    def __str__(self):
        return f"{self.name} ({self.get_model_name_display()})"

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Screensaver"
        verbose_name_plural = "Screensavers"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.file and not self.thumbnail:
            img = Image.open(self.file.path)
            img.thumbnail((300, 400))
            buffer = BytesIO()
            img.save(buffer, format="WEBP", quality=75)
            self.thumbnail.save(
                f"{self.id}_thumb.webp",
                ContentFile(buffer.getvalue()),
                save=False
            )
            super().save(update_fields=["thumbnail"])