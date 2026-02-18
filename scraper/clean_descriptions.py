#!/usr/bin/env python3
"""
Remove "Approximate Purchase Size" and similar purchase/shipping text
from description and description_tr fields in all JSON files.
"""

import io
import json
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, "data")
FILES = ["marine-fish.json", "corals.json", "marine-invertebrates.json"]

# Patterns to strip (everything FROM the match to end of string)
# English patterns
EN_PATTERNS = [
    r"Approximate Purchase Size[^.]*?:.*",
    r"Approx\.\s*Purchase Size[^.]*?:.*",
    r"Please\s+note\s+that\s+all\s+sizes\s+are\s+approximate.*",
    r"We\s+guarantee\s+our\s+livestock.*",
]

# Turkish patterns (translated versions)
TR_PATTERNS = [
    r"(?:Yaklaşık\s+)?Satın\s+Alma\s+Boyutu[^.]*?:.*",
    r"Yaklaşık\s+Satın\s+Alma\s+Boyutu.*",
    r"Tam\s+Genişlediğinde\s+Yaklaşık.*",
    r"Tüm\s+boyutların\s+yaklaşık\s+olduğunu\s+lütfen.*",
    r"Canlı\s+stoğumuzu\s+garanti\s+ediyoruz.*",
    r"Lütfen\s+tüm\s+boyutların\s+yaklaşık.*",
]

def clean_text(text, patterns):
    if not text:
        return text
    for pattern in patterns:
        text = re.sub(pattern, "", text, flags=re.IGNORECASE | re.DOTALL)
    return text.strip()

def process_file(filename):
    filepath = os.path.join(DATA_DIR, filename)
    if not os.path.exists(filepath):
        print(f"[SKIP] {filename}")
        return

    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    cleaned_count = 0
    for species in data:
        changed = False

        orig_desc = species.get("description", "")
        new_desc = clean_text(orig_desc, EN_PATTERNS)
        if new_desc != orig_desc:
            species["description"] = new_desc
            changed = True

        orig_tr = species.get("description_tr", "")
        new_tr = clean_text(orig_tr, TR_PATTERNS)
        if new_tr != orig_tr:
            species["description_tr"] = new_tr
            changed = True

        if changed:
            cleaned_count += 1

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"[OK] {filename}: {cleaned_count}/{len(data)} descriptions cleaned")

def main():
    print("=" * 50)
    print("  Cleaning purchase size text from descriptions")
    print("=" * 50)
    for fname in FILES:
        process_file(fname)
    print("[DONE]")

if __name__ == "__main__":
    main()
