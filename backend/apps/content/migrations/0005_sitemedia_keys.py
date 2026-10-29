from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("content", "0004_remove_law_news")]

    operations = [
        migrations.AlterField(
            model_name="sitemedia",
            name="key",
            field=models.CharField(choices=[("students_card", "Talabalar kartasi"), ("collab_card", "Hamkorlik kartasi"), ("online_video", "Onlayn hamkorlik videosi"), ("video_band", "Bosh sahifa: katta video / rasm (Biz haqimizda)"), ("apply_bg", "Bosh sahifa: ariza bandi foni"), ("gallery_1", "Galereya lentasi · 1"), ("gallery_2", "Galereya lentasi · 2"), ("gallery_3", "Galereya lentasi · 3"), ("gallery_4", "Galereya lentasi · 4"), ("gallery_5", "Galereya lentasi · 5"), ("gallery_6", "Galereya lentasi · 6"), ("gallery_7", "Galereya lentasi · 7"), ("gallery_8", "Galereya lentasi · 8"), ("gallery_9", "Galereya lentasi · 9"), ("gallery_10", "Galereya lentasi · 10"), ("gallery_11", "Galereya lentasi · 11"), ("gallery_12", "Galereya lentasi · 12")], max_length=30, unique=True),
        ),
    ]
