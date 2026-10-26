# UzJapan Education — loyiha qoidalari

Stack: Django REST (backend/, port 8010) + Next.js 15 sayt (web/, 3010) + Next.js admin (admin/, 3011) + PostgreSQL, Docker Compose. Tillar: uz/ja/en.

## Ish tartibi
- Har bir kichik qadamdan keyin DARHOV `PROGRESS.md` ni yangila (nima tugadi, qaysi fayllar o'zgardi, keyingi qadam), keyin commit qil. Oxirida yangilashni kutma.
- Yangi sessiyada avval `PROGRESS.md` ni o'qib, shundan davom et.
- Foydalanuvchi bilan o'zbekcha, qisqa gaplash. Haqiqiy `next build`/Django ishga tushirilmagan bo'lsa, buni ochiq ayt.

## Qoidalar
- O'zbekcha matnlar YANGI alifboda: ö ğ ş ç ’ (oʻ→ö, gʻ→ğ, sh→ş, ch→ç). Kod, URL, class nomlari va en/ja matnlariga tegma.
- web/src/lib/i18n.ts: kalitlar 3 tilda (uz/en/ja) bo'lsin; uz — zaxira til.
- Model o'zgarsa migratsiya yoz va commit qil. Foydalanuvchi ma'lumoti (arizalar) bilan ehtiyot bo'l.
- Shriftlar @fontsource orqali (next/font/google ishlatma — Docker build'da internet yo'q).
- Tekshiruv: esbuild sintaksis (`/opt/npm-tools/node_modules/esbuild/bin/esbuild <fayl> --log-level=error`), Python uchun `ast.parse`.
