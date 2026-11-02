import apps.core.validators
import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("content", "0009_news_video_platform")]

    operations = [
        migrations.CreateModel(
            name="GalleryImage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("image", models.ImageField(upload_to="gallery/", validators=[django.core.validators.FileExtensionValidator(["jpg", "jpeg", "png", "webp", "avif"]), apps.core.validators.validate_image_size])),
                ("sort_order", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "verbose_name": "Galereya qöşimça rasmi",
                "verbose_name_plural": "Galereya qöşimça rasmlari",
                "ordering": ["sort_order", "id"],
            },
        ),
    ]
