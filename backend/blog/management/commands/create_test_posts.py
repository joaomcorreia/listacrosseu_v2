from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from blog.models import BlogPost, BlogPostTranslation, BlogCategory, BlogCategoryTranslation


class Command(BaseCommand):
    help = 'Create test blog posts for development'

    def handle(self, *args, **options):
        self.stdout.write('Creating test blog posts...')
        
        # Create a test category
        category, created = BlogCategory.objects.get_or_create(
            key='guides',
        )
        
        if created:
            BlogCategoryTranslation.objects.create(
                category=category,
                language='en',
                name='Guides',
                slug='guides',
                description='Helpful guides for businesses'
            )
        
        # Create test blog posts
        test_posts = [
            {
                'slug': 'getting-started-micro-business',
                'title': 'Getting Started with Your Micro Business',
                'excerpt': 'Essential steps to launch your micro business successfully.',
                'body': '<p>This is a comprehensive guide to starting your micro business.</p>'
            },
            {
                'slug': 'eu-regulations-small-business',
                'title': 'Understanding EU Regulations for Small Businesses',
                'excerpt': 'Navigate the complex regulatory landscape across Europe.',
                'body': '<p>Learn about the key regulations affecting small businesses in the EU.</p>'
            },
            {
                'slug': 'marketing-tips-local-business',
                'title': 'Marketing Tips for Local Businesses',
                'excerpt': 'Effective marketing strategies for reaching local customers.',
                'body': '<p>Discover proven marketing tactics for local business success.</p>'
            }
        ]
        
        for i, post_data in enumerate(test_posts):
            # Create the blog post
            blog_post, created = BlogPost.objects.get_or_create(
                slug=post_data['slug'],
                defaults={
                    'status': 'published',
                    'published_at': timezone.now() - timedelta(days=i),
                    'hero_image_url': f'https://picsum.photos/400/200?random={i+1}',
                }
            )
            
            if created:
                blog_post.categories.add(category)
                
                # Create English translation
                BlogPostTranslation.objects.create(
                    post=blog_post,
                    language='en',
                    title=post_data['title'],
                    slug=post_data['slug'],
                    excerpt=post_data['excerpt'],
                    body=post_data['body'],
                    seo_title=post_data['title'],
                    seo_description=post_data['excerpt'],
                    is_published=True,
                )
                
                self.stdout.write(f'Created blog post: {post_data["title"]}')
            else:
                self.stdout.write(f'Blog post already exists: {post_data["title"]}')
        
        self.stdout.write(self.style.SUCCESS('Test blog posts created successfully!'))