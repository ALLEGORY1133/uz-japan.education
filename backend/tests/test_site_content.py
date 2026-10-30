"""Sahifa bo'limlari (CMS), «Sayt yangiliklari» turkumi va yangilik videosi — haqiqiy Django bilan tekshiruv.

Ishga tushirish:  python manage.py test tests
"""
import shutil
import tempfile
from io import BytesIO

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from PIL import Image
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.content.models import News, PageBlock

TMP = tempfile.mkdtemp(prefix="uzj-test-media-")


def png(name="t.png"):
    buf = BytesIO()
    Image.new("RGB", (40, 30), (200, 40, 40)).save(buf, "PNG")
    return SimpleUploadedFile(name, buf.getvalue(), content_type="image/png")


@override_settings(MEDIA_ROOT=TMP)
class SiteContentTests(TestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(TMP, ignore_errors=True)

    def setUp(self):
        self.admin = User.objects.create_user("adm", password="x", role=User.Role.PLATFORM_ADMIN, is_staff=True)
        self.api = APIClient()
        self.api.force_authenticate(self.admin)

    # ---- sahifa bo'limlari
    def test_pages_list_has_registry(self):
        r = self.api.get("/api/admin/pages/")
        self.assertEqual(r.status_code, 200)
        keys = [s["key"] for p in r.json()["pages"] for s in p["sections"]]
        self.assertIn("home.intro", keys)
        self.assertIn("updates.head", keys)

    def test_patch_text_and_image_then_public_and_reset(self):
        r = self.api.patch("/api/admin/pages/about.s2/", {"title_uz": "Sarlavha", "title_en": "Title", "link_url": "/universities", "link_label_uz": "Tugma"}, format="json")
        self.assertEqual(r.status_code, 200, r.content)
        r = self.api.patch("/api/admin/pages/about.s2/", {"image": png()}, format="multipart")
        self.assertEqual(r.status_code, 200, r.content)
        self.assertTrue(r.json()["values"]["image"])
        pub = self.api.get("/api/public/blocks/").json()["about.s2"]
        self.assertEqual(pub["title"]["en"], "Title")
        self.assertEqual(pub["link_url"], "/universities")
        self.assertTrue(pub["image"])
        # tilla yo'q maydon bo'sh qaytadi (sayt standartga tushadi)
        self.assertEqual(pub["title"]["ja"], "")
        # rasmni o'chirish
        r = self.api.patch("/api/admin/pages/about.s2/", {"clear_image": "1"}, format="json")
        self.assertFalse(r.json()["values"]["image"])
        # standartga qaytarish
        self.assertEqual(self.api.delete("/api/admin/pages/about.s2/").status_code, 204)
        self.assertFalse(PageBlock.objects.filter(key="about.s2").exists())

    def test_unknown_section_404_and_disallowed_field_ignored(self):
        self.assertEqual(self.api.patch("/api/admin/pages/nope.x/", {"title_uz": "a"}, format="json").status_code, 404)
        # home.news da faqat title/text bor: link_url e'tiborga olinmaydi
        self.api.patch("/api/admin/pages/home.news/", {"title_uz": "Yangi", "link_url": "/x"}, format="json")
        self.assertEqual(PageBlock.objects.get(key="home.news").link_url, "")

    def test_uz_text_converted_to_new_alphabet(self):
        self.api.patch("/api/admin/pages/home.news/", {"title_uz": "Boshlash"}, format="json")
        self.assertEqual(PageBlock.objects.get(key="home.news").title_uz, "Boşlaş")

    def test_admin_pages_requires_permission(self):
        anon = APIClient()
        self.assertIn(anon.get("/api/admin/pages/").status_code, (401, 403))
        rep = User.objects.create_user("rep", password="x", role=User.Role.UNIVERSITY_REP)
        c = APIClient(); c.force_authenticate(rep)
        self.assertEqual(c.get("/api/admin/pages/").status_code, 403)

    # ---- Sayt yangiliklari va video
    def test_platform_news_goes_to_updates_not_news_carousel(self):
        News.objects.create(title="Yangilik", title_uz="Yangilik", category="news", slug="n1")
        News.objects.create(title="Sayt", title_uz="Sayt", category="platform", slug="p1")
        home = self.api.get("/api/public/home/").json()
        self.assertEqual([n["slug"] for n in home["updates"]], ["p1"])
        self.assertNotIn("p1", [n["slug"] for n in home["news"]])
        lst = self.api.get("/api/public/news/?category=platform").json()
        rows = lst["results"] if isinstance(lst, dict) else lst
        self.assertEqual([n["slug"] for n in rows], ["p1"])

    def test_seed_platform_updates_exist_after_migrations(self):
        self.assertTrue(News.objects.filter(category="platform").exists())

    def test_news_video_upload_and_public_field(self):
        vid = SimpleUploadedFile("v.mp4", b"\x00\x00\x00\x18ftypmp42" + b"0" * 64, content_type="video/mp4")
        r = self.api.post("/api/admin/news/", {"title_uz": "Videoli", "category": "platform", "link_type": "internal", "video": vid}, format="multipart")
        self.assertEqual(r.status_code, 201, r.content)
        slug = r.json()["slug"]
        pub = self.api.get(f"/api/public/news/{slug}/").json()
        self.assertTrue(pub["video"] and pub["video"].endswith(".mp4"))

    def test_public_href_matches_category_section(self):
        for cat, section in (("platform", "updates"), ("event", "events"), ("cooperation", "cooperation"), ("news", "news")):
            News.objects.create(title=cat, title_uz=cat, category=cat, slug=f"h-{cat}")
        rows = self.api.get("/api/public/news/").json()
        rows = rows["results"] if isinstance(rows, dict) else rows
        got = {r["slug"]: r["href"] for r in rows if r["slug"].startswith("h-")}
        self.assertEqual(got["h-platform"], "/updates/h-platform")
        self.assertEqual(got["h-event"], "/events/h-event")
        self.assertEqual(got["h-cooperation"], "/cooperation/h-cooperation")
        self.assertEqual(got["h-news"], "/news/h-news")

    def test_operators_not_in_public_settings(self):
        from apps.content.models import SiteSettings

        s = SiteSettings.load()
        s.operators = [{"name": "A", "role": "", "phone": "+998901112233", "telegram": ""}]
        s.save()
        pub = self.api.get("/api/public/home/").json()["settings"]
        self.assertNotIn("operators", pub)
        self.assertEqual(self.api.get("/api/admin/operators/").json()[0]["name"], "A")
