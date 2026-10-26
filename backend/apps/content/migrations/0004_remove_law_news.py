from django.db import migrations

SLUG = "lotin-yozuviga-asoslangan-ozbek-alifbosi"


def remove(apps, schema_editor):
    # Qonun matni alohida yangilik sifatida emas, loyiha yozuviga (alifboga) qo'llanadi: oldin qo'shilgan yangilikni olib tashlaymiz
    apps.get_model("content", "News").objects.filter(slug=SLUG).delete()


class Migration(migrations.Migration):
    dependencies = [("content", "0003_heroslideimage")]
    operations = [migrations.RunPython(remove, migrations.RunPython.noop)]
