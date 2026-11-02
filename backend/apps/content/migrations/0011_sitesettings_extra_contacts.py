from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("content", "0010_galleryimage")]

    operations = [
        migrations.AddField(model_name="sitesettings", name="extra_emails", field=models.JSONField(blank=True, default=list)),
        migrations.AddField(model_name="sitesettings", name="extra_phones", field=models.JSONField(blank=True, default=list)),
    ]
