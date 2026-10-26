from django.db import migrations


def repair(apps, schema_editor):
    """0006 bazada 'bajarilgan' deb belgilangan, lekin ustunlar yaratilmagan bo'lsa — yetishmayotgan ustunlarni qo'shadi."""
    conn = schema_editor.connection
    for name in ("Application", "ApplicationDocument", "Inquiry"):
        model = apps.get_model("applications", name)
        with conn.cursor() as cur:
            existing = {c.name for c in conn.introspection.get_table_description(cur, model._meta.db_table)}
        for field in model._meta.local_fields:
            if field.column not in existing:
                schema_editor.add_field(model, field)


class Migration(migrations.Migration):
    dependencies = [("applications", "0006_inquiry_reply")]
    operations = [migrations.RunPython(repair, migrations.RunPython.noop)]
