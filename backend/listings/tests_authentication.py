from datetime import timedelta
import os
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core import mail
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from listings.models import AccountVerificationToken, Business, BusinessClaimRequest, Category, City, Country, PasswordResetToken


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class FreshLoginTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_pending_email_account_can_login_but_claim_stays_pending(self):
        user = get_user_model().objects.create_user(
            username="pending-login@example.test", email="pending-login@example.test",
            password="safe-password-123", is_active=False,
        )
        country = Country.objects.create(name="Login Country", code="LC", slug="login-country")
        city = City.objects.create(country=country, name="Login City", slug="login-city")
        category = Category.objects.create(name="Login Category", slug="login-category")
        business = Business.objects.create(name="Pending Login Business", slug="pending-login-business", country=country, city=city, category=category)
        claim = BusinessClaimRequest.objects.create(
            listing=business, name="Pending Owner", email=user.email, business_name=business.name,
            business_address="Main Street", business_post_code="1000", status="pending",
        )
        AccountVerificationToken.objects.create(user=user, claim=claim, expires_at=timezone.now() + timedelta(hours=1))

        response = self.client.post("/api/dashboard/auth/", {"email": user.email, "password": "safe-password-123", "pending_token": str(claim.verification_token)}, format="json")
        self.assertEqual(response.status_code, 200)
        claim.refresh_from_db()
        self.assertEqual(claim.status, "pending")
        self.assertEqual(self.client.get("/api/dashboard/businesses/").status_code, 200)

    def test_wrong_password_and_disabled_account_are_denied(self):
        user = get_user_model().objects.create_user(username="login-denied@example.test", email="login-denied@example.test", password="safe-password-123", is_active=True)
        wrong = self.client.post("/api/dashboard/auth/", {"email": user.email, "password": "wrong-password"}, format="json")
        self.assertEqual(wrong.status_code, 401)
        user.is_active = False
        user.save(update_fields=["is_active"])
        disabled = self.client.post("/api/dashboard/auth/", {"email": user.email, "password": "safe-password-123"}, format="json")
        self.assertEqual(disabled.status_code, 401)

    def test_passwordless_verified_owner_can_recover_and_login(self):
        country = Country.objects.create(name="Recovery Country", code="RC", slug="recovery-country")
        city = City.objects.create(country=country, name="Recovery City", slug="recovery-city")
        business = Business.objects.create(name="Recovery Business", country=country, city=city)
        user = get_user_model().objects.create_user(username="recovery@example.test", email="recovery@example.test", password=None, is_active=True)
        claim = BusinessClaimRequest.objects.create(
            listing=business, name="Recovery Owner", email=user.email, business_name=business.name,
            business_address="Main Street", business_post_code="1000", status="verified",
        )
        AccountVerificationToken.objects.create(user=user, claim=claim, expires_at=timezone.now() + timedelta(hours=1), used_at=timezone.now())
        requested = self.client.post("/api/account/password-reset/", {"email": user.email}, format="json")
        self.assertEqual(requested.status_code, 200)
        self.assertEqual(requested.data["detail"], "If an account exists for this email, we have sent instructions.")
        token = PasswordResetToken.objects.get(user=user)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(str(token.token), mail.outbox[0].body)
        self.assertEqual(get_user_model().objects.filter(email=user.email).count(), 1)
        reset = self.client.post("/api/account/password-reset/confirm/", {"token": str(token.token), "new_password": "safe-password-123", "confirm_password": "safe-password-123"}, format="json")
        self.assertEqual(reset.status_code, 200)
        user.refresh_from_db()
        self.assertTrue(user.has_usable_password())
        self.assertEqual(self.client.post("/api/dashboard/auth/", {"email": user.email, "password": "safe-password-123"}, format="json").status_code, 200)
        self.assertEqual(self.client.post("/api/account/password-reset/confirm/", {"token": str(token.token), "new_password": "another-password-123", "confirm_password": "another-password-123"}, format="json").status_code, 400)
        claim.refresh_from_db()
        self.assertEqual(claim.status, "verified")

    def test_password_reset_does_not_reveal_unverified_account(self):
        user = get_user_model().objects.create_user(username="unverified-recovery@example.test", email="unverified-recovery@example.test", password=None, is_active=True)
        AccountVerificationToken.objects.create(user=user, expires_at=timezone.now() + timedelta(hours=1))
        response = self.client.post("/api/account/password-reset/", {"email": user.email}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertFalse(PasswordResetToken.objects.filter(user=user).exists())

    def test_passworded_verified_account_can_use_recovery(self):
        user = get_user_model().objects.create_user(username="normal-recovery@example.test", email="normal-recovery@example.test", password="old-password-123", is_active=True)
        AccountVerificationToken.objects.create(user=user, expires_at=timezone.now() + timedelta(hours=1), used_at=timezone.now())
        self.assertEqual(self.client.post("/api/account/password-reset/", {"email": user.email}, format="json").status_code, 200)
        token = PasswordResetToken.objects.get(user=user)
        response = self.client.post("/api/account/password-reset/confirm/", {"token": str(token.token), "new_password": "new-password-123", "confirm_password": "new-password-123"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.client.post("/api/dashboard/auth/", {"email": user.email, "password": "new-password-123"}, format="json").status_code, 200)

    def test_signup_logout_and_fresh_login_work_before_email_confirmation(self):
        with patch("listings.api.dashboard.send_mail"):
            created = self.client.put("/api/dashboard/auth/", {"email": "fresh-login@example.test", "password": "safe-password-123"}, format="json")
        self.assertEqual(created.status_code, 201)
        user = get_user_model().objects.get(email="fresh-login@example.test")
        self.assertTrue(user.is_active)
        self.assertEqual(self.client.post("/api/dashboard/auth/", {"email": user.email, "password": "safe-password-123"}, format="json").status_code, 200)
        self.assertEqual(self.client.post("/api/dashboard/logout/").status_code, 200)
        self.assertIn(self.client.get("/api/dashboard/businesses/").status_code, (401, 403))
        self.assertEqual(self.client.post("/api/dashboard/auth/", {"email": user.email, "password": "safe-password-123"}, format="json").status_code, 200)

    def test_ai_capability_is_disabled_without_server_key(self):
        with patch.dict(os.environ, {"OPENAI_API_KEY": ""}, clear=False):
            response = self.client.get("/api/dashboard/ai-capabilities/")
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["suggestions"])
