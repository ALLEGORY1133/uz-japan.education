"""Eski o'zbek lotin yozuvidan yangi alifboga (ö ğ ş ç ’) o'tkazish."""
import re
# Yangi alifbo: sh→ş, ch→ç, oʻ→ö, gʻ→ğ, tutuq belgisi → ’
APOS = "‘’ʻʼ`'´"
def to_new_alphabet(s):
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
