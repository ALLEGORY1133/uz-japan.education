# UzJapan Education — API shartnomasi

Backend: Django REST Framework, `http://localhost:8000`. Interaktiv hujjat (ishga tushgach): `/api/docs/`.

## Umumiy qoidalar

- **Tillar:** `uz` (asosiy), `en`, `ja`. Ochiq API (`/api/v1/*`) matn maydonlarini **bitta til matni** sifatida qaytaradi: `?lang=uz|en|ja` (yoki `Accept-Language`). Til bo'sh bo'lsa `uz`ga qaytadi. `?lang=all` — `{uz,en,ja}` lug'ati.
- **Admin API** (`/api/admin/*`) ko'p tilli maydonlarni **har doim lug'at** sifatida qaytaradi va qabul qiladi: `{"uz": "...", "en": "...", "ja": "..."}`.
- **Ko'p tilli maydonlar** (quyida `i18n` deb belgilangan). multipart so'rovda ular **JSON satr** sifatida yuboriladi: `title={"uz":"...","en":"..."}`.
- **Fayllar:** `ImageField`/`FileField` ochiq API'da to'liq URL (`http://localhost:8000/media/...`) yoki `""`. Yuklash — `multipart/form-data`. Faylni o'chirish: `clear_files=image,video` (vergul bilan) maydonini yuborish (PATCH).
- **Sanalar:** `YYYY-MM-DD`; `published_at` — ISO 8601.
- **Pagination yo'q** — ro'yxatlar oddiy massiv.
- **Xatolar:** DRF standarti: `400 {"field": ["xabar"]}`, `401`, `403`, `404`.
- **CORS:** `http://localhost:5173` (ochiq sayt) va `http://localhost:5174` (admin).

## Autentifikatsiya (faqat admin panel uchun)

| Metod | URL | Tavsif |
|---|---|---|
| POST | `/api/auth/token/` | `{username, password}` → `{access, refresh}` |
| POST | `/api/auth/token/refresh/` | `{refresh}` → `{access}` |
| GET | `/api/admin/me/` | `{id, username, email, role: "admin"|"rep", university: {id, slug, name:{uz,en,ja}} | null}` |

Header: `Authorization: Bearer <access>`. Access 2 soat, refresh 7 kun.

**Rollar:** `admin` — hamma narsa. `rep` (universitet vakili) — faqat o'z universiteti va unga bog'langan yozuvlar (talablar, yo'nalishlar, galereya, havolalar, yangiliklar, arizalar). Vakil quyidagilarni **ko'rmaydi/o'zgartira olmaydi**: bosh sahifa slayderi, media slotlar, statistika, sayt sozlamalari, aloqa xabarlari, universitet yaratish/o'chirish, `slug/is_published/order/country`. Taqiqlangan so'rov `403` qaytaradi.

## Ochiq API — `/api/v1/` (autentifikatsiyasiz)

### `GET /home/`
Bosh sahifa uchun bitta so'rov:
```
{
  hero_slides: HeroSlide[], universities: UniversityListItem[], stats: StatItem[],
  useful_links: UsefulLink[], news: News[] (oxirgi 6 ta), media_slots: MediaSlot[], settings: SiteSettings
}
```

### Ob'ekt shakllari (ochiq API, `lang` bo'yicha hal qilingan)

**HeroSlide** `{id, order, theme: "japan"|"uzbek"|"exchange", eyebrow, title, subtitle, primary_label, primary_url, secondary_label, secondary_url, media_kind: "image"|"video", image, video, video_url, is_visible}` — matnlar `i18n`; `image/video` fayl URL yoki `""`. `media_kind="image"` va `image` bor bo'lsa — shu rasm fon; `video`/`video_url` bor bo'lsa — video fon; ikkalasi bo'sh bo'lsa — `theme` bo'yicha standart illyustratsiya.

**UniversityListItem** `{id, slug, name, short_name, country: "UZ"|"JP", city, logo, website_url, status: "open"|"closed"|"soon", admission_deadline, lat, lng, order}`

**University (detail)** — `GET /universities/{slug}/`:
`{id, slug, name, short_name, country, city, description, instruction_languages, website_url, admission_url, logo, banner, about_video_url, status, apply_mode: "platform"|"external", apply_url, admission_start, admission_deadline, results_date, term_start, fee, payment_terms, living_cost, grant_name, grant_coverage, grant_criteria, lat, lng, order, updated_at, requirements: [{id, university, text, order}], programs: [{id, university, level: "bachelor"|"master"|"doctoral", name, order}], gallery: [{id, university, kind: "image"|"video", file, video_url, caption, order}], links: UsefulLink[]}`
Bo'sh (`""`/`null`) maydonlar — frontend `[…]` o'rin egallovchi ko'rsatadi.

**UsefulLink** `{id, university, title, description, url, kind: "external"|"internal", icon, is_published, order}` — `kind="external"` → yangi oynada, ↗ belgisi bilan.

**News** `{id, university, category: "news"|"partnership"|"event", title, summary, body, cover, published_at, link_kind: "internal"|"external", link_url, source_name, event_date, location, is_published, order}`. `link_kind="external"` bo'lsa `link_url`ga o'tadi; `internal` bo'lsa `/news/{id}` sahifasi.

**StatItem** `{id, order, value: "50+", label}` **MediaSlot** `{id, key, label, page_hint, kind, file, video_url, alt, updated_at}`. Kalitlar: `students_card`, `partnership_card`, `online_video`, `news_cover_default`, `university_banner_default`.

**SiteSettings** `{contact_email, contact_phone, address, telegram_url, youtube_url, linkedin_url, instagram_url}`

### Boshqa ochiq endpointlar
| Metod | URL | Izoh |
|---|---|---|
| GET | `/hero-slides/` | ko'rinadigan slaydlar, `order` bo'yicha |
| GET | `/universities/?country=JP&status=open` | ro'yxat (UniversityListItem) |
| GET | `/universities/{slug}/` | batafsil |
| GET | `/news/?category=event&university__slug=kyoto` , `/news/{id}/` | yangiliklar |
| GET | `/useful-links/?university__slug=kyoto` | parametrsiz — umumiy (bosh sahifa) havolalar |
| GET | `/stats/`, `/media-slots/`, `/media-slots/{key}/`, `/site-settings/` | |
| POST | `/applications/` | ariza: `{university (id), level: "bachelor|master|doctoral", funding: "contract|grant", first_name, last_name, email, phone}` → `201`. Soatiga 30 ta cheklov (`429`). |
| POST | `/contact/` | `{name, email, message}` → `201` |

## Admin API — `/api/admin/` (Bearer token kerak)

Hammasi standart REST (`GET list`, `POST`, `GET/PUT/PATCH/DELETE {id}`), JSON yoki multipart. Matn maydonlari `{uz,en,ja}` lug'ati. Tartiblanadigan resurslarda qo'shimcha: `POST .../reorder/` body `{"ids":[3,1,2]}` (JSON) → shu ketma-ketlikda `order=0,1,2`.

| Resurs | URL | Kim | Filtrlar |
|---|---|---|---|
| Universitetlar | `/universities/` | admin: hammasi; rep: faqat o'ziniki (yaratish/o'chirish — faqat admin) | `country`, `status`, `is_published` |
| Talablar | `/requirements/` | admin, rep (o'ziniki) | `university` |
| Yo'nalishlar | `/programs/` | admin, rep | `university`, `level` |
| Galereya (rasm/video) | `/gallery/` | admin, rep | `university`, `kind` |
| Havolalar | `/useful-links/` | admin (umumiy ham), rep (o'ziniki) | `university`, `university__isnull=true` |
| Yangiliklar | `/news/` | admin, rep (o'ziniki) | `university`, `university__isnull`, `category` |
| Bosh sahifa slayderi | `/hero-slides/` (+`reorder`) | faqat admin | |
| Media slotlar | `/media-slots/` | faqat admin | |
| Statistika | `/stats/` (+`reorder`) | faqat admin | |
| Sayt sozlamalari | `GET/PATCH /site-settings/` (yagona ob'ekt) | faqat admin | |
| Arizalar | `/applications/` (faqat `GET`, `PATCH` — `status`, `note`) | admin, rep (o'ziniki) | `university`, `status`, `level`, `funding` |
| Aloqa xabarlari | `/messages/` (`GET`, `PATCH is_read`, `DELETE`) | faqat admin | `is_read` |
| Dashboard | `GET /dashboard/` | admin, rep | `{applications: {new, review, accepted, rejected}, applications_total, universities?, news?, unread_messages?}` |

Ariza statuslari: `new`, `review`, `accepted`, `rejected`.

Vakil uchun `university` maydoni so'rovda yuborilsa ham server uni o'z universitetiga majburlaydi.

## Namuna foydalanuvchilar (faqat ishlab chiqish; `python manage.py seed`)
`admin / admin12345` (platforma administratori), `kyoto_rep / rep12345` (Kyoto University vakili).

## Sahifa bo'limlari (CMS)
- `GET /api/public/blocks/` — admin o'zgartirgan bo'limlar: `{ "home.intro": {title:{uz,en,ja}, text:{…}, link_label:{…}, link_url, image, video}, … }`. Bo'sh maydon — sayt standart matnni ko'rsatadi.
- `GET /api/admin/pages/` — sahifalar → bo'limlar (qaysi maydonlar tahrirlanishi + joriy qiymatlar). Ruxsat: `pages` bo'limi.
- `PATCH /api/admin/pages/<key>/` — multipart yoki JSON: `title_uz|en|ja`, `text_*`, `link_label_*`, `link_url`, `image`, `video`, `clear_image=1`, `clear_video=1`.
- `DELETE /api/admin/pages/<key>/` — standartga qaytarish.
- Bo'limlar ro'yxati: `backend/apps/content/page_registry.py`.
