import apps.core.validators
import django.core.validators
from datetime import timedelta

from django.db import migrations, models
from django.utils import timezone

SEED = [
    ("sayt-onlayn-ariza", "Onlayn ariza va talaba kabineti ishga tushdi", "Online application and student cabinet are live", "オンライン出願と学生キャビネットを開始しました",
     "Hujjatlarni onlayn yuklab, ariza holatini email orqali kuzatish mumkin.", "Upload documents online and track your application status by email.", "書類をオンラインでアップロードし、メールで出願状況を確認できます。"),
    ("sayt-yordamchi", "Yordamchi: savollarga tezkor javob", "Assistant: quick answers to your questions", "アシスタント：質問にすばやく回答",
     "Universitetlar, muddatlar va talablar haqida saytdagi yordamchidan so'rang.", "Ask the on-site assistant about universities, deadlines and requirements.", "大学、締切、要件についてサイト上のアシスタントに質問できます。"),
    ("sayt-yangi-bolimlar", "Saytda yangi bo'limlar: yangiliklar, hamkorlik, tadbirlar", "New sections: news, cooperation and events", "新しいセクション：ニュース・連携・イベント",
     "Har bir yo'nalish endi alohida sahifada, rasm va videolar bilan.", "Each topic now has its own page with photos and videos.", "各トピックが写真・動画付きの独立したページになりました。"),
]


def seed_updates(apps, schema_editor):
    """Bo'sh bo'lmasligi uchun «Sayt yangiliklari» ga 3 ta boshlang'ich yozuv (admin tahrirlaydi/o'chiradi)."""
    from apps.core.alphabet import to_new_alphabet

    News = apps.get_model("content", "News")
    if News.objects.filter(category="platform").exists():
        return
    now = timezone.now()
    for i, (slug, tu, te, tj, su, se, sj) in enumerate(SEED):
        if News.objects.filter(slug=slug).exists():
            continue
        tu, su = to_new_alphabet(tu), to_new_alphabet(su)
        News.objects.create(
            slug=slug, category="platform", link_type="internal", is_published=True,
            title=tu, title_uz=tu, title_en=te, title_ja=tj,
            summary=su, summary_uz=su, summary_en=se, summary_ja=sj,
            body=su, body_uz=su, body_en=se, body_ja=sj,
            published_at=now - timedelta(days=i),
        )


class Migration(migrations.Migration):

    dependencies = [
        ("content", "0008_merge_20261029_1551"),
    ]

    operations = [
        migrations.AddField(
            model_name="news",
            name="video",
            field=models.FileField(blank=True, help_text="Muqova rasmi o'rnida (yoki uning ustida) ko'rsatiladigan video", upload_to="news/video/", validators=[django.core.validators.FileExtensionValidator(["mp4", "webm"]), apps.core.validators.validate_video_size]),
        ),
        migrations.AlterField(
            model_name="news",
            name="category",
            field=models.CharField(choices=[("news", "Yangilik"), ("cooperation", "Hamkorlik"), ("event", "Tadbir"), ("platform", "Sayt yangiliklari")], default="news", max_length=12),
        ),
        migrations.RunPython(seed_updates, migrations.RunPython.noop),
    ]
