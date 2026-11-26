from io import BytesIO

from django.core.files.base import ContentFile
from django.db import migrations, models
from PIL import Image


def bmps_to_png(apps, schema_editor):
    """Converte os recortes já guardados em BMP para PNG (best-effort)."""
    Screensaver = apps.get_model('screensaver', 'Screensaver')

    for screensaver in Screensaver.objects.iterator():
        if not screensaver.crop or not screensaver.crop.name.lower().endswith('.bmp'):
            continue

        storage = screensaver.crop.storage
        name = screensaver.crop.name
        try:
            with storage.open(name, 'rb') as original:
                with Image.open(original) as img:
                    buffer = BytesIO()
                    img.convert('RGB').save(buffer, format='PNG', optimize=True)
            png_name = storage.save(f'{name[:-4]}.png', ContentFile(buffer.getvalue()))
        except Exception:
            continue

        Screensaver.objects.filter(pk=screensaver.pk).update(crop=png_name)
        storage.delete(name)


class Migration(migrations.Migration):

    dependencies = [
        ('screensaver', '0003_alter_screensaver_file'),
    ]

    operations = [
        migrations.RenameField(
            model_name='screensaver',
            old_name='file',
            new_name='crop',
        ),
        migrations.AlterField(
            model_name='screensaver',
            name='crop',
            field=models.FileField(
                help_text='Recorte final do screensaver em PNG — o BMP é gerado no navegador no download',
                upload_to='screensavers/final/%Y/',
                verbose_name='Recorte (PNG)',
            ),
        ),
        migrations.RunPython(bmps_to_png, migrations.RunPython.noop),
    ]
