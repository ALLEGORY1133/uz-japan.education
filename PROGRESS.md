# PROGRESS

Oxirgi yangilanish: 2026-10-29

## Tugagan
- Saytda bosh sahifa, universitetlar, yangiliklar, "Biz haqimizda" (fotorealistik banner, 3 tilli), talaba kabineti.
- Kabinet: faqat email bilan kirish (ixtiyoriy kod: `CABINET_REQUIRE_CODE=1`), ariza holati + murojaatlar va admin javoblari.
- Admin: arizalar (faqat o'qish, ZIP yuklash), murojaatlar + javob yuborish, KPI, login/parolni tiklash/bloklash.
- Yangi o'zbek alifbosi: sayt, admin, backend xabarlari, model nomlari, KPI, demo ma'lumotlar. `convert_alphabet` buyrug'i (bazadagi matnlar uchun).
- Fayl xavfsizligi (virus/skaner tekshiruvi), shriftlar serverda (@fontsource).
- Migratsiya `applications/0007_repair_missing_columns` (bazada `reply` ustuni yo'q bo'lgan 500 xatosi uchun).

- RBAC: 3 rol — platform_admin, university_rep, content_manager (Kontent menejeri: slayder, sayt media, yangilik/tadbir, statistika, media kutubxonasi; arizalar/murojaatlar/foydalanuvchilar/KPI/tarix/sozlamalar/universitetlarga KIRA OLMAYDI). Migratsiya accounts/0003. Oxirgi yangilanish: 2026-10-27.
- Yordamchi (AI'siz, qoidalar + qidiruv): backend/apps/assistant (engine.py, views.py). `POST /api/public/assistant/` (mehmonlar, ochiq ma'lumot, uz/en/ja) va `POST /api/admin/assistant/` (rolga qarab: admin hammasi, vakil o'z universiteti, menejer faqat kontent). Veb: components/Assistant.tsx + assistant.css; admin: components/AdminAssistant.tsx. Keyin LLM ulash mumkin (engine natijasini modelga berish).
- Dinamik RBAC: superadmin admin paneldagi «Rollar» sahifasida rol yaratadi va bo'limlar bo'yicha Ko'rish/Tahrirlash beradi (bo'limlar: arizalar, murojaatlar, KPI, slayder, sayt media, media kutubxonasi, yangilik, statistika, sozlamalar, tarix). Foydalanuvchi formasida bitta «Rol» ro‘yxati (tayyor rollar + yaratilgan rollar, `/roles/options/`, `role_key`). Backend: accounts/rbac.py, roles_api.py, core/permissions.SectionPermission; migratsiya accounts/0004_roles. Foydalanuvchilar va rollarni boshqarish faqat platform_admin. Login endi has_panel_access bo'yicha (avval kontent menejeri kira olmasdi — tuzatildi).
- Admin: fayl yuklash jarayoni (UploadTray): foiz, MB, tezlik, qolgan vaqt, bekor qilish, «server tekshirmoqda» holati. lib/api.ts XHR orqali (`uzj-upload` hodisasi). Faqat adminda; saytdagi ariza hujjatlari yuklashida hali yo'q.
- Qabul holati sanalar bo'yicha: `University.effective_status` (boshlanish sanasi kelmagan → «Tez orada», muddat o'tgan → «Yopiq»). Public API `admission_status` shuni qaytaradi; web'da ariza tugmasi/formasi faqat `open` da, `soon` da «Ariza qabuli boshlanadi: sana» ko'rsatiladi; backend ham arizani rad etadi.
- Media izohlari (caption) rasm/video ustida animatsiya bilan (MediaView `.mv-cap`).
- Admin kiritgan `*_uz` matnlar saqlashda avtomatik yangi alifboga o'tadi (core/apps.py pre_save + alphabet.normalize_instance, havola/email'ga tegmaydi); entrypoint har ishga tushganda `convert_alphabet` ham ishlaydi.
- Yordamchi qidiruvi yaxshilandi: fold x/h, q/k, w/v; universitet nomi bo'yicha so'z/prefiks/yaqin yozilish (jahon, milliy, milli), bir nechta mos kelsa hammasini ko'rsatadi; yo'nalish/talab/yangilik/tavsif bo'yicha umumiy qidiruv; «qachon boshlanadi» intenti.
- Bosh sahifa v2 (web/src/app/home2.css, components/Carousel.tsx): statistika hero tagida kartalar; bo'limlar ketma-ket (#students, #cooperation, #exchange), har biri animatsiyali karusel (scroll-snap, avto-aylanish, nuqtalar); universitetlar karuseli (banner/brend gradient, holat) + Marquee; yangiliklar karuseli (rasm yoki video, `news.video` API maydoni). Footerga «Foydali havolalar» ustuni (admin havolalari + JASSO/MEXT/JICA). Faqat sintaksis tekshirilgan, haqiqiy next build qilinmagan.
- Admin: nav'da «Sozlamalar» (avval «Aloqa va tarmoqlar») + kichik admin footer (Shell.tsx, skin.css `.admin-foot`).
- CORS: localhost va 127.0.0.1 juftligi avtomatik ruxsat (127.0.0.1:3011 dan login osilib qolardi). Backend qayta ishga tushirilsin.
- Gunicorn endi gthread (3 worker x 4 thread): sync worker brauzerning bo'sh preconnect ulanishlarida osilib qolardi (admin login/me/ javobsiz, curl esa ishlardi). Dockerfile CMD.
- Qaltirash tuzatildi (web+admin `steady.css`, oxirida import): hover/tilt'da element o'zi siljimaydi (kursor chekkada turganda titrash sababi: element qochib-qaytishi va 3D tilt teskari aloqasi). Soya/rang/ichki animatsiya qoldi. Brauzerda tekshirilmagan.
- Bosh sahifa v3 (home3.css, lib/demo.ts, public/demo/): rasm/video markazida. Hero → statistika kartalari → harakatdagi galereya lentasi → video band (sakura.mp4, matn ustida) → rasm ustida matnli karusel kartalar (talaba kabineti, universitetlar, yangiliklar; avto-aylanish 3.0–3.4 s) → onlayn ariza bandi (lanterns.mp4 fon). Demo tasvirlar (12 jpg + 2 mp4, ~1.5 MB) o'zim chizgan illyustratsiyalar (real foto emas — sandbox internetdan yuklay olmaydi); admin yuklagan rasm/banner/cover ustun turadi, yo'q joyda demo chiqadi (country/category bo'yicha). Skrinshot (SSR harness) bilan 1440 va 390 px tekshirilgan; haqiqiy next build qilinmagan.
- Real foto/video qo'yish: admin panelda universitet banner, yangilik cover/video, sayt media.
- Admin «Sayt rasm va videolari» endi joylar (slot) ko'rinishida: video_band, apply_bg, students_card, gallery_1..12; har birida joriy rasm (yoki demo), «Yuklash/Almashtirish», «Standartga qaytarish» + yo'riqnoma. Backend: SiteMedia.Key kengaytirildi, migratsiya content/0005_sitemedia_keys. Web home shu joylardan oladi, yo'q bo'lsa demo.
- Yangiliklar bosh sahifadan olib tashlandi; /news sahifasi tepasida karusel (rasm/video, demo fallback). NewsCard ham demo fallback ishlatadi.
- Footer ixcham: asosiy menyu ustuni olib tashlandi; faqat brend+tarmoqlar, foydali havolalar, aloqa, pastki qator.
- Haqiqiy fotosuratlar: sandbox foto saytlariga (Unsplash/Pexels/Wikimedia) kira olmaydi — demo rasmlar chizilgan. Foydalanuvchi real foto yuklashi kerak (web/public/demo/README.md).

## Ochiq / tekshirilmagan
- Yordamchi mantiqi soxta (stub) ma'lumot bilan sinalgan, haqiqiy Django/DB bilan emas.
- Haqiqiy `next build` va Postgres bilan sinalmagan (faqat sintaksis va mock).
- Paket nomlari (@fontsource-*) tekshirilmagan — `npm install` 404 bersa nomni to'g'rilash kerak.
- Alifbo o'tkazish avtomatik: so'zlarni ko'zdan kechirish kerak.
- `makemigrations` — model nomlari o'zgargani uchun bir marta ishga tushirib commit qilish.
- Bosh sahifa slayderiga yangi manzara qo'yilmagan (ixtiyoriy).

## Keyingi qadam
- `docker compose up --build -d`, so'ng admin Murojaatlar va kabinetni tekshirish; xato bo'lsa `docker compose logs backend --tail 80`.
