from django.db import migrations, models


def unpublish_uncategorized(apps, schema_editor):
    Category = apps.get_model("listings", "Category")
    Category.objects.filter(slug="uncategorized").update(is_public=False)


class Migration(migrations.Migration):
    dependencies = [
        ("listings", "0013_business_accent_color_business_logo_file"),
    ]

    operations = [
        migrations.AddField(
            model_name="category",
            name="is_public",
            field=models.BooleanField(
                default=True,
                verbose_name="Publish category publicly",
                help_text="Publish this category in the public directory and SEO pages.",
            ),
        ),
        migrations.AddField(
            model_name="business",
            name="is_published",
            field=models.BooleanField(
                default=True,
                verbose_name="Published",
                help_text="Include this listing in the public directory and public APIs.",
            ),
        ),
        migrations.RunPython(unpublish_uncategorized, migrations.RunPython.noop),
    ]
