from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from content.models import Page, Section, SectionItem, SectionBusinessPick
from .serializers import PageSerializer, SectionSerializer, SectionBusinessPickSerializer


class PageView(APIView):
    """
    Returns page content with all active sections and items.
    GET /api/pages/<key>/?lang=en
    """
    
    def get(self, request, key):
        page = get_object_or_404(Page, key=key, active=True)
        serializer = PageSerializer(page)
        
        # Filter only active sections for frontend
        data = serializer.data
        data['sections'] = [
            section for section in data['sections'] 
            if section['active']
        ]
        
        return Response(data, status=status.HTTP_200_OK)


class AdminSectionListView(APIView):
    """
    Admin-only endpoint to get all sections for a page (including inactive).
    GET /api/admin/pages/<key>/sections/
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request, key):
        page = get_object_or_404(Page, key=key)
        sections = page.sections.all().order_by('order')
        serializer = SectionSerializer(sections, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminSectionUpdateView(APIView):
    """
    Admin-only endpoint to update a section.
    PATCH /api/admin/sections/<id>/
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def patch(self, request, pk):
        section = get_object_or_404(Section, pk=pk)
        serializer = SectionSerializer(section, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminSectionReorderView(APIView):
    """
    Admin-only endpoint to reorder sections.
    POST /api/admin/pages/<key>/sections/reorder/
    { "order": [3, 1, 2, 5] }
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def post(self, request, key):
        page = get_object_or_404(Page, key=key)
        order = request.data.get('order', [])
        
        if not isinstance(order, list):
            return Response({'error': 'Order must be a list'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Update order for each section
        for idx, section_id in enumerate(order):
            try:
                section = page.sections.get(id=section_id)
                section.order = idx
                section.save(update_fields=['order'])
            except Section.DoesNotExist:
                continue
        
        return Response({'success': True}, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class AdminAuthView(APIView):
    """
    Simple admin authentication for visual editor
    """
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response({'error': 'Username and password required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        user = authenticate(request, username=username, password=password)
        
        if user and user.is_staff:
            login(request, user)
            return Response({
                'success': True,
                'user': {
                    'username': user.username,
                    'is_staff': user.is_staff
                }
            })
        else:
            return Response({'error': 'Invalid credentials or not staff'}, 
                          status=status.HTTP_401_UNAUTHORIZED)
    
    def delete(self, request):
        logout(request)
        return Response({'success': True})
    
    def get(self, request):
        if request.user.is_authenticated and request.user.is_staff:
            return Response({
                'authenticated': True,
                'user': {
                    'username': request.user.username,
                    'is_staff': request.user.is_staff
                }
            })
        else:
            return Response({'authenticated': False})


class SectionBusinessPicksView(APIView):
    """
    Public endpoint to get manually picked businesses for a section.
    GET /api/content/sections/<id>/business-picks/
    """
    
    def get(self, request, section_id):
        section = get_object_or_404(Section, pk=section_id)
        
        # Get manually picked businesses ordered by their pick order
        picks = section.business_picks.all().order_by('order')
        serializer = SectionBusinessPickSerializer(picks, many=True)
        
        # Extract just the business data for frontend consumption
        businesses = [pick['business'] for pick in serializer.data]
        
        return Response({
            'results': businesses,
            'count': len(businesses)
        }, status=status.HTTP_200_OK)