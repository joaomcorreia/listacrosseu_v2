from django.urls import path
from .views import PageView, AdminSectionListView, AdminSectionUpdateView, AdminSectionReorderView, AdminAuthView, SectionBusinessPicksView

urlpatterns = [
    path('pages/<str:key>/', PageView.as_view(), name='page-detail'),
    path('admin/auth/', AdminAuthView.as_view(), name='admin-auth'),
    path('admin/pages/<str:key>/sections/', AdminSectionListView.as_view(), name='admin-sections'),
    path('admin/sections/<int:pk>/', AdminSectionUpdateView.as_view(), name='admin-section-update'),
    path('admin/pages/<str:key>/sections/reorder/', AdminSectionReorderView.as_view(), name='admin-sections-reorder'),
    path('sections/<int:section_id>/business-picks/', SectionBusinessPicksView.as_view(), name='section-business-picks'),
]