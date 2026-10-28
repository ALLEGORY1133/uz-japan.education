import os
from datetime import timedelta
from pathlib import Path

import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent


def env_list(name, default=""):
    return [x.strip() for x in os.environ.get(name, default).split(",") if x.strip()]


SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-insecure-key-change-me")
DEBUG = os.environ.get("DJANGO_DEBUG", "1") == "1"
ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", "*")

INSTALLED_APPS = [
    "modeltranslation",  # django.contrib.admin'dan oldin bo'lishi shart
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "django_filters",
    "apps.core",
    "apps.accounts",
    "apps.universities",
    "apps.content",
    "apps.applications",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "apps.core.middleware.ApiLanguageMiddleware",
    "apps.core.middleware.AuditContextMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
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

WSGI_APPLICATION = "config.wsgi.application"

# DATABASE_URL berilmasa SQLite ishlatiladi (testlar uchun qulay);
# docker-compose'da PostgreSQL beriladi.
DATABASES = {
    "default": dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}", conn_max_age=60
    )
}

AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# --- Tillar (UZ asosiy, JA va EN qo'shimcha) ---
LANGUAGE_CODE = "uz"
LANGUAGES = [("uz", "Özbekça"), ("ja", "日本語"), ("en", "English")]
MODELTRANSLATION_DEFAULT_LANGUAGE = "uz"
MODELTRANSLATION_LANGUAGES = ("uz", "ja", "en")
# Tarjima bo'sh bo'lsa: avval UZ, keyin EN, keyin JA ko'rsatiladi
MODELTRANSLATION_FALLBACK_LANGUAGES = ("uz", "en", "ja")
# Majburiy maydonlar uchun kamida o'zbekcha matn shart; JA va EN ixtiyoriy
MODELTRANSLATION_REQUIRED_LANGUAGES = ("uz",)

TIME_ZONE = "Asia/Tashkent"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = Path(os.environ.get("DJANGO_MEDIA_ROOT", BASE_DIR / "media"))
# Shaxsiy hujjatlar (pasport, diplom...) — MEDIA_URL'dan TASHQARIDA, ommaviy berilmaydi
# Virus skaneri (ClamAV). CLAMAV_HOST bo'sh bo'lsa skaner o'chiriladi (faqat mahalliy sinov uchun).
CLAMAV_HOST = os.environ.get("CLAMAV_HOST", "")
CLAMAV_PORT = int(os.environ.get("CLAMAV_PORT", "3310"))
CLAMAV_REQUIRED = os.environ.get("CLAMAV_REQUIRED", "1") not in ("0", "false", "False", "")
CLAMAV_TIMEOUT = float(os.environ.get("CLAMAV_TIMEOUT", "25"))
PRIVATE_ROOT = Path(os.environ.get("DJANGO_PRIVATE_ROOT", BASE_DIR / "private"))

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Katta video yuklash uchun (fayl hajmi modellarda alohida tekshiriladi)
DATA_UPLOAD_MAX_MEMORY_SIZE = 20 * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_FILTER_BACKENDS": ["django_filters.rest_framework.DjangoFilterBackend"],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 100,
    "DEFAULT_THROTTLE_RATES": {
        "applications": os.environ.get("THROTTLE_APPLICATIONS", "10/hour"),
        "login": os.environ.get("THROTTLE_LOGIN", "60/hour"),
        "pwreset": os.environ.get("THROTTLE_PWRESET", "5/hour"),
        "pwreset_confirm": os.environ.get("THROTTLE_PWRESET_CONFIRM", "20/hour"),
        "cabinet": os.environ.get("THROTTLE_CABINET", "20/hour"),
        "cabinet_verify": os.environ.get("THROTTLE_CABINET_VERIFY", "30/hour"),
        "cabinet_read": os.environ.get("THROTTLE_CABINET_READ", "600/hour"),
        "inquiries": os.environ.get("THROTTLE_INQUIRIES", "10/hour"),
        "assistant": os.environ.get("THROTTLE_ASSISTANT", "120/hour"),
        "app_docs": os.environ.get("THROTTLE_APP_DOCS", "300/hour"),
    },
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": False,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

from corsheaders.defaults import default_headers

CORS_ALLOW_HEADERS = (*default_headers, "x-cabinet-token")
CORS_ALLOWED_ORIGINS = env_list(
    "CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001"
)
# localhost va 127.0.0.1 bir xil kompyuter: ikkalasidan ochilganda ham CORS ishlasin.
_twins = []
for _o in CORS_ALLOWED_ORIGINS:
    if "://localhost" in _o:
        _twins.append(_o.replace("://localhost", "://127.0.0.1"))
    elif "://127.0.0.1" in _o:
        _twins.append(_o.replace("://127.0.0.1", "://localhost"))
CORS_ALLOWED_ORIGINS = list(dict.fromkeys([*CORS_ALLOWED_ORIGINS, *_twins]))
CSRF_TRUSTED_ORIGINS = env_list("CSRF_TRUSTED_ORIGINS", "")

EMAIL_BACKEND = os.environ.get(
    "EMAIL_BACKEND", "django.core.mail.backends.console.EmailBackend"
)
EMAIL_HOST = os.environ.get("EMAIL_HOST", "")
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", "587"))
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = os.environ.get("EMAIL_USE_TLS", "1") == "1"
ADMIN_URL = os.environ.get("PUBLIC_ADMIN_URL", "http://127.0.0.1:3011")  # parol tiklash havolasi shu manzilga yuboriladi
PASSWORD_RESET_TIMEOUT = int(os.environ.get("PASSWORD_RESET_TIMEOUT", "3600"))  # soniya
CABINET_REQUIRE_CODE = os.environ.get("CABINET_REQUIRE_CODE", "0")  # 1 — emailga kod yuboriladi
PUBLIC_WEB_URL = os.environ.get("PUBLIC_WEB_URL", "http://127.0.0.1:3010")
LOGIN_MAX_FAILS = int(os.environ.get("LOGIN_MAX_FAILS", "5"))
LOGIN_LOCK_MINUTES = int(os.environ.get("LOGIN_LOCK_MINUTES", "15"))
DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", "UzJapan Education <noreply@uzjapan.local>")

if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
