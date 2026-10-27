"""Eski o'zbek lotin yozuvidan yangi alifboga (ö ğ ş ç ’) o'tkazish."""
import re
# Yangi alifbo: sh→ş, ch→ç, oʻ→ö, gʻ→ğ, tutuq belgisi → ’
APOS = "‘’ʻʼ`'´"
def _convert(s):
    # oʻ / gʻ  (har xil apostrof shakllari)
    s = re.sub(r"([oO])[%s]" % re.escape(APOS), lambda m: "ö" if m.group(1) == "o" else "Ö", s)
    s = re.sub(r"([gG])[%s]" % re.escape(APOS), lambda m: "ğ" if m.group(1) == "g" else "Ğ", s)
    # sh, ch (katta-kichik harf)
    def digraph(m, small, big):
        t = m.group(0)
        if t[0].isupper() and (len(t) < 2 or t[1].islower()): return big      # Sh
        if t.isupper(): return big                                              # SH
        return small
    s = re.sub(r"[Ss][Hh]", lambda m: digraph(m, "ş", "Ş"), s)
    s = re.sub(r"[Cc][Hh]", lambda m: digraph(m, "ç", "Ç"), s)
    # tutuq belgisi: harf + apostrof + harf (ma'lumot, e'lon) → ’
    s = re.sub(r"(?<=[A-Za-zÖöĞğŞşÇç])[‘ʻʼ`´'](?=[A-Za-zÖöĞğŞşÇç])", "’", s)
    s = s.replace("‘", "’") if False else s
    return s


_KEEP = re.compile(r"https?://\S+|\S+@\S+\.\S+|www\.\S+")


def to_new_alphabet(s):
    """Matn ichidagi havola va emaillarga tegmasdan yangi alifboga o'tkazadi."""
    if not s:
        return s
    out, i = [], 0
    for m in _KEEP.finditer(s):
        out.append(_convert(s[i:m.start()]))
        out.append(m.group(0))
        i = m.end()
    out.append(_convert(s[i:]))
    return "".join(out)


def normalize_instance(instance):
    """Modeldagi barcha *_uz matn maydonlarini (admin eski alifboda yozgan bo'lsa ham) yangi alifboga o'tkazadi."""
    from django.db import models

    for f in instance._meta.concrete_fields:
        if f.name.endswith("_uz") and isinstance(f, (models.CharField, models.TextField)):
            v = getattr(instance, f.attname, None)
            if isinstance(v, str) and v:
                nv = to_new_alphabet(v)
                if nv != v:
                    setattr(instance, f.attname, nv)
