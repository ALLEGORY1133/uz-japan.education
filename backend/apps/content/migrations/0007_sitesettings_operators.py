from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("content", "0006_pageblock"),
    ]

    operations = [
        migrations.AddField(
            model_name="sitesettings",
            name="operators",
            field=models.JSONField(blank=True, default=list),
        ),
    ]
