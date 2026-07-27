from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from content.models import Page, Section

from .serializers import PageSerializer, SectionBusinessPickSerializer, SectionSerializer


class PageView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, key):
        page = get_object_or_404(Page, key=key, active=True)
        serializer = PageSerializer(page)
        data = serializer.data
        data["sections"] = [section for section in data["sections"] if section["active"]]
        return Response(data, status=status.HTTP_200_OK)


class AdminSectionListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, key):
        page = get_object_or_404(Page, key=key)
        sections = page.sections.all().order_by("order")
        serializer = SectionSerializer(sections, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminSectionUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def patch(self, request, pk):
        section = get_object_or_404(Section, pk=pk)
        serializer = SectionSerializer(section, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminSectionReorderView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, key):
        page = get_object_or_404(Page, key=key)
        order = request.data.get("order", [])
        if not isinstance(order, list):
            return Response({"error": "Order must be a list"}, status=status.HTTP_400_BAD_REQUEST)
        for idx, section_id in enumerate(order):
            try:
                section = page.sections.get(id=section_id)
                section.order = idx
                section.save(update_fields=["order"])
            except Section.DoesNotExist:
                continue
        return Response({"success": True}, status=status.HTTP_200_OK)


@method_decorator(ensure_csrf_cookie, name="dispatch")
@method_decorator(csrf_protect, name="dispatch")
class AdminAuthView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response({"error": "Username and password required"}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request, username=username, password=password)
        if user and user.is_staff:
            login(request, user)
            return Response(
                {
                    "success": True,
                    "csrfToken": get_token(request),
                    "user": {"username": user.username, "is_staff": user.is_staff},
                }
            )
        return Response({"error": "Invalid credentials or not staff"}, status=status.HTTP_401_UNAUTHORIZED)

    def delete(self, request):
        logout(request)
        return Response({"success": True})

    def get(self, request):
        response = {"authenticated": False, "csrfToken": get_token(request)}
        if request.user.is_authenticated and request.user.is_staff:
            response["authenticated"] = True
            response["user"] = {"username": request.user.username, "is_staff": request.user.is_staff}
        return Response(response)


class SectionBusinessPicksView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, section_id):
        section = get_object_or_404(Section, pk=section_id)
        picks = section.business_picks.all().order_by("order")
        serializer = SectionBusinessPickSerializer(picks, many=True)
        businesses = [pick["business"] for pick in serializer.data]
        return Response({"results": businesses, "count": len(businesses)}, status=status.HTTP_200_OK)
