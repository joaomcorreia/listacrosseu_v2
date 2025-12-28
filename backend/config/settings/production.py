from .base import *

DEBUG = False

ALLOWED_HOSTS = [
    "31.97.36.47",
    "api.listacross.eu",
    "listacross.eu",
]

CORS_ALLOWED_ORIGINS = [
    "https://listacross.eu",
    "https://www.listacross.eu",
    "https://listacrosseu-v2.vercel.app",
]

CORS_ALLOW_CREDENTIALS = True

STATIC_ROOT = "/home/listacross.eu/public_html/static/"
MEDIA_ROOT = "/home/listacross.eu/public_html/media/"
