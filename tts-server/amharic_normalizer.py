"""
Amharic text normalization for TTS.

Pipeline: orthography -> lexicon -> numbers/dates/currency/acronyms -> symbols
          -> mixed-language handling -> sentence splitting -> prosody (rate/pitch/pauses)

The goal is to hand the speech engine text that is already in spoken form, so
the engine never has to guess how a digit, an acronym or a symbol sounds.
"""

from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass, field

from amharic_numbers import DEPT_PREFIX_TO_AMHARIC, number_to_amharic

LEXICON_PATH = os.path.join(os.path.dirname(__file__), "pronunciation.json")

# --------------------------------------------------------------------------
# Speaker styles: base prosody offsets applied on top of the user sliders
# --------------------------------------------------------------------------
STYLES: dict[str, dict[str, int]] = {
    "professional": {"rate": 0, "pitch": 0},
    "friendly": {"rate": 4, "pitch": 5},
    "happy": {"rate": 9, "pitch": 12},
    "serious": {"rate": -6, "pitch": -7},
    "calm": {"rate": -8, "pitch": -2},
    "excited": {"rate": 15, "pitch": 16},
}
DEFAULT_STYLE = "professional"

DIGIT_NAMES = ["ዜሮ", "አንድ", "ሁለት", "ሦስት", "አራት", "አምስት", "ስድስት", "ሰባት", "ስምንት", "ዘጠኝ"]

ORDINALS = {
    1: "መጀመሪያ",
    2: "ሁለተኛ",
    3: "ሶስተኛ",
    4: "አራተኛ",
    5: "አምስተኛ",
    6: "ስድስተኛ",
    7: "ሰባኛ",
    8: "ስምንተኛ",
    9: "ዘጠነኛ",
    10: "አስርኛ",
}

MONTHS = {
    1: "ጃንዩወሪ", 2: "ፌብርዋሪ", 3: "ማርች", 4: "ኤፕሪል",
    5: "ሜይ", 6: "ጁን", 7: "ጁላይ", 8: "ኦገስት",
    9: "ሴፕቴምበር", 10: "ኦክቶበር", 11: "ኖቬምበር", 12: "ዲሴምበር",
}

CURRENCIES = {
    "etb": "ብር",
    "br": "ብር",
    "usd": "ዶላር",
    "$": "ዶላር",
    "eur": "ዩሮ",
    "€": "ዩሮ",
    "gbp": "ፓውንድ ስትርሊንግ",
    "£": "ፓውንድ ስትርሊንግ",
}

SYMBOLS = {
    "&": "እና",
    "@": "ኢሜይል",
    "+": "እና",
    "=": "እኩል",
    "/": "ስላስ",
    "#": "ሃሽ",
    "*": "ኮከሪ",
    "~": "እስከ",
    "°": "ዲግሪ",
    "±": "አንስ አመሳጥ ከላሽ",
    "×": "በእጥጥር",
    "÷": "በመካከል",
    "€": "ዩሮ",
    "£": "ፓውንድ ስትርሊንግ",
    "$": "ዶላር",
}

# Letters the cloud Ge'ez voices routinely flatten. Longest-first replacement.
ORTHOGRAPHY: list[tuple[str, str]] = [
    ("ሐ", "ሀ"),   # h- -> h
    ("ኀ", "ሀ"),   # h' -> h
]

# Acronyms as Ethiopians actually say them.
ACRONYMS = {
    "ERP": "ኢ አ ፐ",
    "HR": "ኤች አር",
    "IT": "አይ ቲ",
    "CEO": "ሲ ኢ ኦ",
    "CIO": "ሲ አይ ኦ",
    "API": "ኤ ፐ አይ",
    "SMS": "ኤስ ኤም ኤስ",
    "AI": "ኤ አይ",
    "ICT": "አይ ሲ ቲ",
    "UI": "ዩ አይ",
    "UX": "ዩ ኤክስ",
    "CT": "ሲ ቲ",
    "MRI": "ኤም አር አይ",
    "X-RAY": "ኤክስ ሬይ",
    "ER": "ኢ አር",
    "ICU": "አይ ሲ ዩ",
    "OPD": "ኦ ፒ ዲ",
    "TTS": "ቲ ቲ ኤስ",
    "QMS": "ኪዩ ኤም ኤስ",
    "CRM": "ሲ አር ኤም",
    "KPI": "ኬ ፒ አይ",
    "SLA": "ኤስ ኤል ኤ",
    "VPN": "ቪ ፒ ኤን",
    "LAN": "ኤል ኤን",
    "USB": "ዩ ኤስ ቢ",
    "PDF": "ፒ ዲ ኤፍ",
    "IV": "አይ ቪ",
    "BP": "ቢ ፒ",
    "ER": "ኢ አር",
    "PICC": "ፒ አይ ሲ ሲ",
    "STD": "ኤስ ቲ ዲ",
    "HIV": "ኤች አይ ቪ",
}

# English words that appear inside Amharic sentences. Only applied when the
# text is mixed, so pure English text is never translated.
MIXED_TERMS = {
    "customer support": "የደአንተኛ ድጋፍ",
    "help desk": "የድጋፍ መስለሚያ",
    "call center": "የጥሪት ማዕከል",
    "computer": "ኮምፒዩተር",
    "laptop": "ላፕቶፕ",
    "printer": "ፕሪንተር",
    "scanner": "ስካነር",
    "internet": "ኢንተርኔት",
    "software": "ሶፍትዌር",
    "hardware": "ሃርድዌር",
    "database": "ዳታቤዝ",
    "network": "ኔትወርክ",
    "system": "ሲስተም",
    "application": "አፕሊካሽን",
    "server": "ሰርቨር",
    "password": "ፓስዎርድ",
    "email": "ኢሜይል",
    "website": "ዌብሳይት",
    "file": "ፋይል",
    "report": "ሪፖርት",
    "patient": "ታካሚ",
    "doctor": "ሐኪም",
    "appointment": "ቀጣይ አካያድ",
    "queue": "ሰልፍ",
    "number": "ቁጥር",
    "counter": "መቀበያ ቁጥር",
    "waiting": "መጠበቅ",
    "room": "ክፍል",
    "lancet general hospital": "ላንስት አጠቃላይ ሆስፒታል",
    "lancet": "ላንስት",
    "laboratory": "ላቦራቶሪ",
    "pharmacy": "ፋርማሲ",
    "emergency": "የድንገተኛ",
    "cardiology": "የልብ",
    "pediatrics": "የህጻናት",
    "orthopedics": "የአጥንት",
}

DEFAULT_LEXICON: dict[str, str] = {
    # context-aware letter fixes: archaic wa -> a in common words
    "ዓለም": "አለም",
    "ዓይን": "አይን",
    "ዓገባን": "አገባን",
    "ዓሳን": "አሳን",
    "ዓመት": "አመት",
    # gemination / syllable-final clusters the cloud voice flattens
    "ሰላምም": "ሰላምም",
    "ስምምር": "ስምምር",
    "ጤና": "ጤና",
    # rare letters: give the engine a spelling it handles consistently
    "ጥጥር": "ጥጥር",
    "ጥራት": "ጥራት",
    "ትርክር": "ትርክር",
    "ጥበቃ": "ጥበቃ",
    # organisation
    "lancet general hospital": "ላንስት አጠቃላይ ሆስፒታል",
    "lancet": "ላንስት",
}


# --------------------------------------------------------------------------
# Lexicon (pronunciation dictionary / custom vocabulary)
# --------------------------------------------------------------------------
def load_lexicon() -> dict[str, str]:
    entries = dict(DEFAULT_LEXICON)
    if os.path.exists(LEXICON_PATH):
        try:
            with open(LEXICON_PATH, "r", encoding="utf-8") as fh:
                custom = json.load(fh)
            for key, value in custom.items():
                entries[key] = value["say"] if isinstance(value, dict) else str(value)
        except (OSError, ValueError):
            pass
    return entries


def save_lexicon_entry(word: str, say: str, alternatives: str | None = None) -> dict[str, str]:
    data: dict[str, object] = {}
    if os.path.exists(LEXICON_PATH):
        try:
            with open(LEXICON_PATH, "r", encoding="utf-8") as fh:
                data = json.load(fh)
        except (OSError, ValueError):
            data = {}
    entry: dict[str, str] = {"say": say}
    if alternatives:
        entry["alt"] = alternatives
    data[word.strip()] = entry
    with open(LEXICON_PATH, "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=2)
    return load_lexicon()


LEXICON = load_lexicon()


# --------------------------------------------------------------------------
# Numbers, dates, currency
# --------------------------------------------------------------------------
def number_to_words(value: float | int, lang: str = "am") -> str:
    if lang != "am":
        return str(value)
    if isinstance(value, float) and not value.is_integer():
        whole, frac = f"{value:.2f}".split(".")
        return f"{number_to_amharic(int(whole))} ነጋፋ {number_to_amharic(int(frac))}"
    return number_to_amharic(int(value))


def year_to_words(year: int, lang: str = "am") -> str:
    if lang != "am":
        return str(year)
    return number_to_words(year, lang)


def digit_by_digit(digits: str, lang: str = "am") -> str:
    digits = re.sub(r"\D", "", digits)
    if not digits:
        return ""
    if lang != "am":
        return " ".join(digits)
    return " ".join(DIGIT_NAMES[int(d)] for d in digits)


def ordinal_words(n: int, lang: str = "am") -> str:
    if lang != "am":
        return f"{n}th"
    return ORDINALS.get(n, f"{number_to_amharic(n)}ኛ")


def money_to_words(amount: str, lang: str = "am") -> str:
    match = re.match(r"^\s*([0-9][0-9,._]*)\s*([A-Za-z]{2,3}|[$€£])?\s*$", amount)
    if not match:
        return amount
    raw, cur = match.group(1), match.group(2)
    clean = re.sub(r"[,._]", "", raw)
    try:
        value = float(clean)
    except ValueError:
        return amount
    words = number_to_words(value, lang)
    unit = CURRENCIES.get((cur or "").lower(), "")
    return f"{words} {unit}".strip()


def percent_to_words(amount: str, lang: str = "am") -> str:
    match = re.match(r"^\s*([0-9][0-9,._]*)\s*%\s*$", amount)
    if not match:
        return amount
    clean = re.sub(r"[,._]", "", match.group(1))
    try:
        value = float(clean)
    except ValueError:
        return amount
    if lang != "am":
        return f"{value} percent"
    return f"{number_to_words(value, lang)} በመቶ"


def time_to_words(value: str, lang: str = "am") -> str:
    match = re.match(r"^\s*([0-9]{1,2}):([0-9]{2})\s*([AaPp]\.?[Mm]\.?)?\s*$", value)
    if not match:
        return value
    hour, minute = int(match.group(1)), int(match.group(2))
    suffix = (match.group(3) or "").replace(".", "").lower()
    if hour > 23 or minute > 59:
        return value
    if suffix == "pm" and hour < 12:
        hour += 12
    if suffix == "am" and hour == 12:
        hour = 0
    if lang != "am":
        return f"{hour} {minute}"
    hour_part = "ሰላሳ ስላስ" if hour == 12 else number_to_amharic(hour)
    if minute == 0:
        return f"{hour_part} ሰዓት"
    return f"{hour_part} ሰዓት {number_to_amharic(minute)} ደቂቃ"


def date_to_words(value: str, lang: str = "am") -> str:
    match = re.match(r"^\s*([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})\s*$", value)
    if match:
        year, month, day = int(match.group(1)), int(match.group(2)), int(match.group(3))
    else:
        match = re.match(r"^\s*([0-9]{1,2})/([0-9]{1,2})/([0-9]{4})\s*$", value)
        if not match:
            return value
        day, month, year = int(match.group(1)), int(match.group(2)), int(match.group(3))
    if not 1 <= month <= 12 or not 1 <= day <= 31:
        return value
    if lang != "am":
        return f"{day} {month} {year}"
    month_word = MONTHS.get(month, str(month))
    return f"{month_word} {ordinal_words(day, lang)} {year_to_words(year, lang)} ዓ.ም"


def phone_to_words(value: str, lang: str = "am") -> str:
    digits = re.sub(r"\D", "", value)
    if len(digits) not in (9, 10):
        return value
    if lang != "am":
        return value
    return f"ስልክ {digit_by_digit(digits, lang)}"


# --------------------------------------------------------------------------
# Text normalization
# --------------------------------------------------------------------------
def _fix_orthography(text: str) -> tuple[str, list[str]]:
    notes: list[str] = []
    for bad, good in ORTHOGRAPHY:
        if bad in text:
            notes.append(f"orthography: {bad} -> {good}")
            text = text.replace(bad, good)
    return text, notes


def _apply_lexicon(text: str) -> tuple[str, list[str]]:
    notes: list[str] = []
    for word in sorted(LEXICON, key=len, reverse=True):
        if not word or word == text:
            continue
        pattern = re.compile(
            r"(?<![0-9A-Za-z\u1200-\u137F])" + re.escape(word) + r"(?![0-9A-Za-z\u1200-\u137F])",
            re.IGNORECASE if word.isascii() else 0,
        )
        if pattern.search(text):
            text = pattern.sub(LEXICON[word], text)
            notes.append(f"lexicon: {word} -> {LEXICON[word]}")
    return text, notes


def _expand_acronyms(text: str) -> tuple[str, list[str]]:
    notes: list[str] = []

    def repl(match: re.Match) -> str:
        token = match.group(0)
        spoken = ACRONYMS.get(token) or ACRONYMS.get(token.upper())
        if spoken:
            notes.append(f"acronym: {token} -> {spoken}")
            return spoken
        return token

    text = re.sub(r"\b[A-Z][A-Z0-9]{1,7}\b", repl, text)
    return text, notes


def _expand_technical(text: str) -> tuple[str, list[str]]:
    notes: list[str] = []
    for term in sorted(MIXED_TERMS, key=len, reverse=True):
        pattern = re.compile(r"(?<![A-Za-z])" + re.escape(term) + r"(?![A-Za-z])", re.IGNORECASE)
        if pattern.search(text):
            text = pattern.sub(MIXED_TERMS[term], text)
            notes.append(f"term: {term} -> {MIXED_TERMS[term]}")
    return text, notes


def _expand_symbols(text: str) -> tuple[str, list[str]]:
    notes: list[str] = []
    for symbol, spoken in SYMBOLS.items():
        if symbol in text:
            text = text.replace(symbol, f" {spoken} ")
            notes.append(f"symbol: {symbol} -> {spoken}")
    return re.sub(r"\s{2,}", " ", text), notes


LETTER_NAMES = {
    "A": "ኤ", "B": "ቢ", "C": "ሲ", "D": "ዲ", "E": "ኢ", "F": "ኤፍ", "G": "ጅ",
    "H": "ኤች", "I": "አይ", "J": "ጀይ", "K": "ኬ", "L": "ኤል", "M": "ኤም", "N": "ኤን",
    "O": "ኦ", "P": "ፒ", "Q": "ኪዩ", "R": "አር", "S": "ኤስ", "T": "ቲ", "U": "ዩ",
    "V": "ቪ", "W": "ዳብሉዩ", "X": "ኤክስ", "Y": "ዋይ", "Z": "ዘድ",
}


def _expand_ids(text: str, lang: str) -> tuple[str, list[str]]:
    """P-42 -> ፒ አርባ ሁለት, CARD-102 -> ካርድ መቶ ሁለት"""
    if lang != "am":
        return text, []
    notes: list[str] = []

    def repl(match: re.Match) -> str:
        prefix, digits = match.group(1), match.group(2)
        if len(prefix) == 1:
            spoken = LETTER_NAMES.get(prefix.upper(), prefix)
        else:
            spoken = DEPT_PREFIX_TO_AMHARIC.get(prefix.upper(), prefix)
        value = number_to_amharic(int(digits))
        notes.append(f"id: {match.group(0)} -> {spoken} {value}")
        return f"{spoken} {value}"

    return re.sub(r"\b([A-Za-z]{1,6})[-_](\d{1,6})\b", repl, text), notes


def _expand_numbers(text: str, lang: str) -> tuple[str, list[str]]:
    notes: list[str] = []
    if lang != "am":
        return text, notes

    def sub(pattern: str, handler, label: str):
        nonlocal text

        def repl(match: re.Match) -> str:
            converted = handler(match.group(0))
            if converted != match.group(0):
                notes.append(f"{label}: {match.group(0)} -> {converted}")
            return converted

        text = re.sub(pattern, repl, text)

    sub(r"\b\d{1,2}:\d{2}(?:\s?[AaPp]\.?[Mm]\.?)?", time_to_words, "time")
    sub(r"\b\d{4}-\d{1,2}-\d{1,2}\b", date_to_words, "date")
    sub(r"\b\d{1,2}/\d{1,2}/\d{4}\b", date_to_words, "date")
    sub(r"(?:\+?251|0)\d{8,9}\b", phone_to_words, "phone")
    sub(r"[0-9][0-9,._]*\s*(?:ETB|USD|EUR|GBP|ብር|\$|€|£)\b", money_to_words, "currency")
    sub(r"[0-9][0-9,._]*\s*%", percent_to_words, "percent")
    sub(r"\d+[ኛችም፡፪፫፬፭፮፯፰]\b", lambda m: ordinal_words(int(m[:-1]), lang), "ordinal")
    text, id_notes = _expand_ids(text, lang)
    notes += id_notes
    sub(r"\b\d[\d,._]*\b", lambda m: number_to_words(_to_number(m), lang), "number")
    return text, notes


def _to_number(raw: str) -> float | int:
    clean = re.sub(r"[,._]", "", raw)
    try:
        value = float(clean)
    except ValueError:
        return 0
    return int(value) if value.is_integer() else value


def _clean_spacing(text: str) -> str:
    text = re.sub(r"\s+([,.;:!?።፣፧])", r"\1", text)
    text = re.sub(r"([።፣])(?=[^\s\d])", r"\1 ", text)
    return re.sub(r"[ \t]{2,}", " ", text).strip()


def has_speech(text: str) -> bool:
    if not text:
        return False
    if not re.search(r"\S", text):
        return False
    s = text
    s = re.sub(r"[፡።፣፤፥፦፧፨.,!?;:]+", "", s)
    s = re.sub(r"[\s\r\n\t]+", "", s)
    if not s:
        return False
    if re.search(r"[\u1200-\u137FA-Za-z0-9]", s):
        return True
    return False


# --------------------------------------------------------------------------
# Prosody: sentence splitting, questions, pauses, adaptive rate
# --------------------------------------------------------------------------
@dataclass
class Segment:
    text: str
    rate: str = "+0%"
    pitch: str = "+0Hz"
    pause_after: int = 0
    lang: str = "am"


def detect_lang(text: str, fallback: str = "am") -> str:
    """Pick the speech language for one sentence.

    Ethiopic script is always Amharic. Latin-only text keeps the requested
    fallback when the user explicitly chose en/om, otherwise it is English,
    so an English sentence never gets an Amharic accent.
    """
    if re.search(r"[\u1200-\u137F]", text or ""):
        return "am"
    if re.search(r"[A-Za-z]", text or ""):
        return fallback if fallback in ("en", "om") else "en"
    return fallback if fallback in ("am", "en", "om") else "am"


@dataclass
class Normalized:
    text: str
    segments: list[Segment] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)

    def as_dict(self) -> dict:
        return {
            "text": self.text,
            "segments": [
                {
                    "text": s.text,
                    "rate": s.rate,
                    "pitch": s.pitch,
                    "pause_after": s.pause_after,
                    "lang": s.lang,
                }
                for s in self.segments
            ],
            "notes": self.notes,
        }


QUESTION_WORDS = ("እንው", "ነው", "ናት", "አለ", "ደህና", "ማን", "መቼ", "ትኛር", "እንደምን")


def _split_sentences(text: str) -> list[str]:
    # only break on Amharic sentence marks, or on "." that is followed by a
    # capitalised token - never inside abbreviations such as "ዓ.ም" or "Dr."
    parts = re.split(r"(?<=[።፧!?])\s+|(?<=\.)\s+(?=[A-Z\"'(])", text)
    sentences: list[str] = []
    for part in parts:
        part = part.strip()
        if not part:
            continue
        if len(part) > 240:
            clauses = re.split(r"(?<=[፣,])\s+", part)
            buf = ""
            for clause in clauses:
                if len(buf) + len(clause) > 200 and buf:
                    sentences.append(buf.strip())
                    buf = clause
                else:
                    buf = f"{buf} {clause}".strip()
            if buf:
                sentences.append(buf.strip())
        else:
            sentences.append(part)
    return sentences


def _is_question(sentence: str) -> bool:
    if sentence.endswith(("፧", "?")):
        return True
    for word in QUESTION_WORDS:
        # whole-token match only: "ማን" must not match inside "ስማንያ"
        if re.search(r"(?<![\u1200-\u137F])" + re.escape(word) + r"(?![\u1200-\u137F])", sentence):
            return True
    return False


RARE_LETTERS = "ፀጸጽግዝፍዥ"


def _difficulty(sentence: str) -> int:
    """0 = easy, 1 = normal, 2 = hard (slow it down)."""
    rare = sum(sentence.count(ch) for ch in RARE_LETTERS)
    latin = len(re.findall(r"[A-Za-z]{4,}", sentence))
    digits = len(re.findall(r"\d", sentence))
    if rare >= 2 or latin >= 2 or digits >= 4:
        return 2
    if rare or latin or digits:
        return 1
    return 0


def _pace_hard_words(sentence: str) -> str:
    """Micro-pause after rare-letter words and long Latin words."""
    sentence = re.sub(
        r"([\u1200-\u137F]*[" + RARE_LETTERS + r"][\u1200-\u137F]*)(?=\s)(?!\s*[,.;:!?።፣፧])",
        r"\1፣",
        sentence,
    )

    sentence = re.sub(
        r"\b([A-Za-z]{8,})\b(?!\s*[,.;:!?።፣፧])",
        r"\1፣",
        sentence,
    )
    return re.sub(r"፣\s*፣", "፣", sentence)


def _pause_text(pause: int) -> str:
    return "።" * max(0, pause)


def _split_long(sentence: str, limit: int = 220) -> list[str]:
    if len(sentence) <= limit:
        return [sentence]
    words = sentence.split()
    chunks: list[str] = []
    buf = ""
    for word in words:
        if len(buf) + len(word) + 1 > limit and buf:
            chunks.append(buf)
            buf = word
        else:
            buf = f"{buf} {word}".strip()
    if buf:
        chunks.append(buf)
    return chunks


def normalize(
    text: str,
    lang: str = "am",
    style: str = DEFAULT_STYLE,
    pause: int = 1,
    adaptive: bool = True,
    base_rate: int = -10,
    base_pitch: int = 0,
    apply_numbers: bool = True,
) -> Normalized:
    """Full pipeline: per-sentence language, orthography, lexicon, numbers,
    symbols, prosody."""
    original = text
    notes: list[str] = []

    if not text or not text.strip():
        return Normalized(text="", segments=[], notes=[])

    style_key = style if style in STYLES else DEFAULT_STYLE
    style_rate = STYLES[style_key]["rate"]
    style_pitch = STYLES[style_key]["pitch"]

    segments: list[Segment] = []
    sentences = _split_sentences(text)
    for index, sentence in enumerate(sentences):
        # Detect first, so each sentence is normalised in its own language.
        seg_lang = detect_lang(sentence, lang)

        working, sub_notes = _fix_orthography(sentence)
        notes += sub_notes
        working, sub_notes = _apply_lexicon(working)
        notes += sub_notes

        is_mixed = bool(re.search(r"[\u1200-\u137F]", working)) and bool(re.search(r"[A-Za-z]{3,}", working))
        # Amharic-only expansions: English/Oromo sentences keep their digits,
        # acronyms and symbols so the native voice reads them naturally.
        if seg_lang == "am" and is_mixed:
            working, sub_notes = _expand_technical(working)
            notes += sub_notes
        if seg_lang == "am":
            working, sub_notes = _expand_acronyms(working)
            notes += sub_notes
            if apply_numbers:
                working, sub_notes = _expand_numbers(working, seg_lang)
                notes += sub_notes
            working, sub_notes = _expand_symbols(working)
            notes += sub_notes
        working = _clean_spacing(working)

        question = _is_question(working)
        if question and not working.endswith(("፧", "?")):
            working = working.rstrip("።.") + "፧"
            notes.append("prosody: question mark added")
        elif not question and seg_lang == "am" and not working.endswith(("።", ".", "?", "፧")):
            working += "።"

        if adaptive and seg_lang == "am":
            working = _pace_hard_words(working)

        difficulty = _difficulty(working) if (adaptive and seg_lang == "am") else 0
        rate_delta = style_rate + {0: 4, 1: 0, 2: -8}[difficulty]
        pitch_delta = style_pitch + {0: 1, 1: 0, 2: -3}[difficulty]

        is_last = index == len(sentences) - 1
        pause_after = 0 if is_last else max(0, pause - 1)

        for piece in _split_long(working):
            segments.append(
                Segment(
                    text=piece,
                    rate=f"{max(-80, min(100, base_rate + rate_delta)):+d}%",
                    pitch=f"{max(-100, min(100, base_pitch + pitch_delta)):+d}Hz",
                    pause_after=pause_after,
                    lang=seg_lang,
                )
            )

    if not segments:
        segments = [Segment(text=original, lang=detect_lang(original, lang))]

    result = Normalized(text=" ".join(s.text for s in segments), segments=segments, notes=notes)
    drop_unspeakable(result)
    return result


def drop_unspeakable(result: Normalized) -> Normalized:
    """Remove punctuation-only fragments, carrying their pause to the survivor."""
    kept: list[Segment] = []
    dropped = 0
    pending_pause = 0

    for segment in result.segments:
        if has_speech(segment.text):
            segment.pause_after = max(segment.pause_after, pending_pause)
            pending_pause = 0
            kept.append(segment)
        else:
            dropped += 1
            pending_pause = max(pending_pause, segment.pause_after)

    if dropped:
        result.segments = kept
        result.notes.append(f"skipped {dropped} fragment(s) with no speakable content")
    if kept:
        result.text = " ".join(s.text for s in kept)
    return result


def normalize_for_speech(
    text: str,
    lang: str = "am",
    style: str = DEFAULT_STYLE,
    pause: int = 1,
    rate: str = "-10%",
    pitch: str = "+0Hz",
    adaptive: bool = True,
    normalize_text: bool = True,
    age_rate_delta: int = 0,
    age_pitch_delta: int = 0,
) -> Normalized:
    """Normalize + apply the age profile to every segment."""
    def as_int(value: str) -> int:
        match = re.search(r"[-+]?\d+", str(value))
        return int(match.group()) if match else 0

    if not normalize_text:
        result = Normalized(
            text=text,
            segments=[
                Segment(
                    text=text,
                    rate=f"{max(-80, min(100, as_int(rate))):+d}%",
                    pitch=f"{max(-100, min(100, as_int(pitch))):+d}Hz",
                )
            ],
        )
        return drop_unspeakable(result)

    result = normalize(
        text,
        lang=lang,
        style=style,
        pause=pause,
        adaptive=adaptive,
        base_rate=as_int(rate),
        base_pitch=as_int(pitch),
    )

    for segment in result.segments:
        segment.rate = f"{max(-80, min(100, as_int(segment.rate) + age_rate_delta)):+d}%"
        segment.pitch = f"{max(-100, min(100, as_int(segment.pitch) + age_pitch_delta)):+d}Hz"
    return result
