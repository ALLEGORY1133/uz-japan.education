# PROGRESS

Oxirgi yangilanish: 2026-10-27

## Tugagan
- Saytda bosh sahifa, universitetlar, yangiliklar, "Biz haqimizda" (fotorealistik banner, 3 tilli), talaba kabineti.
- Kabinet: faqat email bilan kirish (ixtiyoriy kod: `CABINET_REQUIRE_CODE=1`), ariza holati + murojaatlar va admin javoblari.
- Admin: arizalar (faqat o'qish, ZIP yuklash), murojaatlar + javob yuborish, KPI, login/parolni tiklash/bloklash.
- Yangi o'zbek alifbosi: sayt, admin, backend xabarlari, model nomlari, KPI, demo ma'lumotlar. `convert_alphabet` buyrug'i (bazadagi matnlar uchun).
- Fayl xavfsizligi (virus/skaner tekshiruvi), shriftlar serverda (@fontsource).
- Migratsiya `applications/0007_repair_missing_columns` (bazada `reply` ustuni yo'q bo'lgan 500 xatosi uchun).

- RBAC: 3 rol — platform_admin, university_rep, content_manager (Kontent menejeri: slayder, sayt media, yangilik/tadbir, statistika, media kutubxonasi; arizalar/murojaatlar/foydalanuvchilar/KPI/tarix/sozlamalar/universitetlarga KIRA OLMAYDI). Migratsiya accounts/0003. Oxirgi yangilanish: 2026-10-27.

## Ochiq / tekshirilmagan
- Haqiqiy `next build` va Postgres bilan sinalmagan (faqat sintaksis va mock).
- Paket nomlari (@fontsource-*) tekshirilmagan — `npm install` 404 bersa nomni to'g'rilash kerak.
- Alifbo o'tkazish avtomatik: so'zlarni ko'zdan kechirish kerak.
- `makemigrations` — model nomlari o'zgargani uchun bir marta ishga tushirib commit qilish.
- Bosh sahifa slayderiga yangi manzara qo'yilmagan (ixtiyoriy).

## Keyingi qadam
- `docker compose up --build -d`, so'ng admin Murojaatlar va kabinetni tekshirish; xato bo'lsa `docker compose logs backend --tail 80`.
