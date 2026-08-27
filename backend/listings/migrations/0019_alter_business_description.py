from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("listings", "0018_passwordresettoken")]

    operations = [
        migrations.AlterField(
            model_name="business",
            name="description",
            field=models.TextField(blank=True, max_length=500),
        ),
    ]
