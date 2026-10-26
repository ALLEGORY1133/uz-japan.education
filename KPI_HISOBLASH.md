# UzJapan KPI moduli — formulalar va integratsiya

## API va ruxsatlar
- `GET /api/admin/kpi/?month=YYYY-MM` — oylik KPI ma’lumotlari.
- `GET /api/admin/kpi/export/?month=YYYY-MM` — ayni filtrlangan hisobotni UTF-8 BOM bilan CSV eksport.
- Ikkala endpoint ham `IsPlatformAdmin` bilan himoyalangan; universitet vakillari boshqa xodimlarning reytingini ko‘ra olmaydi.
- Admin panelda `KPI samaradorligi` menyusi va `/kpi` sahifasi mavjud. Oy filtri, guruh filtri, kartalar, CSS ustunli grafik, reyting va CSV eksport qo‘shilgan.
- Yangi DB modeli/migratsiya kerak emas; mavjud `Application`, `ApplicationDocument`, `User`, `AuditLog` ma’lumotlaridan foydalaniladi.

## Davr
`month=YYYY-MM` bo‘yicha kalendar oy; parametr berilmasa joriy oy. Sana filtri boshlanish kuni kiradi, keyingi oyning birinchi kuni kirmaydi.

## Guruhlar va formulalar
1. **Qabul komissiyasi**: 40% muddat proksisi + 40% hujjatlar to‘liqligi + 20% hajm.
   - Muddat proksisi = arizalarning `submitted_at` dan `updated_at` gacha 3 kun ichida bo‘lgan ulushi; faqat statusi `reviewing/accepted/rejected` arizalar. `updated_at` birinchi ko‘rib chiqish vaqtini anglatmasligi mumkin, shuning uchun bu aniq SLA emas.
   - To‘liqlik = majburiy hujjat turlari (passport, diploma, transcript, motivation) mavjud topshirilgan arizalar ulushi.
   - Hajm = topshirilgan arizalar / 20 ta oylik maqsad, 100% bilan cheklanadi.
2. **Universitet vakillari**: audit tarixida qayd etilgan amallar / 10 ta oylik maqsad, 100% bilan cheklanadi. Bu ish sifati yoki tezligining to‘liq o‘lchovi emas.
3. **Kontent administratorlari**: audit tarixida qayd etilgan amallar / 20 ta oylik maqsad, 100% bilan cheklanadi. Sifat metrikasi hozirgi sxemada alohida saqlanmaydi.
4. **Tizim xavfsizligi**: yuklangan hujjatlar va audit hodisalari soni ko‘rsatiladi, ammo ball ataylab hisoblanmaydi. Antivirus natijalari hozir DB’da saqlanmaydi; skanlar natijasini yozadigan model qo‘shilmaguncha virus topilmagan deb 100% ko‘rsatish noto‘g‘ri bo‘lardi.

## Reyting
Faol platforma administratorlari va universitet vakillari uchun audit amallari bo‘yicha tartib; birinchi navbatda ball, keyin amal soni, keyin ism. Bu vaqtinchalik faoliyat reytingi, yakuniy xodim bahosi emas. Reyting faqat platforma administratoriga ochiq.

## Keyingi tavsiya etiladigan takomillashtirish
- `first_reviewed_at`, `resolved_at`, `reviewer`, `quality_check_passed` kabi aniq workflow maydonlari qo‘shish.
- Har bir antivirus skani uchun fayl ID, natija, imzo bazasi versiyasi va vaqtni saqlash; shundan keyingina xavfsizlik KPI foizini hisoblash.
- Xodimlarning ish topshiriqlari va sifat bahosini saqlash; aks holda amal soni sifatni bildirmaydi.
- KPI maqsadlarini kod ichida qotirib qo‘ymasdan admin sozlamasiga ko‘chirish.

## Yangilanish: xavfsizlik kartasi
Endi har bir hujjatning skan natijasi bazada saqlanadi (`ApplicationDocument.scan_status`, `lang_checked`).
"Tizim xavfsizligi" ko'rsatkichi = ClamAV "toza" deb topgan hujjatlar ulushi. Skaner o'chiq paytda yuklanganlari
alohida ("Skaner o'chiq paytda yuklangan") ko'rsatiladi. Virus topilgan fayllar saqlanmaydi.
