#!/bin/sh
set -e

# Birinchi ishga tushirishda migratsiyalar yo'q bo'lsa — yaratadi.
# Yaratilgan fayllarni (backend/apps/*/migrations/) git'ga qo'shib qo'ying.
# Bir nechta 'leaf' migratsiya to'qnashuvi bo'lsa (papkalar aralashib ketganda) — avtomatik birlashtiradi.
python manage.py makemigrations --merge --noinput || true
python manage.py makemigrations --noinput
python manage.py migrate --noinput
# Bazadagi eski alifbodagi o'zbekcha matnlarni yangi alifboga o'tkazadi (qayta ishga tushirsa ham xavfsiz).
python manage.py convert_alphabet || true

if [ "${SEED_DEMO:-0}" = "1" ]; then
  python manage.py seed_demo
fi

exec "$@"
