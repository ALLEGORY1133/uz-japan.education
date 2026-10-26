import apps.applications.models
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("applications", "0001_initial"),
    ]

    operations = [
        migrations.AddField(model_name="application", name="birth_date", field=models.DateField(blank=True, null=True)),
        migrations.AddField(model_name="application", name="citizenship", field=models.CharField(blank=True, max_length=80)),
        migrations.AddField(model_name="application", name="city", field=models.CharField(blank=True, max_length=100)),
        migrations.AddField(model_name="application", name="passport_number", field=models.CharField(blank=True, max_length=40)),
        migrations.AddField(model_name="application", name="program", field=models.CharField(blank=True, help_text="Qiziqqan yo'nalish", max_length=200)),
        migrations.AddField(model_name="application", name="tracking_code", field=models.CharField(blank=True, editable=False, max_length=16, null=True, unique=True)),
        migrations.AddField(model_name="application", name="is_submitted", field=models.BooleanField(default=True)),
        migrations.AddField(model_name="application", name="submitted_at", field=models.DateTimeField(blank=True, null=True)),
        migrations.CreateModel(
            name="ApplicationDocument",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("doc_type", models.CharField(choices=[("passport", "Pasport"), ("diploma", "Diplom / attestat"), ("transcript", "Transkript"), ("language_cert", "Til sertifikati"), ("cv", "Tarjimai hol (CV)"), ("motivation", "Motivatsion xat"), ("recommendation", "Tavsiyanoma"), ("photo", "Foto"), ("other", "Boshqa")], default="other", max_length=20)),
                ("file", models.FileField(max_length=200, storage=apps.applications.models.get_private_storage, upload_to=apps.applications.models.document_path)),
                ("original_name", models.CharField(max_length=200)),
                ("size", models.PositiveIntegerField(default=0)),
                ("content_type", models.CharField(blank=True, max_length=100)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("application", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="documents", to="applications.application")),
            ],
            options={
                "verbose_name": "Ariza hujjati",
                "verbose_name_plural": "Ariza hujjatlari",
                "ordering": ["doc_type", "id"],
            },
        ),
    ]
