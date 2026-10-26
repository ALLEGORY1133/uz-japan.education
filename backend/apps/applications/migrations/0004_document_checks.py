from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("applications", "0003_middle_name_id_series")]

    operations = [
        migrations.AddField(
            model_name="applicationdocument",
            name="scan_status",
            field=models.CharField(default="skipped", help_text="clean — ClamAV toza deb topdi; skipped — skaner o'chiq edi", max_length=12),
        ),
        migrations.AddField(
            model_name="applicationdocument",
            name="lang_checked",
            field=models.BooleanField(default=False, help_text="Motivatsion xat yapon tilida ekani tasdiqlangan"),
        ),
    ]
