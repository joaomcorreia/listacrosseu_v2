import os
from pathlib import Path
from urllib.parse import unquote, urlparse

from django.core.exceptions import ImproperlyConfigured


BASE_DIR = Path(__file__).resolve().parents[2]


TRUE_VALUES = {"1", "true", "yes", "on"}
FALSE_VALUES = {"0", "false", "no", "off"}


def get_env(name: str, default: str | None = None, required: bool = False) -> str:
    value = os.environ.get(name, default)
    if required and (value is None or str(value).strip() == ""):
        raise ImproperlyConfigured(f"Environment variable {name} is required.")
    if value is None:
        return ""
    return str(value).strip()


def get_env_bool(name: str, default: bool = False) -> bool:
    raw_value = os.environ.get(name)
    if raw_value is None or str(raw_value).strip() == "":
        return default
    normalized = str(raw_value).strip().lower()
    if normalized in TRUE_VALUES:
        return True
    if normalized in FALSE_VALUES:
        return False
    raise ImproperlyConfigured(
        f"Environment variable {name} must be one of: {sorted(TRUE_VALUES | FALSE_VALUES)}"
    )


def get_env_int(name: str, default: int) -> int:
    raw_value = os.environ.get(name)
    if raw_value is None or str(raw_value).strip() == "":
        return default
    try:
        return int(str(raw_value).strip())
    except ValueError as exc:
        raise ImproperlyConfigured(f"Environment variable {name} must be an integer.") from exc


def get_env_list(name: str, default: list[str] | None = None) -> list[str]:
    raw_value = os.environ.get(name)
    if raw_value is None or str(raw_value).strip() == "":
        return list(default or [])
    return [item.strip() for item in str(raw_value).split(",") if item.strip()]


def build_database_config(database_url: str, conn_max_age: int, ssl_require: bool) -> dict:
    parsed = urlparse(database_url)
    scheme = parsed.scheme.lower()

    if scheme in {"sqlite", "sqlite3"}:
        sqlite_path = unquote(parsed.path)
        if parsed.netloc:
            sqlite_path = f"//{parsed.netloc}{parsed.path}"
        elif sqlite_path.startswith("//"):
            # sqlite:////var/... is the standard URL form for an absolute
            # Unix path. Normalize the doubled URL slash to one filesystem
            # root slash instead of turning the path into a relative path.
            sqlite_path = "/" + sqlite_path.lstrip("/")
        elif os.name == "nt" and len(sqlite_path) >= 3 and sqlite_path[1:3] == ":/":
            sqlite_path = sqlite_path[1:]
        return {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": sqlite_path,
            "CONN_MAX_AGE": conn_max_age,
            "CONN_HEALTH_CHECKS": True,
        }

    if scheme in {"postgres", "postgresql"}:
        config = {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": unquote(parsed.path.lstrip("/")),
            "USER": unquote(parsed.username or ""),
            "PASSWORD": unquote(parsed.password or ""),
            "HOST": parsed.hostname or "",
            "PORT": str(parsed.port or ""),
            "CONN_MAX_AGE": conn_max_age,
            "CONN_HEALTH_CHECKS": True,
        }
        if ssl_require:
            config["OPTIONS"] = {"sslmode": "require"}
        return config

    raise ImproperlyConfigured(
        "DATABASE_URL must use sqlite, sqlite3, postgres, or postgresql."
    )


DEBUG = get_env_bool("DJANGO_DEBUG", default=True)

SECRET_KEY = get_env(
    "DJANGO_SECRET_KEY",
    default="dev-only-secret-key-change-me" if DEBUG else None,
    required=not DEBUG,
)

ALLOWED_HOSTS = get_env_list(
    "DJANGO_ALLOWED_HOSTS",
    default=["127.0.0.1", "localhost"] if DEBUG else [],
)

CSRF_TRUSTED_ORIGINS = get_env_list(
    "DJANGO_CSRF_TRUSTED_ORIGINS",
    default=["http://127.0.0.1:3004"] if DEBUG else [],
)

CORS_ALLOWED_ORIGINS = get_env_list(
    "DJANGO_CORS_ALLOWED_ORIGINS",
    default=["http://127.0.0.1:3004"] if DEBUG else [],
)

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGIN_REGEXES = get_env_list(
    "DJANGO_CORS_ALLOWED_ORIGIN_REGEXES",
    default=[r"^https?://[a-z0-9-]+\.listacross\.local:3004$"] if DEBUG else [],
)

PUBLIC_SITE_URL = get_env(
    "NEXT_PUBLIC_SITE_URL",
    default="http://127.0.0.1:3004" if DEBUG else "",
)
FRONTEND_SITE_URL = PUBLIC_SITE_URL.rstrip("/")

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

STAGING_NOINDEX = get_env_bool("STAGING_NOINDEX", default=False)
EXPOSE_PUBLIC_DEBUG_ENDPOINTS = get_env_bool("EXPOSE_PUBLIC_DEBUG_ENDPOINTS", default=DEBUG)
ENABLE_VISUAL_HOMEPAGE_EDITOR = get_env_bool(
    "ENABLE_VISUAL_HOMEPAGE_EDITOR",
    default=DEBUG,
)
# Deliberately disabled by default. This is a local-only test hook until the
# billing system exposes an authoritative first-paid-month entitlement.
GENERATED_WEBSITE_ATTRIBUTION_TEST_ELIGIBLE = (
    DEBUG and get_env_bool("GENERATED_WEBSITE_ATTRIBUTION_TEST_ELIGIBLE", default=False)
)

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sitemaps",
    "rest_framework",
    "anymail",
    "corsheaders",
    "django_filters",
    "listings",
    "hero_settings",
    "content",
    "ui",
    "blog",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "listacrosseu_backend.middleware.NoIndexMiddleware",
]

ROOT_URLCONF = "listacrosseu_backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "listacrosseu_backend.wsgi.application"
ASGI_APPLICATION = "listacrosseu_backend.asgi.application"

DEFAULT_DB_PATH = Path(get_env("DJANGO_SQLITE_PATH", default=str(BASE_DIR / "db.sqlite3")))
DEFAULT_DATABASE_URL = f"sqlite:///{DEFAULT_DB_PATH.as_posix()}"
DATABASES = {
    "default": build_database_config(
        get_env("DATABASE_URL", default=DEFAULT_DATABASE_URL),
        conn_max_age=get_env_int("DATABASE_CONN_MAX_AGE", default=600),
        ssl_require=get_env_bool("DATABASE_SSL_REQUIRE", default=False),
    )
}

EMAIL_BACKEND = get_env(
    "EMAIL_BACKEND",
    default="django.core.mail.backends.console.EmailBackend" if DEBUG else "django.core.mail.backends.smtp.EmailBackend",
)
ANYMAIL = {
    "RESEND_API_KEY": get_env("RESEND_API_KEY", default=""),
}
EMAIL_HOST = get_env("EMAIL_HOST", default="")
EMAIL_PORT = get_env_int("EMAIL_PORT", default=587)
EMAIL_HOST_USER = get_env("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = get_env("EMAIL_HOST_PASSWORD", default="")
EMAIL_USE_TLS = get_env_bool("EMAIL_USE_TLS", default=True)
EMAIL_USE_SSL = get_env_bool("EMAIL_USE_SSL", default=False)
DEFAULT_FROM_EMAIL = get_env("DEFAULT_FROM_EMAIL", default="noreply@example.com")
SERVER_EMAIL = get_env("SERVER_EMAIL", default=DEFAULT_FROM_EMAIL)

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en"
LANGUAGES = [
    ("en", "English"),
    ("fr", "Francais"),
    ("nl", "Nederlands"),
    ("pt", "Portugues"),
    ("de", "Deutsch"),
    ("es", "Espanol"),
    ("ar", "Arabic"),
]

TIME_ZONE = get_env("DJANGO_TIME_ZONE", default="UTC")
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = get_env("STATIC_ROOT", default=str(BASE_DIR / "staticfiles"))
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

MEDIA_URL = "/media/"
MEDIA_ROOT = get_env("MEDIA_ROOT", default=str(BASE_DIR / "media"))

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework.authentication.BasicAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
    ],
}

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = get_env_bool("DJANGO_USE_X_FORWARDED_HOST", default=True)

SESSION_COOKIE_SECURE = get_env_bool("DJANGO_SESSION_COOKIE_SECURE", default=not DEBUG)
CSRF_COOKIE_SECURE = get_env_bool("DJANGO_CSRF_COOKIE_SECURE", default=not DEBUG)
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = False
SESSION_COOKIE_SAMESITE = get_env("DJANGO_SESSION_COOKIE_SAMESITE", default="Lax")
CSRF_COOKIE_SAMESITE = get_env("DJANGO_CSRF_COOKIE_SAMESITE", default="Lax")

SECURE_SSL_REDIRECT = get_env_bool("DJANGO_SECURE_SSL_REDIRECT", default=not DEBUG)
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = "DENY"
SECURE_REFERRER_POLICY = get_env("DJANGO_SECURE_REFERRER_POLICY", default="strict-origin-when-cross-origin")
SECURE_HSTS_SECONDS = get_env_int("DJANGO_SECURE_HSTS_SECONDS", default=0 if DEBUG else 31536000)
SECURE_HSTS_INCLUDE_SUBDOMAINS = get_env_bool(
    "DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS",
    default=not DEBUG,
)
SECURE_HSTS_PRELOAD = get_env_bool("DJANGO_SECURE_HSTS_PRELOAD", default=False)

LOG_LEVEL = get_env("DJANGO_LOG_LEVEL", default="DEBUG" if DEBUG else "INFO")
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "standard": {
            "format": "%(asctime)s %(levelname)s %(name)s %(message)s",
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "standard",
        }
    },
    "root": {
        "handlers": ["console"],
        "level": LOG_LEVEL,
    },
    "loggers": {
        "django.request": {
            "handlers": ["console"],
            "level": LOG_LEVEL,
            "propagate": False,
        },
        "django.security": {
            "handlers": ["console"],
            "level": LOG_LEVEL,
            "propagate": False,
        },
    },
}
