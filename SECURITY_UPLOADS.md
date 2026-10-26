# Yuklanadigan fayllar xavfsizligi

Tekshiruv tartibi (`backend/apps/applications/documents.py`, `security.py`):
1. Kengaytma (.pdf .jpg .jpeg .png .webp .docx), hajm (10 MB), magic-bytes, fayllar soni/umumiy hajm chegarasi.
2. ClamAV (INSTREAM, docker-compose'dagi `clamav` xizmati). `CLAMAV_REQUIRED=1` bo'lsa skaner ishlamasa yuklash rad etiladi (fail-closed). `CLAMAV_REQUIRED=0` — skaner yo'q bo'lsa o'tkazib yuboradi. `CLAMAV_HOST=` bo'sh — o'chirish. ClamAV ~1.5–2 GB RAM talab qiladi.
3. PDF: JavaScript, Launch, OpenAction, EmbeddedFile va boshqa faol kontent (`#xx` yashirish usullari ham) hamda tuzilma tekshiruvi (pypdf). DOCX: zip ichida makro/OLE/tashqi bog'lanishlar.
4. Rasmlar: Pillow bilan qayta ochilib tekshiriladi (JPEG/PNG/WEBP, ≤50 Mpx) va qayta saqlanadi (metadata/yashirin ma'lumot tozalanadi).
5. Motivatsion xat: faqat PDF/DOCX, matni ajratib olinadi va yapon tilida ekanligi tekshiriladi (harflar ≥100, yapon ulushi ≥60%, kana ≥30 va kana/yapon ≥12%).

Cheklovlar: skanerlangan (matnsiz) PDF motivatsion xat sifatida rad etiladi; til tekshiruvi — evristika, mazmun tekshiruvi emas; ClamAV hamma zararli fayllarni topa olmaydi.
Admin paneldan hujjatlarni tahrirlash/qo'shish/o'chirish olib tashlangan — faqat yuklab olish mumkin.
