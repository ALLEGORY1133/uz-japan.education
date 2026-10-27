"""Rollarga asoslangan ruxsatlar (RBAC): bo'limlar va ko'rish/tahrirlash darajalari."""

SECTIONS = [
    ("applications", "Arizalar"),
    ("inquiries", "Murojaatlar"),
    ("kpi", "KPI samaradorligi"),
    ("hero", "Bosh sahifa slayderi"),
    ("site_media", "Sayt rasm va videolari"),
    ("media", "Media kutubxonasi"),
    ("news", "Yangilik va tadbirlar"),
    ("stats", "Statistika"),
    ("settings", "Aloqa va tarmoqlar"),
    ("history", "Harakatlar tarixi"),
]
SECTION_KEYS = [k for k, _ in SECTIONS]
CONTENT_SECTIONS = ("hero", "site_media", "media", "news", "stats")
LEVELS = ("view", "edit")


def level_for(user, section):
    """None | 'view' | 'edit'. Foydalanuvchilar va rollarni boshqarish bu yerga kirmaydi (faqat administrator)."""
    if not (user and user.is_authenticated) or section not in SECTION_KEYS:
        return None
    if user.is_platform_admin:
        return "edit"
    if user.role == "content_manager":
        return "edit" if section in CONTENT_SECTIONS else None
    if user.role == "custom" and user.custom_role_id:
        lvl = (user.custom_role.permissions or {}).get(section)
        return lvl if lvl in LEVELS else None
    return None


def permissions_for(user):
    return {k: lvl for k in SECTION_KEYS if (lvl := level_for(user, k))}
