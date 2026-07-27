from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("blog", "0001_initial"),
    ]

    operations = [
        migrations.AddConstraint(
            model_name="blogposttranslation",
            constraint=models.UniqueConstraint(
                fields=("language", "slug"),
                name="unique_blogposttranslation_language_slug",
            ),
        ),
    ]
