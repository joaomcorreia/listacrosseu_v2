from django.contrib import admin
from .models import Page, Section, SectionItem, SectionBusinessPick


class SectionItemInline(admin.TabularInline):
    model = SectionItem
    extra = 0
    fields = ('order', 'title', 'subtitle', 'icon', 'href', 'badge')
    ordering = ('order',)


class SectionBusinessPickInline(admin.TabularInline):
    model = SectionBusinessPick
    extra = 0
    fields = ('business', 'order')
    ordering = ('order',)
    autocomplete_fields = ['business']  # Makes business selection searchable


class SectionInline(admin.StackedInline):
    model = Section
    extra = 0
    fields = ('key', 'type', 'order', 'active', 'title', 'subtitle', 
              'cta_label', 'cta_href', 'cta_secondary_label', 'cta_secondary_href')
    ordering = ('order',)


@admin.register(Page)
class PageAdmin(admin.ModelAdmin):
    list_display = ('key', 'active')
    list_filter = ('active',)
    inlines = [SectionInline]


@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ('page', 'key', 'type', 'order', 'active', 'title')
    list_filter = ('page', 'type', 'active')
    list_editable = ('order', 'active')
    ordering = ('page', 'order')
    inlines = [SectionItemInline, SectionBusinessPickInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('page', 'key', 'type', 'order', 'active')
        }),
        ('Content', {
            'fields': ('title', 'subtitle')
        }),
        ('Call-to-Action', {
            'fields': ('cta_label', 'cta_href', 'cta_secondary_label', 'cta_secondary_href'),
            'classes': ('collapse',)
        }),
        ('Settings', {
            'fields': ('settings',),
            'classes': ('collapse',)
        }),
    )


@admin.register(SectionItem)
class SectionItemAdmin(admin.ModelAdmin):
    list_display = ('section', 'order', 'title', 'href')
    list_filter = ('section__page', 'section__type')
    list_editable = ('order',)
    ordering = ('section', 'order')


@admin.register(SectionBusinessPick)
class SectionBusinessPickAdmin(admin.ModelAdmin):
    list_display = ('section', 'business', 'order')
    list_filter = ('section__page', 'section__type')
    list_editable = ('order',)
    ordering = ('section', 'order')
    autocomplete_fields = ['business']
