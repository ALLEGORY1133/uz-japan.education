#!/bin/sh
set -e

# Birinchi ishga tushirishda migratsiyalar yo'q bo'lsa — yaratadi.
# Yaratilgan fayllarni (backend/apps/*/migrations/) git'ga qo'shib qo'ying.
python manage.py makemigrations --noinput
python manage.py migrate --noinput

if [ "${SEED_DEMO:-0}" = "1" ]; then
  python manage.py seed_demo
fi

exec "$@"
