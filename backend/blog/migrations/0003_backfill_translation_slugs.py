from django.db import migrations
from django.utils.text import slugify


def backfill_translation_slugs(apps, schema_editor):
    BlogPostTranslation = apps.get_model("blog", "BlogPostTranslation")

    for translation in BlogPostTranslation.objects.select_related("post"):
        needs_save = False

        if not translation.slug:
            base = translation.title or translation.post.slug
            translation.slug = slugify(base) if base else ""
            needs_save = True

        if translation.language == "en" and not translation.is_published:
            translation.is_published = True
            needs_save = True

        if needs_save:
            translation.save(update_fields=["slug", "is_published", "updated_at"])


class Migration(migrations.Migration):
    dependencies = [
        ("blog", "0002_unique_translation_slug"),
    ]

    operations = [
        migrations.RunPython(backfill_translation_slugs, migrations.RunPython.noop),
    ]
