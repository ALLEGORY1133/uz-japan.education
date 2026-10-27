"""Yengil yordamchi: katta AI modeli yo'q — bazadagi ma'lumotdan qoidalar va qidiruv bilan javob beradi.

Hech qanday tashqi servis, internet yoki model yuklash talab qilinmaydi. Til: uz / en / ja.
Keyinchalik xohlansa, `answer_*` natijasini LLM'ga berish mumkin (hozir kerak emas).
"""
import difflib
import re
from datetime import timedelta

from django.db.models import Count, Q
from django.utils import timezone, translation

from apps.applications.models import Application, Inquiry
from apps.content.models import News
from apps.universities.models import Program, University

LANGS = ("uz", "en", "ja")


def fold(text):
    """Kichik harf, yangi/eski alifbo va diakritikani birlashtirish: Özbekiston == O'zbekiston == ozbekiston."""
    t = str(text or "").lower()
    for a, b in (("ö", "o"), ("ğ", "g"), ("ş", "sh"), ("ç", "ch"), ("x", "h"), ("q", "k"), ("w", "v"), ("ʻ", ""), ("ʼ", ""), ("’", ""), ("‘", ""), ("'", ""), ("`", "")):
        t = t.replace(a, b)
    return re.sub(r"[^\w぀-ヿ一-鿿]+", " ", t).strip()


_FOLD_CACHE = {}


def _f(w):
    if w not in _FOLD_CACHE:
        _FOLD_CACHE[w] = fold(w) if w.isascii() else w
    return _FOLD_CACHE[w]


def has(q, raw, words):
    """Qisqa (<=3 belgili lotin) so'zlar faqat butun so'z sifatida, qolganlari qismi bo'yicha mos keladi.
    Kalit so'zlar ham `fold` qilinadi (x/h, q/k farqi, yangi/eski alifbo muhim emas)."""
    toks = set(q.split())
    for w in words:
        fw = _f(w)
        if w.isascii() and len(w) <= 3:
            if fw in toks:
                return True
        elif (fw in q) or (w in raw):
            return True
    return False


# ---- Matnlar (uz / en / ja)
T = {
    "hello": {
        "uz": "Salom! Men UzJapan yordamchisiman. Universitetlar, muddatlar, talablar, grantlar va ariza topshirish haqida so‘rang.",
        "en": "Hello! I'm the UzJapan assistant. Ask about universities, deadlines, requirements, grants or how to apply.",
        "ja": "こんにちは！UzJapanのアシスタントです。大学、締切、要件、奨学金、申請方法についてご質問ください。",
    },
    "unknown": {
        "uz": "Bu savolga aniq javob topa olmadim. Universitet nomini yozib so‘rang (masalan: «Kyoto muddati») yoki murojaat yuboring — adminlar javob beradi.",
        "en": "I couldn't find an exact answer. Try naming a university (e.g. “Kyoto deadline”) or send an inquiry and our team will reply.",
        "ja": "正確な回答が見つかりませんでした。大学名を入れてご質問いただくか、お問い合わせをお送りください。",
    },
    "nouni": {
        "uz": "Qaysi universitet haqida? Nomini yozing.",
        "en": "Which university? Please type its name.",
        "ja": "どの大学についてですか？名前を入力してください。",
    },
    "uni_list": {"uz": "Universitetlar ({n} ta): ", "en": "Universities ({n}): ", "ja": "大学（{n}校）："},
    "deadline": {"uz": "{u}: ariza muddati — {d}.", "en": "{u}: application deadline — {d}.", "ja": "{u}：申請締切 — {d}。"},
    "nodate": {"uz": "{u}: muddat hali e’lon qilinmagan.", "en": "{u}: deadline not announced yet.", "ja": "{u}：締切はまだ発表されていません。"},
    "startdate": {"uz": "{u}: ariza qabuli {d} dan boshlanadi.", "en": "{u}: applications open on {d}.", "ja": "{u}：申請受付は{d}から開始。"},
    "opens": {"uz": " Qabul {d} dan boshlanadi.", "en": " Applications open on {d}.", "ja": " 受付開始：{d}。"},
    "results": {"uz": " Natijalar: {d}.", "en": " Results: {d}.", "ja": " 結果発表：{d}。"},
    "start": {"uz": " O‘qish boshlanishi: {d}.", "en": " Term starts: {d}.", "ja": " 開始：{d}。"},
    "req": {"uz": "{u} talablari:\n", "en": "{u} requirements:\n", "ja": "{u}の要件：\n"},
    "noreq": {"uz": "{u} uchun talablar hali kiritilmagan.", "en": "No requirements listed for {u} yet.", "ja": "{u}の要件はまだ登録されていません。"},
    "prog": {"uz": "{u} yo‘nalishlari:\n", "en": "{u} programs:\n", "ja": "{u}のプログラム：\n"},
    "noprog": {"uz": "{u} uchun yo‘nalishlar hali kiritilmagan.", "en": "No programs listed for {u} yet.", "ja": "{u}のプログラムはまだ登録されていません。"},
    "cost": {"uz": "{u}: kontrakt — {c}; to‘lov — {p}; yashash — {l}.", "en": "{u}: tuition — {c}; payment — {p}; living — {l}.", "ja": "{u}：学費 — {c}；支払い — {p}；生活費 — {l}。"},
    "grant": {"uz": "{u} granti: {g}. {c}", "en": "{u} grant: {g}. {c}", "ja": "{u}の奨学金：{g}。{c}"},
    "nogrant": {"uz": "{u} uchun grant ma’lumoti kiritilmagan.", "en": "No grant information for {u}.", "ja": "{u}の奨学金情報はありません。"},
    "status": {"uz": "{u}: {s}.", "en": "{u}: {s}.", "ja": "{u}：{s}。"},
    "contact": {"uz": "{u} aloqa: email — {e}; telefon — {p}; sayt — {w}.", "en": "{u} contact: email — {e}; phone — {p}; website — {w}.", "ja": "{u}の連絡先：メール — {e}；電話 — {p}；サイト — {w}。"},
    "apply": {
        "uz": "Ariza topshirish: 1) Universitetlar sahifasidan universitetni tanlang; 2) «Ariza topshirish» formasini to‘ldiring; 3) hujjatlarni yuklab yuboring; 4) holatni Talaba kabinetida emailingiz bilan kuzating.",
        "en": "How to apply: 1) pick a university; 2) fill in the application form; 3) upload your documents and submit; 4) track the status in the Student cabinet with your email.",
        "ja": "申請方法：1) 大学を選ぶ 2) 申請フォームに記入 3) 書類をアップロードして送信 4) 学生キャビネットでメールアドレスから状況を確認。",
    },
    "cabinet": {
        "uz": "Ariza holati va murojaat javoblarini Talaba kabinetida emailingizni kiritib ko‘rasiz.",
        "en": "Check your application status and inquiry replies in the Student cabinet with your email.",
        "ja": "申請状況とお問い合わせの返信は、メールアドレスで学生キャビネットから確認できます。",
    },
    "news": {"uz": "So‘nggi yangiliklar:\n", "en": "Latest news:\n", "ja": "最新ニュース：\n"},
    "nonews": {"uz": "Hozircha yangilik yo‘q.", "en": "No news yet.", "ja": "ニュースはまだありません。"},
    "found": {"uz": "Topilgan ma’lumot:\n", "en": "Found:\n", "ja": "見つかった情報：\n"},
}
ADM_STATUS = {
    "open": {"uz": "qabul ochiq", "en": "admission open", "ja": "受付中"},
    "soon": {"uz": "qabul tez orada", "en": "admission opening soon", "ja": "まもなく受付開始"},
    "closed": {"uz": "qabul yopiq", "en": "admission closed", "ja": "受付終了"},
}
LABEL = {
    "uz": {"unis": "Universitetlar", "apply": "Ariza topshirish", "cabinet": "Talaba kabineti", "news": "Yangiliklar", "about": "Biz haqimizda"},
    "en": {"unis": "Universities", "apply": "Apply", "cabinet": "Student cabinet", "news": "News", "about": "About"},
    "ja": {"unis": "大学一覧", "apply": "申請する", "cabinet": "学生キャビネット", "news": "ニュース", "about": "私たちについて"},
}
SUGGEST = {
    "uz": ["Qaysi universitetlar bor?", "Ariza muddati qachon?", "Qanday ariza topshiraman?", "Grantlar haqida"],
    "en": ["Which universities are there?", "When is the deadline?", "How do I apply?", "About grants"],
    "ja": ["どんな大学がありますか？", "締切はいつですか？", "申請方法は？", "奨学金について"],
}


def tt(key, lang, **kw):
    return T[key].get(lang, T[key]["uz"]).format(**kw)


def D(d, lang):
    return d.strftime("%d.%m.%Y") if d else "—"


def out(answer, links=None, lang="uz"):
    return {"answer": answer, "links": links or [], "suggestions": SUGGEST.get(lang, SUGGEST["uz"])}


STOP = {
    "va", "the", "and", "of", "ning", "haqida", "uchun", "bilan", "bor", "bormi", "qanday", "kaysi", "nima", "necha", "kancha",
    "davlat", "state", "national", "ariza", "kerak", "mumkin", "menga", "ayting", "bering", "kachon", "qaerda",
}
INTENT_WORDS = (
    "muddat", "deadline", "talab", "hujjat", "requirement", "document", "yonalish", "dastur", "fakultet", "program", "narh",
    "kontrakt", "tolov", "harajat", "grant", "stipendiya", "scholarship", "kabul", "ochik", "yopik", "aloka", "email", "telefon",
    "yangilik", "tadbir", "news", "event",
)


def _vocab(u):
    toks = set()
    for attr in ("name_uz", "name_en", "city_uz", "city_en", "short_name", "slug"):
        for t in fold(getattr(u, attr, "") or "").split():
            if len(t) >= 3 and t not in STOP and not t.startswith(("universit", "institut")):
                toks.add(t)
    return toks


def _tok_score(t, vocab):
    if t in vocab:
        return 3
    if len(t) >= 4 and any(v.startswith(t) or (len(v) >= 4 and t.startswith(v)) for v in vocab):
        return 2
    if len(t) >= 5 and any(difflib.SequenceMatcher(None, t, v).ratio() >= 0.84 for v in vocab):
        return 1.5
    return 0


def match_universities(q, raw, unis):
    """So'rovga mos universitetlar (eng yuqori ball bo'yicha; teng bo'lsa bir nechta)."""
    qtoks = [t for t in q.split() if len(t) >= 3 and t not in STOP and not t.startswith(("universit", "institut"))
             and not any(t.startswith(w) for w in INTENT_WORDS)]
    qj = q.replace(" ", "")
    scored = []
    for u in unis:
        s = 0
        for c in (fold(u.short_name), fold(u.slug).replace(" ", "")):
            if len(c) >= 3 and (c in q or c in qj):
                s = max(s, 10)
        if u.native_name and u.native_name in raw:
            s = max(s, 10)
        for attr in ("name_ja", "city_ja"):
            v = getattr(u, attr, "") or ""
            if v and len(v) >= 2 and v in raw:
                s = max(s, 10)
        voc = _vocab(u)
        s = max(s, sum(_tok_score(t, voc) for t in qtoks))
        if s >= 1.5:
            scored.append((s, u))
    if not scored:
        return []
    top = max(x for x, _ in scored)
    return [u for x, u in scored if x == top][:4]


def find_university(q, raw, unis):
    m = match_universities(q, raw, unis)
    return m[0] if len(m) == 1 else None


def token_score(qtoks, text):
    voc = {t for t in fold(text).split() if len(t) >= 3}
    return sum(_tok_score(t, voc) for t in qtoks)


def uni_reply(uni, wants, lang):
    base = f"/{lang}"
    u = uni.short_name or uni.name
    link = [{"label": u, "url": f"{base}/universities/{uni.slug}"}]
    st = uni.effective_status
    if wants == "start":
        if uni.application_start:
            return out(tt("startdate", lang, u=u, d=D(uni.application_start, lang)), link, lang)
        return out(tt("nodate", lang, u=u), link, lang)
    if wants == "deadline":
        if not uni.application_deadline:
            return out(tt("nodate", lang, u=u), link, lang)
        a = tt("deadline", lang, u=u, d=D(uni.application_deadline, lang))
        if st == "soon" and uni.application_start:
            a += tt("opens", lang, d=D(uni.application_start, lang))
        if uni.results_date:
            a += tt("results", lang, d=D(uni.results_date, lang))
        if uni.term_start:
            a += tt("start", lang, d=D(uni.term_start, lang))
        return out(a, link, lang)
    if wants == "req":
        reqs = list(uni.requirements.all()[:12])
        if not reqs:
            return out(tt("noreq", lang, u=u), link, lang)
        return out(tt("req", lang, u=u) + "\n".join(f"• {r.title}" + (f" — {r.detail}" if r.detail else "") for r in reqs), link, lang)
    if wants == "prog":
        progs = list(uni.programs.all()[:20])
        if not progs:
            return out(tt("noprog", lang, u=u), link, lang)
        return out(tt("prog", lang, u=u) + "\n".join(f"• {p.name} ({p.get_level_display()})" for p in progs), link, lang)
    if wants == "cost":
        return out(tt("cost", lang, u=u, c=uni.contract_fee or "—", p=uni.payment_terms or "—", l=uni.living_cost or "—"), link, lang)
    if wants == "grant":
        if not (uni.grant_name or uni.grant_coverage):
            return out(tt("nogrant", lang, u=u), link, lang)
        return out(tt("grant", lang, u=u, g=uni.grant_name or "—", c=uni.grant_coverage or ""), link, lang)
    if wants == "status":
        a = tt("status", lang, u=u, s=ADM_STATUS[st][lang])
        if st == "soon" and uni.application_start:
            a += tt("opens", lang, d=D(uni.application_start, lang))
        return out(a, link, lang)
    if wants == "contact":
        return out(tt("contact", lang, u=u, e=uni.contact_email or "—", p=uni.contact_phone or "—", w=uni.website_url or "—"), link, lang)
    return out(tt("unknown", lang), link, lang)


def public_answer(message, lang="uz", unis=None):
    lang = lang if lang in LANGS else "uz"
    raw = str(message or "").strip()[:300]
    q = fold(raw)
    L = LABEL[lang]
    base = f"/{lang}"
    with translation.override(lang):
        unis = list(University.objects.filter(is_published=True).order_by("sort_order", "id"))
        if not q:
            return out(tt("hello", lang), lang=lang)
        cands = match_universities(q, raw, unis)
        uni = cands[0] if len(cands) == 1 else None
        name = lambda u: (u.short_name or u.name)

        if has(q, raw, ("salom", "assalom", "hello", "hi", "privet", "こんにちは", "help", "yordam")) and len(q.split()) <= 3:
            return out(tt("hello", lang), lang=lang)

        # --- murojaat holati / kabinet
        if has(q, raw, ("kabinet", "ariza holati", "holatini", "status", "cabinet", "申請状況", "キャビネット")):
            return out(tt("cabinet", lang), [{"label": L["cabinet"], "url": f"{base}/cabinet"}], lang)

        if has(q, raw, ("qanday ariza", "ariza topshir", "how to apply", "how do i apply", "apply", "申請方法", "申請")) and not has(q, raw, ("muddat", "deadline", "締切")):
            return out(tt("apply", lang), [{"label": L["unis"], "url": f"{base}/universities"}, {"label": L["cabinet"], "url": f"{base}/cabinet"}], lang)

        wants = None
        for key, words in (
            ("start", ("boshlan", "start", "begin", "opens", "開始", "いつから")),
            ("deadline", ("muddat", "deadline", "qachon", "oxirgi kun", "締切", "期限", "いつ")),
            ("req", ("talab", "hujjat", "requirement", "document", "必要書類", "要件", "書類")),
            ("prog", ("yonalish", "dastur", "fakultet", "mutaxassis", "program", "major", "faculty", "プログラム", "専攻", "学部")),
            ("cost", ("narx", "kontrakt", "tolov", "xarajat", "tuition", "fee", "cost", "living", "学費", "生活費")),
            ("grant", ("grant", "stipendiya", "scholarship", "奨学金")),
            ("status", ("qabul", "ochiq", "yopiq", "admission", "open", "受付")),
            ("contact", ("aloqa", "email", "telefon", "tel", "contact", "sayt", "連絡", "電話")),
        ):
            if has(q, raw, words):
                wants = key
                break

        if wants and len(cands) > 1:
            replies = [uni_reply(c, wants, lang) for c in cands]
            return out("\n\n".join(r["answer"] for r in replies), [lk for r in replies for lk in r["links"]][:4], lang)

        if wants and not uni:
            if wants == "deadline":  # hamma universitetlar muddati
                rows = [f"• {name(u)} — {D(u.application_deadline, lang)}" for u in unis if u.application_deadline]
                if rows:
                    return out("\n".join(rows), [{"label": L["unis"], "url": f"{base}/universities"}], lang)
            if wants == "start":
                rows = [f"• {name(u)} — {D(u.application_start, lang)}" for u in unis if u.application_start]
                if rows:
                    return out("\n".join(rows), [{"label": L["unis"], "url": f"{base}/universities"}], lang)
            if wants in ("grant", "status"):
                rows = []
                for u in unis:
                    if wants == "grant" and u.grant_name:
                        rows.append(f"• {name(u)} — {u.grant_name}")
                    if wants == "status":
                        rows.append(f"• {name(u)} — {ADM_STATUS[u.effective_status][lang]}")
                if rows:
                    return out("\n".join(rows), [{"label": L["unis"], "url": f"{base}/universities"}], lang)
            return out(tt("nouni", lang), lang=lang)

        if uni and wants:
            return uni_reply(uni, wants, lang)
        # --- yangiliklar / tadbirlar
        if has(q, raw, ("yangilik", "tadbir", "news", "event", "hamkorlik", "ニュース", "イベント")):
            items = list(News.objects.filter(is_published=True).order_by("-published_at")[:5])
            if not items:
                return out(tt("nonews", lang), lang=lang)
            return out(tt("news", lang) + "\n".join(f"• {n.title}" for n in items), [{"label": L["news"], "url": f"{base}/news"}], lang)

        # --- universitetlar ro'yxati
        if uni:
            link = [{"label": name(uni), "url": f"{base}/universities/{uni.slug}"}]
            a = f"{uni.name} ({uni.city}) — {ADM_STATUS[uni.effective_status][lang]}."
            if uni.application_deadline:
                a += " " + tt("deadline", lang, u=name(uni), d=D(uni.application_deadline, lang))
            return out(a, link, lang)
        if has(q, raw, ("universitet", "university", "universities", "royxat", "list", "大学", "yaponiya", "japan", "日本", "ozbekiston", "uzbekistan", "ウズベキスタン")):
            sel = unis
            if has(q, raw, ("yaponiya", "japan", "日本")):
                sel = [u for u in unis if u.country == "jp"]
            elif has(q, raw, ("ozbekiston", "uzbekistan", "ウズベキスタン")):
                sel = [u for u in unis if u.country == "uz"]
            return out(tt("uni_list", lang, n=len(sel)) + ", ".join(name(u) for u in sel), [{"label": L["unis"], "url": f"{base}/universities"}], lang)

        if has(q, raw, ("biz haqimizda", "about", "loyiha", "platforma", "私たち")):
            return out(tt("hello", lang), [{"label": L["about"], "url": f"{base}/about"}], lang)

        # --- umumiy qidiruv (zaxira): yo'nalishlar, talablar, yangiliklar, universitet tavsifi.
        qtoks = [t for t in q.split() if len(t) >= 3 and t not in STOP and not t.startswith(("universit", "institut"))][:8]
        if qtoks:
            rows = []
            for p in Program.objects.select_related("university")[:1500]:
                sc = token_score(qtoks, p.name)
                if sc >= 2:
                    rows.append((sc, f"• {p.name} ({p.get_level_display()}) — {p.university.short_name or p.university.name}", f"{base}/universities/{p.university.slug}"))
            if rows:
                rows.sort(key=lambda r: -r[0])
                return out(tt("found", lang) + "\n".join(r[1] for r in rows[:6]), [{"label": L["unis"], "url": rows[0][2]}], lang)
            reqs = []
            for u in unis:
                for r in u.requirements.all():
                    sc = token_score(qtoks, f"{r.title} {r.detail}")
                    if sc >= 3:
                        reqs.append((sc, f"• {name(u)}: {r.title}" + (f" — {r.detail}" if r.detail else ""), f"{base}/universities/{u.slug}"))
            if reqs:
                reqs.sort(key=lambda r: -r[0])
                return out(tt("found", lang) + "\n".join(r[1] for r in reqs[:6]), [{"label": L["unis"], "url": reqs[0][2]}], lang)
            hits = []
            for n in News.objects.filter(is_published=True).order_by("-published_at")[:300]:
                sc = token_score(qtoks, f"{n.title} {n.summary}")
                if sc >= 2:
                    hits.append((sc, n))
            if hits:
                hits.sort(key=lambda r: -r[0])
                return out(tt("found", lang) + "\n".join(f"• {n.title}" for _, n in hits[:4]), [{"label": L["news"], "url": f"{base}/news/{hits[0][1].slug}"}], lang)
            descs = [(token_score(qtoks, f"{u.description} {u.grant_criteria}"), u) for u in unis]
            descs = [d for d in descs if d[0] >= 3]
            if descs:
                descs.sort(key=lambda d: -d[0])
                u = descs[0][1]
                return out(f"{u.name} ({u.city}) — {ADM_STATUS[u.effective_status][lang]}.", [{"label": name(u), "url": f"{base}/universities/{u.slug}"}], lang)
        return out(tt("unknown", lang), [{"label": L["cabinet"], "url": f"{base}/cabinet"}], lang)


# ======================= ADMIN =======================
def admin_answer(message, user):
    """Administrator: hamma arizalar; vakil: faqat o‘z universiteti; kontent menejeri: arizalarga kirish yo‘q."""
    raw = str(message or "").strip()[:300]
    q = fold(raw)
    sug = ["Jami arizalar", "Yangi arizalar", "Bugungi arizalar", "Kutilayotgan murojaatlar"]

    def reply(a, links=None):
        return {"answer": a, "links": links or [], "suggestions": sug}

    if not q:
        return reply("Salom! Arizalar, statuslar, murojaatlar va universitetlar haqida so‘rang. Masalan: «yangi arizalar», «Kyoto arizalari», «UJ-XXXXXXXXXX holati».")

    is_rep = user.is_university_rep
    can_apps = bool(user.is_platform_admin or is_rep or user.perm("applications"))
    can_inq = bool(user.is_platform_admin or user.perm("inquiries"))
    glob = bool(user.is_platform_admin or (can_apps and not is_rep))  # hamma universitetlar arizalari
    if not can_apps and not can_inq:
        n_pub = News.objects.filter(is_published=True).count()
        n_all = News.objects.count()
        if has(q, raw, ("yangilik", "tadbir", "news", "kontent")):
            return reply(f"Yangilik va tadbirlar: jami {n_all} ta, shundan e’lon qilingan {n_pub} ta.", [{"label": "Yangiliklar", "url": "/news"}])
        return reply("Sizning rolingiz arizalar va murojaatlarga kirmaydi. Yangiliklar haqida so‘rashingiz mumkin.")

    qs = Application.objects.filter(is_submitted=True)
    if not can_apps:
        qs = qs.none()
    elif not glob:
        qs = qs.filter(university_id=user.university_id)
    scope = "Barcha universitetlar" if glob else (user.university.name if user.university_id else "—")

    # kuzatuv kodi bo'yicha
    m = re.search(r"uj\s?-?\s?([0-9a-f]{10})", q.replace(" ", ""))
    if m:
        a = qs.filter(tracking_code__iexact="UJ-" + m.group(1)).select_related("university").first()
        if not a:
            return reply("Bu kod bo‘yicha ariza topilmadi (yoki sizning doirangizda emas).")
        return reply(f"{a.tracking_code}: {a.first_name} {a.last_name} → {a.university.short_name or a.university.name}; holat — {a.get_status_display()}; daraja — {a.get_degree_display()}.", [{"label": "Arizalar", "url": "/applications"}])

    # universitet bo'yicha (faqat administrator)
    uni = None
    if glob:
        uni = find_university(q, raw, list(University.objects.all()))
        if uni:
            qs = qs.filter(university=uni)
            scope = uni.short_name or uni.name

    if has(q, raw, ("murojaat", "inquiry", "savol")):
        if not can_inq:
            return reply("Murojaatlarga kirish huquqingiz yo‘q.")
        pend = Inquiry.objects.filter(reply="").count()
        total = Inquiry.objects.count()
        new_today = Inquiry.objects.filter(created_at__gte=timezone.now() - timedelta(days=1)).count()
        return reply(f"Murojaatlar: jami {total} ta; javob berilmagan {pend} ta; so‘nggi 24 soatda {new_today} ta.", [{"label": "Murojaatlar", "url": "/inquiries"}])

    now = timezone.now()
    status = None
    for key, words in (("new", ("yangi", "new")), ("reviewing", ("korib", "korilmoqda", "reviewing", "jarayon")), ("accepted", ("qabul qilin", "accepted", "qabul")), ("rejected", ("rad", "rejected")), ):
        if has(q, raw, words):
            status = key
            break

    if has(q, raw, ("oxirgi", "songgi", "latest", "recent")):
        rows = list(qs.select_related("university").order_by("-submitted_at", "-id")[:5])
        if not rows:
            return reply(f"{scope}: arizalar yo‘q.")
        return reply("So‘nggi arizalar:\n" + "\n".join(f"• {a.first_name} {a.last_name} — {a.university.short_name or a.university.name} — {a.get_status_display()}" for a in rows), [{"label": "Arizalar", "url": "/applications"}])

    period = None
    if has(q, raw, ("bugun", "today")):
        period = ("bugun", now.replace(hour=0, minute=0, second=0, microsecond=0))
    elif has(q, raw, ("hafta", "week")):
        period = ("so‘nggi 7 kun", now - timedelta(days=7))
    elif has(q, raw, ("oy", "month")):
        period = ("so‘nggi 30 kun", now - timedelta(days=30))

    if has(q, raw, ("ariza", "application", "jami", "nechta", "qancha", "total", "status", "holat")) or status or period:
        f = qs
        parts = [scope]
        if status:
            f = f.filter(status=status)
            parts.append(dict(Application.Status.choices)[status].lower())
        if period:
            f = f.filter(submitted_at__gte=period[1])
            parts.append(period[0])
        n = f.count()
        a = f"{' · '.join(parts)}: {n} ta ariza."
        if not status and not period:
            by = {r["status"]: r["c"] for r in qs.values("status").annotate(c=Count("id"))}
            a += " " + ", ".join(f"{lbl.lower()} — {by.get(k, 0)}" for k, lbl in Application.Status.choices) + "."
            if glob and not uni:
                top = qs.values("university__short_name").annotate(c=Count("id")).order_by("-c")[:3]
                if top:
                    a += " Eng ko‘p: " + ", ".join(f"{t['university__short_name']} ({t['c']})" for t in top) + "."
        return reply(a, [{"label": "Arizalar", "url": "/applications"}])

    if has(q, raw, ("universitet", "university")) and glob:
        c = University.objects.count()
        p = University.objects.filter(is_published=True).count()
        o = University.objects.filter(admission_status="open").count()
        return reply(f"Universitetlar: jami {c} ta, e’lon qilingan {p} ta, qabul ochiq {o} ta.", [{"label": "Universitetlar", "url": "/universities"}])

    # zaxira: ommaviy ma'lumot
    pub = public_answer(raw, "uz")
    return {"answer": pub["answer"], "links": [], "suggestions": sug}
