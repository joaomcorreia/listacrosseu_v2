from listacrosseu_backend.settings import *

if "corsheaders" not in INSTALLED_APPS:
    INSTALLED_APPS = ["corsheaders", *INSTALLED_APPS]

if "corsheaders.middleware.CorsMiddleware" not in MIDDLEWARE:
    MIDDLEWARE = ["corsheaders.middleware.CorsMiddleware", *MIDDLEWARE]
