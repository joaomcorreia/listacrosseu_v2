from django.db import transaction
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .dashboard import _save_website, _verified_business, _website_draft, _website_response


class DashboardWebsitePublishView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, business_id):
        business = _verified_business(request, business_id)
        draft = _website_draft(business)
        draft["status"] = "published"
        _save_website(business, draft)
        return Response(_website_response(business))
