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


def _directory_page_key(scope, slug):
    if scope not in {"country", "city", "category", "landing"}:
        return None
    return f"directory-{scope}-{slug}"


def _directory_content(page, draft=False):
    section = page.sections.filter(key="hero").first()
    if not section:
        return None
    settings = section.settings if isinstance(section.settings, dict) else {}
    base = {
        "scope": settings.get("scope", ""),
        "slug": settings.get("slug", ""),
        "hero_image": settings.get("hero_image", ""),
        "title": section.title,
        "subtitle": section.subtitle,
        "intro": section.body,
        "cta_label": section.cta_label,
        "cta_href": section.cta_href,
        "seo_title": settings.get("seo_title", section.title),
        "meta_description": settings.get("meta_description", section.body),
        "related_links": settings.get("related_links", []),
    }
    snapshot = settings.get("_draft" if draft else "_public")
    return {**base, **snapshot} if isinstance(snapshot, dict) else base


def _directory_payload(request, scope, slug):
    key = _directory_page_key(scope, slug)
    page = Page.objects.filter(key=key, active=True).first()
    return _directory_content(page, draft=False) if page else None


class PageView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, key):
        page = get_object_or_404(Page, key=key, active=True)
        serializer = PageSerializer(page)
        data = serializer.data
        data["sections"] = [section for section in data["sections"] if section["active"]]
        return Response(data, status=status.HTTP_200_OK)


class DirectoryContentView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, scope, slug):
        return Response({"content": _directory_payload(request, scope, slug)}, status=status.HTTP_200_OK)


class AdminDirectoryContentView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_object(self, scope, slug):
        key = _directory_page_key(scope, slug)
        if not key:
            from rest_framework.exceptions import NotFound
            raise NotFound("Unsupported directory content scope.")
        return get_object_or_404(Page, key=key)

    def get(self, request, scope, slug):
        page = self.get_object(scope, slug)
        section = get_object_or_404(Section, page=page, key="hero")
        settings = section.settings if isinstance(section.settings, dict) else {}
        return Response({
            "content": _directory_content(page, draft=True),
            "status": "draft" if isinstance(settings.get("_draft"), dict) else "published",
        }, status=status.HTTP_200_OK)

    def patch(self, request, scope, slug):
        page = self.get_object(scope, slug)
        section = get_object_or_404(Section, page=page, key="hero")
        settings = dict(section.settings or {})
        draft = dict(_directory_content(page, draft=True) or {})
        allowed = {"hero_image", "title", "subtitle", "intro", "cta_label", "cta_href", "seo_title", "meta_description", "related_links"}
        for field in allowed:
            if field not in request.data:
                continue
            value = request.data[field]
            draft[field] = value if field == "related_links" and isinstance(value, list) else str(value or "").strip()
        settings["_draft"] = draft
        section.settings = settings
        section.save(update_fields=["settings"])
        return Response({"content": draft, "status": "draft"}, status=status.HTTP_200_OK)

    def post(self, request, scope, slug):
        page = self.get_object(scope, slug)
        section = get_object_or_404(Section, page=page, key="hero")
        settings = dict(section.settings or {})
        draft = settings.get("_draft")
        if not isinstance(draft, dict):
            return Response({"detail": "Save a draft before publishing."}, status=status.HTTP_400_BAD_REQUEST)
        section.title = draft.get("title", section.title)
        section.subtitle = draft.get("subtitle", section.subtitle)
        section.body = draft.get("intro", section.body)
        section.cta_label = draft.get("cta_label", section.cta_label)
        section.cta_href = draft.get("cta_href", section.cta_href)
        settings["hero_image"] = draft.get("hero_image", settings.get("hero_image", ""))
        settings["seo_title"] = draft.get("seo_title", settings.get("seo_title", section.title))
        settings["meta_description"] = draft.get("meta_description", settings.get("meta_description", section.body))
        settings["related_links"] = draft.get("related_links", settings.get("related_links", []))
        settings["_public"] = draft
        settings.pop("_draft", None)
        section.settings = settings
        section.save(update_fields=["settings", "title", "subtitle", "body", "cta_label", "cta_href"])
        return Response({"content": _directory_content(page, draft=False), "status": "published"}, status=status.HTTP_200_OK)


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
