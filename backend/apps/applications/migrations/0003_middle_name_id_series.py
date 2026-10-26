from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("applications", "0002_documents")]

    operations = [
        migrations.AddField(
            model_name="application",
            name="middle_name",
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name="application",
            name="id_series",
            field=models.CharField(blank=True, help_text="Shaxsni tasdiqlovchi hujjat seriyasi", max_length=20),
        ),
        migrations.AlterField(
            model_name="applicationdocument",
            name="doc_type",
            field=models.CharField(
                choices=[
                    ("passport", "Shaxsni tasdiqlovchi hujjat"), ("diploma", "Diplom / attestat"),
                    ("transcript", "Transkript"), ("language_cert", "Til sertifikati"),
                    ("cv", "Tarjimai hol (CV)"), ("motivation", "Motivatsion xat"),
                    ("recommendation", "Tavsiyanoma"), ("photo", "Foto"), ("other", "Boshqa"),
                ],
                default="other", max_length=20,
            ),
        ),
    ]
