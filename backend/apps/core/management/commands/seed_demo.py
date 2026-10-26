"""Demo ma'lumotlar: python manage.py seed_demo

Administrator: SEED_ADMIN_USERNAME / SEED_ADMIN_PASSWORD (standart: admin / admin12345)
Vakil (Kyoto): kyoto_rep / rep12345
Matnlar — namunaviy; haqiqiy ma'lumotni admin panel orqali almashtiring.
"""
import os
from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.accounts.models import User
from apps.core.alphabet import to_new_alphabet
from apps.content.models import HeroSlide, MediaKind, News, SiteMedia, SiteSettings, Stat
from apps.universities.models import Program, Requirement, University, UsefulLink


def tr(field, uz, en=None, ja=None):
    """3 tilli maydon qiymatlarini bitta lug'atga yig'adi."""
    out = {f"{field}_uz": to_new_alphabet(uz)}
    if en is not None:
        out[f"{field}_en"] = en
    if ja is not None:
        out[f"{field}_ja"] = ja
    return out


class Command(BaseCommand):
    help = "Demo ma'lumotlarni yaratadi (qayta ishga tushirsa ham xavfsiz)."

    def handle(self, *args, **opts):
        self.seed_users_and_universities()
        self.seed_content()
        self.stdout.write(self.style.SUCCESS("Demo ma'lumotlar tayyor."))

    # ------------------------------------------------------------------
    def seed_users_and_universities(self):
        today = date.today()
        unis = [
            dict(slug="kyoto-university", country="jp", short_name="Kyoto", native_name="京都大学",
                 brand_color="#2c3a6e", website_url="https://www.kyoto-u.ac.jp",
                 contact_email="admissions@example.com", sort_order=1,
                 **tr("name", "Kyoto University", "Kyoto University", "京都大学"),
                 **tr("city", "Kyoto", "Kyoto", "京都"),
                 **tr("description", "Yaponiyaning yetakchi tadqiqot universitetlaridan biri. [Haqiqiy tavsif bilan almashtiring]",
                      "One of Japan's leading research universities. [Replace with real text]"),
                 **tr("instruction_language", "Yapon va ingliz tillari", "Japanese and English"),
                 application_start=today, application_deadline=today + timedelta(days=90),
                 results_date=today + timedelta(days=150), term_start=today + timedelta(days=240),
                 has_doctoral=True),
            dict(slug="osaka-university", country="jp", short_name="Osaka", native_name="大阪大学",
                 brand_color="#c8102e", website_url="https://www.osaka-u.ac.jp", sort_order=2,
                 **tr("name", "Osaka University", "Osaka University", "大阪大学"),
                 **tr("city", "Osaka", "Osaka", "大阪")),
            dict(slug="tokyo-university", country="jp", short_name="Tokyo", native_name="東京大学",
                 brand_color="#f2a900", website_url="https://www.u-tokyo.ac.jp", sort_order=3,
                 **tr("name", "Tokyo University", "The University of Tokyo", "東京大学"),
                 **tr("city", "Tokyo", "Tokyo", "東京")),
            dict(slug="tdyu", country="uz", short_name="TDYU", brand_color="#14183F", sort_order=1,
                 **tr("name", "Toshkent davlat yuridik universiteti", "Tashkent State University of Law"),
                 **tr("city", "Toshkent", "Tashkent")),
            dict(slug="tiqxmi", country="uz", short_name="TIQXMI", brand_color="#0FA896", sort_order=2,
                 **tr("name", "Toshkent irrigatsiya va qishloq xo'jaligini mexanizatsiyalash muhandislari instituti",
                      "Tashkent Institute of Irrigation and Agricultural Mechanization Engineers"),
                 **tr("city", "Toshkent", "Tashkent")),
            dict(slug="nuuz", country="uz", short_name="NUUz", brand_color="#5B3FD0", sort_order=3,
                 **tr("name", "O'zbekiston milliy universiteti", "National University of Uzbekistan"),
                 **tr("city", "Toshkent", "Tashkent")),
            dict(slug="uzswlu", country="uz", short_name="UzSWLU", brand_color="#A02C78", sort_order=4,
                 website_url="https://uzswlu.uz",
                 **tr("name", "O'zbekiston davlat jahon tillari universiteti", "Uzbekistan State World Languages University"),
                 **tr("city", "Toshkent", "Tashkent"),
                 **tr("description",
                      "Xorijiy tillar, tarjimashunoslik va xalqaro filologiya yo'nalishlariga ixtisoslashgan universitet. [Haqiqiy tavsif bilan almashtiring]",
                      "A university specializing in foreign languages, translation studies and international philology. [Replace with real text]"),
                 **tr("instruction_language", "O'zbek va xorijiy tillar", "Uzbek and foreign languages")),
        ]
        created = {}
        for data in unis:
            # get_or_create: mavjud universitetni QAYTA YOZMAYDI (admin paneldagi tahrirlar saqlanadi).
            # Yangi universitet qo'shilsa, keyingi ishga tushishda faqat o'sha yaratiladi.
            obj, _ = University.objects.get_or_create(slug=data["slug"], defaults=data)
            created[obj.slug] = obj

        kyoto = created["kyoto-university"]
        if not kyoto.requirements.exists():
            reqs = [
                ("Ta'lim hujjati", "Attestat yoki diplom (tarjima va tasdiqlangan nusxa)", "Academic certificate or diploma"),
                ("Til sertifikati", "[Kerakli daraja va sertifikat turi]", "Language certificate"),
                ("Pasport", "Amal qilish muddati yetarli bo'lgan nusxa", "Valid passport copy"),
                ("Motivatsion xat va tavsiyanomalar", "", "Motivation letter and recommendations"),
            ]
            for i, (uz, detail, en) in enumerate(reqs):
                Requirement.objects.create(
                    university=kyoto, sort_order=i,
                    **tr("title", uz, en), **tr("detail", detail),
                )
        if not kyoto.programs.exists():
            for i, (level, uz, en) in enumerate([
                ("bachelor", "Muhandislik", "Engineering"),
                ("bachelor", "Iqtisodiyot", "Economics"),
                ("master", "Axborot texnologiyalari", "Information Technology"),
                ("doctoral", "Tabiiy fanlar", "Natural Sciences"),
            ]):
                Program.objects.create(university=kyoto, level=level, sort_order=i, **tr("name", uz, en))
        if not kyoto.links.exists():
            UsefulLink.objects.create(
                university=kyoto, url="https://www.kyoto-u.ac.jp", sort_order=0,
                **tr("title", "Qabul bo'limi sahifasi", "Admissions page"),
            )

        # Foydalanuvchilar
        admin_user, made = User.objects.get_or_create(
            username=os.environ.get("SEED_ADMIN_USERNAME", "admin"),
            defaults=dict(role=User.Role.PLATFORM_ADMIN, is_staff=True, is_superuser=True,
                          email="admin@example.com"),
        )
        if made:
            admin_user.set_password(os.environ.get("SEED_ADMIN_PASSWORD", "admin12345"))
            admin_user.save()
        rep, made = User.objects.get_or_create(
            username="kyoto_rep",
            defaults=dict(role=User.Role.UNIVERSITY_REP, university=kyoto, email="rep@example.com"),
        )
        if made:
            rep.set_password("rep12345")
            rep.save()

    # ------------------------------------------------------------------
    def seed_content(self):
        if not HeroSlide.objects.exists():
            slides = [
                dict(theme="sunset", sort_order=0,
                     **tr("eyebrow", "O'ZBEKISTON – YAPONIYA", "UZBEKISTAN – JAPAN", "ウズベキスタン – 日本"),
                     **tr("title", "Ta'lim orqali kelajakni birga quramiz", "Building the future together through education", "教育でともに未来をつくる"),
                     **tr("highlight", "birga", "together", "ともに"),
                     **tr("description",
                          "O'zbekiston va Yaponiya universitetlari o'rtasidagi ta'lim aloqalarini rivojlantirish, talabalar almashinuvi, stipendiyalar va qo'shma dasturlar bilan yangi imkoniyatlar yaratamiz.",
                          "We create new opportunities by developing educational ties between universities of Uzbekistan and Japan."),
                     **tr("primary_label", "Universitetlarni topish", "Find universities", "大学を探す"),
                     primary_url="/universities",
                     **tr("secondary_label", "Batafsil ma'lumot", "Learn more", "詳しく見る"),
                     secondary_url="/#hamkorlik"),
                dict(theme="teal", sort_order=1,
                     **tr("eyebrow", "STIPENDIYALAR VA GRANTLAR", "SCHOLARSHIPS AND GRANTS", "奨学金・助成金"),
                     **tr("title", "Yaponiyada o'qish — grant bilan", "Study in Japan — with a grant", "奨学金で日本留学"),
                     **tr("highlight", "grant", "grant", "奨学金"),
                     **tr("description",
                          "Hukumat va universitet stipendiyalari, grantlar va moliyaviy yordam dasturlari bir joyda.",
                          "Government and university scholarships and financial aid in one place."),
                     **tr("primary_label", "Universitetlarni ko'rish", "Browse universities", "大学を見る"),
                     primary_url="/universities"),
                dict(theme="violet", sort_order=2,
                     **tr("eyebrow", "ALMASHINUV DASTURLARI", "EXCHANGE PROGRAMS", "交換留学"),
                     **tr("title", "Talabalar va o'qituvchilar uchun almashinuv", "Exchange for students and teachers", "学生・教員の交流"),
                     **tr("highlight", "almashinuv", "Exchange", "交流"),
                     **tr("description",
                          "Bir semestrdan to'liq dasturgacha: ikki davlat universitetlarida o'qish, tadqiqot va dars berish imkoniyatlari.",
                          "From one semester to a full degree: study, research and teach at universities in both countries."),
                     **tr("primary_label", "Dasturlarni ko'rish", "View programs", "プログラムを見る"),
                     primary_url="/universities"),
            ]
            for s in slides:
                HeroSlide.objects.create(media_kind=MediaKind.NONE, **s)

        for key in SiteMedia.Key.values:
            SiteMedia.objects.get_or_create(key=key, defaults={"kind": MediaKind.IMAGE})

        if not Stat.objects.exists():
            for i, (v, suf, uz, en) in enumerate([
                (50, "+", "Hamkor universitetlar", "Partner universities"),
                (200, "+", "Stipendiya va grantlar", "Scholarships and grants"),
                (1000, "+", "Talabalar almashinuvi", "Student exchanges"),
                (10, "+", "Hamkor davlatlar", "Partner countries"),
            ]):
                Stat.objects.create(value=v, suffix=suf, sort_order=i, **tr("label", uz, en))

        if not News.objects.exists():
            now = timezone.now()
            News.objects.create(
                category="news", link_type="internal", published_at=now - timedelta(days=3),
                **tr("title", "Yaponiya universitetlari qabul kampaniyasi boshlandi", "Admission campaign of Japanese universities has started"),
                **tr("summary", "Qabul muddatlari va talablar bilan tanishing.", "Check deadlines and requirements."),
                **tr("body", "[Yangilik matni]"),
            )
            News.objects.create(
                category="cooperation", link_type="external", external_url="https://example.com",
                source_name="[Manba nomi]", published_at=now - timedelta(days=7),
                **tr("title", "O'zbekiston va Yaponiya o'rtasida yangi hamkorlik kelishuvi", "New cooperation agreement between Uzbekistan and Japan"),
            )
            News.objects.create(
                category="event", link_type="external", external_url="https://example.com",
                published_at=now - timedelta(days=14), event_starts_at=now + timedelta(days=20),
                **tr("title", "Talabalar uchun onlayn seminar: Yaponiyada ta'lim", "Online seminar for students: education in Japan"),
                **tr("event_location", "Onlayn", "Online"),
            )

        if not UsefulLink.objects.filter(university__isnull=True).exists():
            for i, (icon, uz, desc, en) in enumerate([
                ("scholarship", "Stipendiya dasturlari", "Grantlar, tanlov shartlari va muddatlar haqida rasmiy ma'lumot.", "Scholarship programs"),
                ("language", "Yapon tilini o'rganish", "Darsliklar, onlayn kurslar va til sertifikati imtihonlari.", "Learning Japanese"),
                ("visa", "Viza va hujjatlar", "Talabalar vizasi va kerakli hujjatlar ro'yxati.", "Visa and documents"),
                ("housing", "Yashash va turar joy", "Yotoqxona, ijara va yashash xarajatlari bo'yicha qo'llanma.", "Housing and living"),
            ]):
                UsefulLink.objects.create(
                    icon=icon, url="https://example.com", is_external=True, sort_order=i,
                    **tr("title", uz, en), **tr("description", desc),
                )

        s = SiteSettings.load()
        if not s.contact_email:
            s.contact_email = "info@example.com"
            s.save()
