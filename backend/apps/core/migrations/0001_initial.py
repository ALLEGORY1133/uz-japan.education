import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [migrations.swappable_dependency(settings.AUTH_USER_MODEL)]

    operations = [
        migrations.CreateModel(
            name="AuditLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("user_label", models.CharField(blank=True, max_length=150)),
                ("action", models.CharField(choices=[("create", "Qo'shildi"), ("update", "O'zgartirildi"), ("delete", "O'chirildi"), ("reorder", "Tartib o'zgardi")], max_length=10)),
                ("model_key", models.CharField(db_index=True, max_length=80)),
                ("model_label", models.CharField(max_length=120)),
                ("object_id", models.CharField(blank=True, max_length=40)),
                ("object_repr", models.CharField(blank=True, max_length=200)),
                ("changes", models.JSONField(blank=True, default=list)),
                ("ip", models.GenericIPAddressField(blank=True, null=True)),
                ("path", models.CharField(blank=True, max_length=200)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("user", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="audit_logs", to=settings.AUTH_USER_MODEL)),
            ],
            options={"verbose_name": "Harakat tarixi", "verbose_name_plural": "Harakatlar tarixi", "ordering": ["-created_at", "-id"]},
        ),
    ]
