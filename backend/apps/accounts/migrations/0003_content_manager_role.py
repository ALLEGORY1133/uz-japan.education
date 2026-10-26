from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("accounts", "0002_loginattempt")]
    operations = [
        migrations.AlterField(
            model_name="user", name="role",
            field=models.CharField(choices=[("platform_admin", "Platforma administratori"), ("university_rep", "Universitet vakili"), ("content_manager", "Kontent menejeri")], default="university_rep", max_length=20),
        ),
    ]
