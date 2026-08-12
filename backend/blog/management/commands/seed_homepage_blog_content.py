from datetime import datetime, timezone

from django.core.management.base import BaseCommand
from django.utils.text import slugify

from blog.models import BlogCategory, BlogCategoryTranslation, BlogPost, BlogPostTranslation


POSTS = {
    "guides": [
        ("How to List Your Business Online for Free in Europe", "A practical starting guide to creating a clear, useful business listing for customers across Europe.", "Start with the essentials: use the business name customers know, choose the closest category, add the city and country, and write a short factual description. Check the spelling and opening information before publishing.\n\nNext, review the public page as a customer would. Make sure the location is understandable and that the description says what the business actually offers. Avoid adding claims that cannot be supported.\n\nOnce the listing is live, keep it accurate. Add a link to the free listing flow when you need to create a new record, and use the claim process when you manage an existing business."),
        ("How to Claim and Manage Your Business Listing", "Learn how to identify an existing listing, complete ownership verification, and keep its public information useful.", "Search for the business by name and location before creating a second listing. Compare the category, city, and description with the real business so you select the correct page.\n\nUse the claim flow with an email address you control and provide the requested verification information. A claim should represent a real owner or manager, not someone simply promoting a business.\n\nAfter verification, review the public fields regularly. Keep the name, description, category, and location current, and remove information that is no longer accurate."),
        ("Getting a Small Business Online: A Simple Checklist", "A concise checklist for moving from no online presence to a clear, maintainable business page.", "Begin with five facts: the public business name, what it offers, its category, its city, and its country. These details form a useful foundation without requiring a large website project.\n\nCreate or claim the directory listing, then check it on a phone. Look for unclear wording, missing location context, and links that do not work. Ask someone unfamiliar with the business whether they understand the page.\n\nSet a small maintenance reminder. Review the listing after a move, a change in services, or a change in opening arrangements. Consistent small updates are easier than a large correction later."),
        ("How Customers Find Local Businesses Online", "Understand the practical signals people use when deciding which local business pages to open.", "People commonly begin with a need, a place, or a category. A page is easier to assess when its name, location, category, and description match the words customers use for the service.\n\nCustomers also compare several results. Clear descriptions, consistent names, and useful links help them understand the difference between similar businesses. The goal is clarity, not exaggerated language.\n\nMake the next step obvious: a customer may want to browse more details, visit a website, or contact the business. Check that the available route is accurate and works on mobile."),
        ("What Information Should a Business Listing Include?", "The core information that makes a local business listing understandable and useful.", "A strong basic listing identifies the business, explains its main offer in plain language, and places it in the right city, country, and category. These fields answer the first questions a visitor has.\n\nUse a short description that is factual and specific. Mention the type of service or product without stuffing it with repeated search terms. If a detail is uncertain, leave it out until it can be checked.\n\nReview the page for consistency with the business’s other public information. Matching names and locations reduce confusion when customers move between a directory, a website, and social profiles."),
        ("From Free Listing to Your Own Business Website", "See how a factual directory listing can become the starting point for a more complete business presence.", "A free listing is a useful first layer: it gives customers a name, description, category, and location to browse. Start there and make sure the information is correct before adding more layers.\n\nWhen the business needs more space, claim the listing so its owner or manager can maintain the public information. A generated website can then provide a fuller presentation without replacing the directory entry.\n\nKeep the relationship simple for customers. Link the listing and website where appropriate, use the same business identity on both, and update both when important facts change."),
    ],
    "insights": [
        ("Why Small Businesses Still Need an Online Presence", "A balanced look at why a clear online business presence remains useful even for locally focused companies.", "Local businesses are often discovered before a customer visits them. A basic online presence helps people confirm that the business exists, understand what it offers, and see where it is located.\n\nThis does not require every business to publish a large amount of content. A maintained directory page and a suitable website can be more useful than several incomplete profiles.\n\nThe important measure is usefulness: accurate facts, clear language, and a straightforward next step. A small business can build that foundation gradually as time and resources allow."),
        ("Directory Listing vs Business Website: What's the Difference?", "Compare the roles of a directory listing and a business website so each can support the customer journey.", "A directory listing helps people discover a business alongside other local businesses. It usually emphasizes identity, category, and location, making it useful during comparison and browsing.\n\nA business website gives the business more room to explain its work, present services, answer questions, and choose its own structure. It can support customers who already want more detail.\n\nThe two formats work well together when their core information agrees. The listing helps discovery; the website provides depth. Neither needs to make promises about rankings or guaranteed traffic."),
        ("Why Local Search Matters for Small Businesses", "Explore how location and service context shape the way customers evaluate local businesses online.", "A customer’s need is often tied to a place: a nearby repair shop, a restaurant in a particular district, or a service available in a city. Location context makes a result easier to judge.\n\nSmall businesses benefit from stating their location and service clearly rather than relying on broad promotional language. A concise page can be more useful than an impressive page that leaves the basics unclear.\n\nLocal visibility is an ongoing information task. Keep the business name, category, city, and description aligned across the places where customers may encounter them."),
        ("How Location Pages Help Customers Discover Businesses", "Learn why city and country pages provide useful context without replacing individual business information.", "Location pages group businesses by a place, helping visitors move from a broad question to a more specific shortlist. They are especially useful when someone knows the city but not the business name.\n\nThe individual listing still matters. It should explain what the business does and give enough context for a customer to decide whether it is relevant. A location page works best when the underlying records are accurate.\n\nBusinesses can support this experience by keeping their city and category correct. Visitors then have a better chance of finding an appropriate page while browsing local options."),
        ("What Makes a Business Page Useful to Customers?", "A practical explanation of the page qualities that help visitors understand a business quickly.", "Useful business pages answer basic questions early: who is this, what does it offer, and where is it located? Clear headings and a short factual description reduce the effort needed to understand the page.\n\nThe page should also reflect the customer’s next decision. Some visitors need more information, some want to compare alternatives, and some are ready to contact the business. Organize the available details around those needs.\n\nAvoid filling space with unsupported claims. Trust grows from accurate information, consistent presentation, and updates when the business changes."),
        ("Why Consistent Business Information Matters Online", "Understand how consistent names, categories, and locations reduce confusion across online business pages.", "Customers may encounter a business in several places. If the name, city, category, or description changes unexpectedly, they may wonder whether the pages refer to the same business.\n\nConsistency does not mean every page must use identical wording. It means the important facts should agree and the differences should be intentional. Start with a short set of reference facts that can be checked during updates.\n\nA regular review is often enough for a small business. Check the main listing and website after a move, a service change, or a change in how the business presents itself publicly."),
    ],
    "featured": [
        ("10 Ways to Make Your Small Business Easier to Find Online", "Ten practical improvements that make a small business presence clearer without promising search rankings.", "1. Use the business name customers recognize. 2. Choose a precise category. 3. State the city and country. 4. Write a factual description. 5. Keep contact routes current.\n\n6. Link to the main business website when one exists. 7. Check the page on a phone. 8. Keep wording consistent across important profiles. 9. Ask a colleague to test the customer journey. 10. Set a simple review reminder.\n\nThese steps improve clarity rather than guaranteeing a particular search result. Start with the facts that are easiest to verify, then add detail as the business can maintain it."),
        ("How a Generated Website Can Help a New Business Get Started", "See where a generated website can fit in a new business’s online presence and where owner review remains important.", "A generated website can give a new business a structured place to explain its offer, location, and next steps. It is useful when a directory listing alone does not provide enough room for the business story.\n\nThe owner should review every important detail before sharing the site. Check the business name, description, contact routes, imagery, and links. Generated structure is a starting point, not a substitute for factual approval.\n\nA website can complement a free listing. The listing supports directory discovery while the site gives interested visitors a fuller page to read."),
        ("Free Business Listings: What Business Owners Should Know", "A neutral guide to the purpose, limits, and maintenance responsibilities of a free business listing.", "A free listing gives a business a public directory entry with core information such as its name, description, category, and location. It can be a practical starting point for a business that wants a clear presence without beginning with a larger project.\n\nThe listing is not a guarantee of rankings, leads, or customer volume. Its value depends on whether the information is accurate and useful to people browsing the directory.\n\nOwners should look for the correct existing listing before adding another one, claim the page when appropriate, and update the public information when the business changes."),
        ("How to Promote a Local Business Without a Large Advertising Budget", "Practical ways to make a local business easier to understand and share without relying on expensive campaigns.", "Start with the basics that customers and partners can reuse: a clear business name, a one-sentence description, the category, the service area, and a reliable destination for more information.\n\nShare useful answers rather than constant promotion. A short explanation of a service, a local question, or a common preparation step can help people understand the business without making exaggerated claims.\n\nUse the channels the business can maintain. A complete directory listing and a simple website are often more sustainable than opening many profiles that quickly become outdated."),
        ("Building Trust Online When Your Business Is Small", "Ways a small business can make its online information feel dependable through clarity and careful maintenance.", "Trust begins with recognizable facts. Use a consistent business name, explain the main offer plainly, and make the location easy to understand. Avoid language that promises outcomes the business cannot control.\n\nShow care in the details. Correct broken links, remove outdated information, and ensure the page works on a mobile screen. These are small signals that the business takes customer questions seriously.\n\nA modest, accurate presence is better than a large collection of neglected pages. Build only what the business can review and keep current."),
        ("Five Things Customers Look for Before Contacting a Local Business", "The five practical questions customers often answer before deciding whether to make contact.", "First, customers want to know what the business does. Second, they look for location or service-area context. Third, they check whether the business appears relevant to their need.\n\nFourth, they look for a clear next step, such as a website, booking route, or contact method. Fifth, they look for signs that the information is current and consistent.\n\nA business page does not need to answer every possible question. It should make these first checks easy, then point interested visitors toward the most useful next detail."),
    ],
}


class Command(BaseCommand):
    help = "Seed the three homepage blog buckets with 18 useful published English posts."

    def handle(self, *args, **options):
        categories = {}
        labels = {"guides": "Latest EU Guides", "insights": "Latest Insights", "featured": "Featured Blog Posts"}
        for key, label in labels.items():
            category, _ = BlogCategory.objects.get_or_create(key=key)
            BlogCategoryTranslation.objects.update_or_create(
                category=category, language="en",
                defaults={"name": label, "slug": key, "description": f"{label} for ListAcrossEU readers."},
            )
            categories[key] = category

        created = 0
        for bucket, posts in POSTS.items():
            for title, excerpt, body in posts:
                slug = slugify(title)
                post, was_created = BlogPost.objects.get_or_create(
                    slug=slug,
                    defaults={
                        "status": BlogPost.STATUS_PUBLISHED,
                        "published_at": datetime(2026, 1, 1, tzinfo=timezone.utc),
                        "hero_image_url": "",
                    },
                )
                post.categories.add(categories[bucket])
                if was_created:
                    BlogPostTranslation.objects.update_or_create(
                        post=post, language="en",
                        defaults={
                            "title": title,
                            "slug": slug,
                            "excerpt": excerpt,
                            "body": body,
                            "seo_title": title,
                            "seo_description": excerpt,
                            "is_published": True,
                        },
                    )
                    created += 1

        self.stdout.write(self.style.SUCCESS(f"Created {created} missing homepage blog posts."))
        for bucket, category in categories.items():
            self.stdout.write(f"{bucket}: {category.posts.filter(status=BlogPost.STATUS_PUBLISHED).count()} published posts")
