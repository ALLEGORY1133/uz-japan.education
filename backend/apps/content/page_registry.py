"""Admin paneldan tahrirlanadigan sahifalar va ularning bo'limlari.

fields: title | text | link | image | video — bo'limda qaysi maydonlar tahrirlanishi.
"""

PAGES = [
    {
        "key": "home", "label": "Bosh sahifa", "path": "",
        "sections": [
            {"key": "home.intro", "label": "Katta video bandi", "hint": "Statistikadan keyingi katta rasm/video va uning ustidagi matn.", "fields": ["title", "text", "image", "video"]},
            {"key": "home.updates", "label": "Yutuqlarimiz bloki (video band yonida)", "hint": "Blok sarlavhasi.", "fields": ["title"]},
            {"key": "home.news", "label": "Yangiliklar bo'limi", "hint": "Karusel tepasidagi sarlavha va matn.", "fields": ["title", "text"]},
            {"key": "home.students", "label": "Talaba kabineti bo'limi", "hint": "Sarlavha, matn va birinchi karta (kabinetga kirish) rasmi/videosi.", "fields": ["title", "text", "image", "video"]},
            {"key": "home.cooperation", "label": "Universitetlar va hamkorlik bo'limi", "hint": "Karusel tepasidagi sarlavha va matn.", "fields": ["title", "text"]},
            {"key": "home.apply", "label": "Savol-ariza bandi", "hint": "Sahifa pastidagi forma bandi: matn va fon rasm/video.", "fields": ["title", "text", "image", "video"]},
        ],
    },
    {
        "key": "about", "label": "Biz haqimizda", "path": "/about",
        "sections": [
            {"key": "about.hero", "label": "Sahifa boshi", "hint": "Sarlavha, qisqa matn va fon rasmi.", "fields": ["title", "text", "image"]},
            {"key": "about.s2", "label": "«Biz nima qilamiz» bo'limi", "hint": "Matn, rasm va tugma.", "fields": ["title", "text", "link", "image"]},
            {"key": "about.history", "label": "«Tarix» bo'limi sarlavhasi", "hint": "Tarix lavhalari tepasidagi sarlavha va matn (lavhalarning özi — «Biz haqimizda» → Tarix).", "fields": ["title", "text"]},
            {"key": "about.achievements", "label": "«Yutuqlarimiz» bo'limi sarlavhasi", "hint": "Katalog tepasidagi sarlavha va matn.", "fields": ["title", "text"]},
            {"key": "about.analysis", "label": "«Tahlillar» bo'limi sarlavhasi", "hint": "Tahlillar tepasidagi sarlavha va matn.", "fields": ["title", "text"]},
            {"key": "about.cta", "label": "Pastki chaqiruv", "hint": "Sahifa oxiridagi chaqiruv bloki.", "fields": ["title", "text", "link"]},
        ],
    },
    {
        "key": "universities", "label": "Universitetlar", "path": "/universities",
        "sections": [
            {"key": "universities.head", "label": "Sahifa boshi", "hint": "Sarlavha, matn va fon rasmi.", "fields": ["title", "text", "image"]},
        ],
    },
    {
        "key": "updates", "label": "Sayt yangiliklari", "path": "/news?tab=3",
        "sections": [
            {"key": "updates.head", "label": "Sahifa boshi", "hint": "Sarlavha, matn va fon rasmi.", "fields": ["title", "text", "image"]},
        ],
    },
    {
        "key": "news", "label": "Yangiliklar", "path": "/news",
        "sections": [
            {"key": "news.head", "label": "Sahifa boshi", "hint": "Sarlavha, matn va fon rasmi.", "fields": ["title", "text", "image"]},
        ],
    },
    {
        "key": "cooperation", "label": "Hamkorlik", "path": "/cooperation",
        "sections": [
            {"key": "cooperation.head", "label": "Sahifa boshi", "hint": "Sarlavha, matn va fon rasmi.", "fields": ["title", "text", "image"]},
        ],
    },
    {
        "key": "cabinet", "label": "Talaba kabineti", "path": "/cabinet",
        "sections": [
            {"key": "cabinet.hero", "label": "Sahifa boshi", "hint": "Sarlavha, matn va fon rasmi/videosi.", "fields": ["title", "text", "image", "video"]},
        ],
    },
    {
        "key": "events", "label": "Tadbirlar", "path": "/news?tab=2",
        "sections": [
            {"key": "events.head", "label": "Sahifa boshi", "hint": "Sarlavha, matn va fon rasmi.", "fields": ["title", "text", "image"]},
        ],
    },
]

SECTIONS = {s["key"]: s for p in PAGES for s in p["sections"]}
LANGS = ("uz", "en", "ja")
