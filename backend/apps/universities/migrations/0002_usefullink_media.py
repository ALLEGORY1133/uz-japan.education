import apps.core.validators
import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("universities", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="usefullink",
            name="image",
            field=models.ImageField(blank=True, upload_to="links/", validators=[apps.core.validators.image_extensions, apps.core.validators.validate_image_size]),
        ),
        migrations.AddField(
            model_name="usefullink",
            name="video",
            field=models.FileField(blank=True, upload_to="links/", validators=[apps.core.validators.video_extensions, apps.core.validators.validate_video_size]),
        ),
    ]
