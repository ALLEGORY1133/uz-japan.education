import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("accounts", "0003_content_manager_role")]
    operations = [
        migrations.CreateModel(
            name="Role",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=80, unique=True, verbose_name="Nomi")),
                ("description", models.CharField(blank=True, max_length=200, verbose_name="Izoh")),
                ("permissions", models.JSONField(blank=True, default=dict, verbose_name="Ruxsatlar")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"verbose_name": "Rol", "verbose_name_plural": "Rollar", "ordering": ["name"]},
        ),
        migrations.AlterField(
            model_name="user", name="role",
            field=models.CharField(choices=[("platform_admin", "Platforma administratori"), ("university_rep", "Universitet vakili"), ("content_manager", "Kontent menejeri"), ("custom", "Maxsus rol")], default="university_rep", max_length=20),
        ),
        migrations.AddField(
            model_name="user", name="custom_role",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="users", to="accounts.role", verbose_name="Maxsus rol"),
        ),
    ]
