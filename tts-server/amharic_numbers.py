"""
Amharic Number Converter
Converts integers 0-999,999+ into properly written Amharic text.
Handles: singles, teens, tens, compounds, hundreds, thousands.
"""

ONES = {
    0: "ዜሮ",
    1: "አንድ",
    2: "ሁለት",
    3: "ሶስት",
    4: "አራት",
    5: "አምስት",
    6: "ስድስት",
    7: "ሰባት",
    8: "ስምንት",
    9: "ዘጠኝ",
}

TEENS = {
    10: "አስር",
    11: "አስራ አንድ",
    12: "አስራ ሁለት",
    13: "አስራ ሦስት",
    14: "አስራ አራት",
    15: "አስራ አምስት",
    16: "አስራ ስድስት",
    17: "አስራ ሰባት",
    18: "አስራ ስምንት",
    19: "አስራ ዘጠኝ",
}

TENS = {
    20: "ሀያ",
    30: "ሰላሳ",
    40: "አርባ",
    50: "ሀምሳ",
    60: "ስድሳ",
    70: "ሰባ",
    80: "ሰማንያ",
    90: "ዘጠና",
}

DEPT_PREFIX_TO_AMHARIC = {
    "CARD": "የልብ",
    "PEDS": "የህጻናት",
    "ORTHO": "የአጥንት",
    "GEN": "አጠቃላይ",
    "NEURO": "የነርቭ",
    "ONCO": "የዐንክሎክ",
    "OBGYN": "የሴቶች",
    "ENT": "የትንኝ",
    "DERM": "የቆዳ",
    "OPHT": "የአይን",
    "EMER": "የድንገተኛ",
    "RADIO": "የሬዲዮሎጂ",
    "LAB": "የላቦራቶሪ",
    "PHARM": "ፋርማሲ",
    "R": "ምዝገባ",
}


def _convert_chunk(n: int) -> str:
    """Convert 0-999 into Amharic."""
    if n == 0:
        return ""

    if n < 10:
        return ONES[n]

    if 10 <= n < 20:
        return TEENS[n]

    if n < 100:
        tens = (n // 10) * 10
        ones = n % 10
        if ones == 0:
            return TENS[tens]
        return f"{TENS[tens]} {ONES[ones]}"

    if n < 1000:
        hundreds = n // 100
        remainder = n % 100
        if hundreds == 1:
            prefix = "መቶ"
        else:
            prefix = f"{ONES[hundreds]} መቶ"
        if remainder == 0:
            return prefix
        return f"{prefix} {_convert_chunk(remainder)}"

    if n < 1000000:
        thousands = n // 1000
        remainder = n % 1000
        if thousands == 1:
            prefix = "ሺህ"
        else:
            prefix = f"{_convert_chunk(thousands)} ሺህ"
        if remainder == 0:
            return prefix
        return f"{prefix} {_convert_chunk(remainder)}"

    return str(n)


def number_to_amharic(n: int) -> str:
    """Convert any non-negative integer to Amharic text."""
    if n < 0:
        return str(n)
    result = _convert_chunk(n)
    return result if result else "ዜሮ"


def ticket_to_amharic(ticket_id: str) -> str:
    """
    Convert a ticket ID like 'P-42' or 'CARD-102' to Amharic speech text.

    P-42      -> ቁጥር አርባ ሁለት
    CARD-102  -> ካርድ መቶ ሁለት
    """
    ticket_id = ticket_id.strip()

    if "-" in ticket_id:
        prefix, num_part = ticket_id.split("-", 1)
    else:
        import re
        m = re.match(r"^([A-Za-z]+)(\d+)$", ticket_id)
        if m:
            prefix = m.group(1)
            num_part = m.group(2)
        else:
            prefix = ""
            num_part = ticket_id

    if not num_part.isdigit():
        return ticket_id

    num = int(num_part)
    amharic_num = number_to_amharic(num)

    if prefix.upper() == "P":
        return amharic_num

    if prefix:
        dept = DEPT_PREFIX_TO_AMHARIC.get(prefix.upper(), prefix)
        return f"{dept} {amharic_num}"

    return amharic_num


def build_queue_announcement(
    ticket_id: str,
    counter: str | int,
    lang: str = "am",
    department: str | None = None,
) -> str:
    """
    Build a full queue announcement sentence.

    am: እንግዳ ቁጥር <ticket> ወደ [dept] መቀበያ ቁጥር <counter> ይምጡ
    om: Konii <ticket> gara [dept] kabala <counter> keessaatti fudhamaa
    en: Patient number <ticket>, please proceed to counter number <counter>
    """
    ticket_text = ticket_to_amharic(ticket_id)
    counter_text = number_to_amharic(int(counter)) if str(counter).isdigit() else str(counter)

    dept_label_am = ""
    dept_label_om = ""
    if department:
        dept_label_am = {
            "General Medicine": "አጠቃላይ", "Cardiology": "የልብ", "Pediatrics": "የህጻናት",
            "Orthopedics": "የአጥንት", "Neurology": "የነርቭ", "Emergency": "የድንገተኛ",
            "Oncology": "የዐንክሎክ", "Gynecology": "የሴቶች", "ENT": "የትንኝ",
            "Dermatology": "የቆዳ", "Ophthalmology": "የአይን", "Radiology": "የሬዲዮሎጂ",
            "Laboratory": "የላቦራቶሪ", "Pharmacy": "ፋርማሲ",
        }.get(department, "")
        dept_label_om = {
            "General Medicine": "Waliigalaa", "Cardiology": "Onnee",
            "Pediatrics": "Daa'immanii", "Orthopedics": "Lafii",
            "Neurology": "Nerwee", "Emergency": "Bal'ina",
        }.get(department, "")

    if lang == "am":
        dept_part = f"{dept_label_am} " if dept_label_am else ""
        return f"እንግዳ ቁጥር {ticket_text} ወደ {dept_part}መቀበያ ቁጥር {counter_text} ይምጡ"
    if lang == "om":
        dept_part = f"{dept_label_om} " if dept_label_om else ""
        return f"Konii {ticket_text} gara {dept_part}kabala {counter_text} keessaatti fudhamaa"

    return f"Patient number {ticket_id}, please proceed to counter number {counter}"


if __name__ == "__main__":
    print("=== Amharic Number Converter Test ===\n")

    test_numbers = [0, 1, 5, 9, 10, 11, 15, 19, 20, 21, 25, 30, 42, 55, 63, 70, 85, 99, 100, 142, 250, 365, 999, 1000, 1452, 5000, 9999, 10000, 50000, 100000, 999999]
    for n in test_numbers:
        print(f"  {n:>6}  ->  {number_to_amharic(n)}")

    print("\n=== Ticket Conversion Test ===\n")

    test_tickets = [
        ("P-1", 3),
        ("P-2", 1),
        ("P-3", 3),
        ("P-42", 4),
        ("P-100", 2),
        ("P-105", "Room 1"),
    ]

    for ticket, counter in test_tickets:
        am = build_queue_announcement(ticket, counter, "am")
        print(f"  {ticket:>12}  counter={counter}")
        print(f"  {am}\n")
