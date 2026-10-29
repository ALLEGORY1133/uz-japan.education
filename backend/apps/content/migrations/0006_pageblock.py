import apps.core.validators
import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("content", "0005_sitemedia_keys"),
    ]

    operations = [
        migrations.CreateModel(
            name="PageBlock",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("key", models.CharField(max_length=60, unique=True)),
                ("title_uz", models.CharField(blank=True, max_length=300)),
                ("title_en", models.CharField(blank=True, max_length=300)),
                ("title_ja", models.CharField(blank=True, max_length=300)),
                ("text_uz", models.TextField(blank=True)),
                ("text_en", models.TextField(blank=True)),
                ("text_ja", models.TextField(blank=True)),
                ("link_label_uz", models.CharField(blank=True, max_length=120)),
                ("link_label_en", models.CharField(blank=True, max_length=120)),
                ("link_label_ja", models.CharField(blank=True, max_length=120)),
                ("link_url", models.CharField(blank=True, max_length=500)),
                ("image", models.ImageField(blank=True, upload_to="pages/", validators=[django.core.validators.FileExtensionValidator(["jpg", "jpeg", "png", "webp", "avif"]), apps.core.validators.validate_image_size])),
                ("video", models.FileField(blank=True, upload_to="pages/", validators=[django.core.validators.FileExtensionValidator(["mp4", "webm"]), apps.core.validators.validate_video_size])),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Sahifa bo'limi",
                "verbose_name_plural": "Sahifa bo'limlari",
            },
        ),
    ]
