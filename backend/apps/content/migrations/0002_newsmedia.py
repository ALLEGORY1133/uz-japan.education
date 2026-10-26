import apps.core.validators
import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("content", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="NewsMedia",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("kind", models.CharField(choices=[("image", "Rasm"), ("video", "Video")], default="image", max_length=5)),
                ("file", models.FileField(blank=True, upload_to="news/gallery/", validators=[django.core.validators.FileExtensionValidator(["jpg", "jpeg", "png", "webp", "avif", "mp4", "webm"]), apps.core.validators.validate_media_size])),
                ("video_url", models.URLField(blank=True, help_text="YouTube yoki Vimeo havolasi")),
                ("caption", models.CharField(blank=True, max_length=200)),
                ("sort_order", models.PositiveIntegerField(default=0)),
                ("news", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="media", to="content.news")),
            ],
            options={
                "verbose_name": "Yangilik media",
                "verbose_name_plural": "Yangilik media fayllari",
                "ordering": ["sort_order", "id"],
            },
        ),
    ]
