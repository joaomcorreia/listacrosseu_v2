from rest_framework import serializers
from content.models import Page, Section, SectionItem, SectionBusinessPick
from listings.api.serializers import BusinessSerializer


class SectionItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SectionItem
        fields = [
            'id', 'order', 'title', 'subtitle', 'icon', 
            'href', 'badge', 'meta'
        ]


class SectionSerializer(serializers.ModelSerializer):
    items = SectionItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Section
        fields = [
            'id', 'key', 'type', 'order', 'active', 'settings',
            'title', 'subtitle', 'cta_label', 'cta_href',
            'cta_secondary_label', 'cta_secondary_href', 'items'
        ]


class SectionBusinessPickSerializer(serializers.ModelSerializer):
    business = BusinessSerializer(read_only=True)
    
    class Meta:
        model = SectionBusinessPick
        fields = ['id', 'business', 'order']


class PageSerializer(serializers.ModelSerializer):
    sections = SectionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Page
        fields = ['key', 'active', 'sections']