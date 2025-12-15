from django.contrib import admin
from .models import SidebarSlot, SidebarItem


class SidebarItemInline(admin.StackedInline):
    model = SidebarItem
    extra = 0
    fields = [
        "title",
        "item_type",
        "content_html",
        "content_text",
        "image_url",
        "link_url",
        "link_text",
        "order",
        "is_active",
        "css_classes",
    ]


@admin.register(SidebarSlot)
class SidebarSlotAdmin(admin.ModelAdmin):
    list_display = ["key", "name", "is_active", "created_at"]
    list_filter = ["is_active"]
    search_fields = ["key", "name"]
    inlines = [SidebarItemInline]


@admin.register(SidebarItem)
class SidebarItemAdmin(admin.ModelAdmin):
    list_display = ["slot", "title", "item_type", "order", "is_active", "created_at"]
    list_filter = ["item_type", "is_active", "slot"]
    search_fields = ["title", "slot__name"]
    list_editable = ["order", "is_active"]
