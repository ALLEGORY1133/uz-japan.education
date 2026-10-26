import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("applications", "0005_inquiry"),
    ]

    operations = [
        migrations.AddField(model_name="inquiry", name="reply", field=models.TextField(blank=True, max_length=4000, verbose_name="Admin javobi")),
        migrations.AddField(model_name="inquiry", name="replied_at", field=models.DateTimeField(blank=True, null=True, verbose_name="Javob vaqti")),
        migrations.AddField(
            model_name="inquiry", name="replied_by",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to=settings.AUTH_USER_MODEL),
        ),
    ]
