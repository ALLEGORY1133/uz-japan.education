from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("applications", "0004_document_checks")]

    operations = [
        migrations.CreateModel(
            name="Inquiry",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120, verbose_name="Ism")),
                ("email", models.EmailField(max_length=254, verbose_name="Email")),
                ("phone", models.CharField(blank=True, max_length=40, verbose_name="Telefon")),
                ("interest", models.CharField(choices=[("bachelor", "Bakalavr"), ("master", "Magistratura"), ("doctoral", "Doktorantura"), ("grant", "Grant / stipendiya"), ("exchange", "Almashinuv dasturi"), ("other", "Boshqa")], default="other", max_length=12, verbose_name="Qiziqish yo'nalishi")),
                ("message", models.TextField(blank=True, max_length=2000, verbose_name="Xabar")),
                ("is_handled", models.BooleanField(default=False, verbose_name="Ko'rib chiqildi")),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
            ],
            options={"verbose_name": "Murojaat", "verbose_name_plural": "Murojaatlar", "ordering": ["-created_at", "-id"]},
        ),
    ]
