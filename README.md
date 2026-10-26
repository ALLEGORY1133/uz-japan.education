# UzJapan Education

O‘zbekiston va Yaponiya universitetlari o‘rtasidagi ta’lim aloqalari platformasi.
**Django REST Framework + Next.js + PostgreSQL**, tillar: UZ / JA / EN.

| Servis | Port | Vazifasi |
|---|---|---|
| `web` | 3000 | Ommaviy sayt (ro‘yxatdan o‘tish yo‘q) |
| `admin` | 3001 | Boshqaruv paneli (alohida ilova, login bilan) |
| `backend` | 8000 | DRF API (`/api/public/…`, `/api/admin/…`) |
| `db` | — | PostgreSQL 16 |

## Ishga tushirish

```bash
cp .env.example .env        # parol va kalitlarni o‘zgartiring
docker compose up --build
```

- Sayt: http://localhost:3000 (avtomatik `/uz`, `/ja`, `/en`)
- Admin: http://localhost:3001 — demo kirish `admin` / `admin12345`; universitet vakili `kyoto_rep` / `rep12345`
- API: http://localhost:8000/api/health/

`SEED_DEMO=1` bo‘lsa, birinchi ishga tushishda demo ma’lumotlar yaratiladi (6 universitet, slaydlar, yangiliklar…). Productionda `SEED_DEMO=0`, `DJANGO_DEBUG=0` qiling va admin parolini almashtiring.

### Migratsiyalar
Repoda migratsiya fayllari hali yo‘q. Birinchi ishga tushishda `makemigrations` avtomatik bajariladi va fayllar `backend/apps/*/migrations/` ga yoziladi (compose shu papkani host bilan ulaydi). **Ularni git’ga qo‘shing.**

## Rollar
- `platform_admin` — hamma narsa: universitetlar, slayder, media, yangiliklar, statistika, foydalanuvchilar.
- `university_rep` — faqat o‘z universiteti: ma’lumotlar, muddatlar, kontrakt/grant, talablar, yo‘nalishlar, rasm/video, havolalar, kelgan arizalar.

## Admin imkoniyatlari
- Har bir rasm/video tartibi ↑ ↓ tugmalari bilan belgilanadi (slayder, galereya, havolalar, statistika).
- Har bir universitetga rasmiy sayt havolasi (chiroyli blok), qabul sahifasi va foydali havolalar qo‘shiladi.
- Yangiliklar ichki matn yoki tashqi manba havolasiga ega bo‘lishi mumkin.
- Barcha matnlar uch tilda (UZ majburiy, JA/EN ixtiyoriy; yo‘q bo‘lsa uz→en→ja zaxira).

## Eslatmalar
- Ariza yuborish: `POST /api/public/applications/` (soatiga 10 ta, honeypot himoyasi). Universitetning `contact_email` manziliga xabar ketadi (SMTP: `EMAIL_*` o‘zgaruvchilari; aks holda konsolga).
- Admin tokenlari brauzer `localStorage`’ida saqlanadi (access 30 daq, refresh 7 kun).
- Rasm maydonini tozalab bo‘lmaydi, faqat almashtiriladi.
- Productionda `PUBLIC_API_URL`, `PUBLIC_WEB_URL`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`, `DJANGO_ALLOWED_HOSTS` ni haqiqiy domenlarga o‘rnating va media uchun nginx/S3 ishlating.
- `docs/API.md` — API tavsifi.

## Lokal (Docker’siz)
```bash
cd backend && pip install -r requirements.txt && python manage.py makemigrations && python manage.py migrate && python manage.py seed_demo && python manage.py runserver
cd web   && cp .env.example .env.local && npm i && npm run dev     # :3000
cd admin && cp .env.example .env.local && npm i && npm run dev     # :3001
```

## Yangi o'zbek alifbosi
Matnlar yangi alifboga (ö ğ ş ç ’) o'tkazilgan. Model nomlari o'zgargani uchun bir marta `python manage.py makemigrations` ishga tushirib, chiqqan migratsiyani commit qiling (bazaga ta'siri yo'q).
Bazada oldindan kiritilgan o'zbekcha matnlar uchun: `python manage.py convert_alphabet --dry-run`, so'ng `python manage.py convert_alphabet`.
