import apps.core.validators
import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("content", "0002_newsmedia"),
    ]

    operations = [
        migrations.CreateModel(
            name="HeroSlideImage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("image", models.ImageField(upload_to="hero/", validators=[django.core.validators.FileExtensionValidator(["jpg", "jpeg", "png", "webp", "avif"]), apps.core.validators.validate_image_size])),
                ("sort_order", models.PositiveIntegerField(default=0)),
                ("slide", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="images", to="content.heroslide")),
            ],
            options={
                "verbose_name": "Slayd qo'shimcha rasmi",
                "verbose_name_plural": "Slayd qo'shimcha rasmlari",
                "ordering": ["sort_order", "id"],
            },
        ),
    ]
