from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F401,F403


DEBUG = False

if SECRET_KEY == "dev-only-secret-key-change-me":
    raise ImproperlyConfigured("DJANGO_SECRET_KEY must be set for production.")

if not ALLOWED_HOSTS:
    raise ImproperlyConfigured("DJANGO_ALLOWED_HOSTS must be set for production.")

if not CSRF_TRUSTED_ORIGINS:
    raise ImproperlyConfigured("DJANGO_CSRF_TRUSTED_ORIGINS must be set for production.")

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_SSL_REDIRECT = get_env_bool("DJANGO_SECURE_SSL_REDIRECT", default=True)
SECURE_HSTS_SECONDS = get_env_int("DJANGO_SECURE_HSTS_SECONDS", default=31536000)
SECURE_HSTS_INCLUDE_SUBDOMAINS = get_env_bool(
    "DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS",
    default=True,
)
SECURE_HSTS_PRELOAD = get_env_bool("DJANGO_SECURE_HSTS_PRELOAD", default=False)
