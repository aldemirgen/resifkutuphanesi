#!/usr/bin/env python3
"""
Convert American units to metric in species JSON files.
  inches  -> cm   (1 in = 2.54 cm)
  gallons -> L    (1 gal = 3.785 L)
  °F      -> °C   ((F-32) * 5/9)
"""

import json
import re
import os
import math

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
FILES = ["marine-fish.json", "corals.json", "marine-invertebrates.json"]


# ---------------------------------------------------------------------------
# Conversion helpers
# ---------------------------------------------------------------------------

def f_to_c(f):
    return round((f - 32) * 5 / 9, 1)


def in_to_cm(inches):
    return round(inches * 2.54, 1)


def gal_to_l(gal):
    """Round gallons to nearest 'nice' liter value."""
    liters = gal * 3.785
    # Round to nearest 5 for readability
    return int(round(liters / 5) * 5) if liters >= 10 else round(liters, 1)


# ---------------------------------------------------------------------------
# Field converters
# ---------------------------------------------------------------------------

def fmt_temp(val):
    """Format temperature: 22.2 -> '22,2', 22.0 -> '22'"""
    if val == int(val):
        return str(int(val))
    return str(val).replace(".", ",")


def convert_temperature(temp_str):
    """
    '72-78°F'       -> '22,2-25,6°C'
    '75°F'          -> '23,9°C'
    '22.2-25.6°C'   -> '22,2-25,6°C'  (fix dot->comma for already converted)
    """
    if not temp_str:
        return temp_str

    # Already Celsius but with dot decimals -> convert dots to commas
    if "°C" in temp_str:
        # Replace decimal dots in numbers (not affecting the ° symbol)
        return re.sub(r"(\d)\.(\d)", r"\1,\2", temp_str)

    # Range: 72-78°F
    m = re.search(r"(\d+)\s*[-–]\s*(\d+)\s*°?\s*F", temp_str)
    if m:
        lo, hi = int(m.group(1)), int(m.group(2))
        return f"{fmt_temp(f_to_c(lo))}-{fmt_temp(f_to_c(hi))}°C"

    # Single: 75°F
    m = re.search(r"(\d+)\s*°?\s*F", temp_str)
    if m:
        return f"{fmt_temp(f_to_c(int(m.group(1))))}°C"

    return temp_str


FRACTIONS = {
    "½": 0.5, "¼": 0.25, "¾": 0.75,
    "⅓": 1/3, "⅔": 2/3, "⅛": 0.125,
}

def normalize_size_str(s):
    """Replace fraction chars and foot marks for easier parsing."""
    for frac, val in FRACTIONS.items():
        # e.g. "5½" -> "5.5"
        s = re.sub(rf"(\d)\s*{frac}", lambda m: str(float(m.group(1)) + val), s)
        # standalone fraction
        s = s.replace(frac, str(val))
    # Convert feet+inches: 2'6" -> 30"
    def feet_to_inches(m):
        ft = int(m.group(1))
        inch = float(m.group(2)) if m.group(2) else 0
        return f"{ft * 12 + inch}\""
    s = re.sub(r"(\d+)'\s*([\d.]+)?\"?", feet_to_inches, s)
    # lone foot mark: 1' -> 12"
    s = re.sub(r"(\d+)'(?!\")", lambda m: f"{int(m.group(1))*12}\"", s)
    return s


def convert_max_size(size_str):
    """
    '3"'          -> '7,6 cm'
    '3 inches'    -> '7,6 cm'
    '1.5"'        -> '3,8 cm'
    '5½"'         -> '14 cm'
    '6-8"'        -> '15,2-20,3 cm'
    'Up to 12"'   -> 'Maks. 30,5 cm'
    "1'"          -> '30,5 cm'
    """
    if not size_str or "cm" in size_str.lower():
        return size_str

    s = normalize_size_str(size_str.strip())

    # Range: 6-8" or 6-8 inches
    m = re.search(r"([\d.]+)\s*[-–]\s*([\d.]+)\s*(?:\"|inches?|in\b)", s, re.IGNORECASE)
    if m:
        lo = in_to_cm(float(m.group(1)))
        hi = in_to_cm(float(m.group(2)))
        return f"{fmt_cm(lo)}-{fmt_cm(hi)} cm"

    # "Up to X"" or "Max X""
    m = re.search(r"(?:up\s*to|max\.?)\s*([\d.]+)\s*(?:\"|inches?|in\b)", s, re.IGNORECASE)
    if m:
        return f"Maks. {fmt_cm(in_to_cm(float(m.group(1))))} cm"

    # Single value: 3" or 3 inches or 3 in
    m = re.search(r"([\d.]+)\s*(?:\"|inches?|in\b)", s, re.IGNORECASE)
    if m:
        return f"{fmt_cm(in_to_cm(float(m.group(1))))} cm"

    return size_str


def convert_tank_size(tank_str):
    """
    '30 gallons'    -> '115 L'
    '10 gallon'     -> '40 L'
    '125+ gallons'  -> '475+ L'
    """
    if not tank_str or " L" in tank_str or "litre" in tank_str.lower():
        return tank_str

    s = tank_str.strip()

    # "125+ gallons"
    m = re.search(r"([\d,]+)\+?\s*gallons?", s, re.IGNORECASE)
    if m:
        gal = float(m.group(1).replace(",", ""))
        plus = "+" if "+" in s else ""
        return f"{gal_to_l(gal)}{plus} L"

    return tank_str


def fmt_cm(val):
    """Format cm value with comma decimal (Turkish style) and no unnecessary .0"""
    if val == int(val):
        return str(int(val))
    return str(val).replace(".", ",")


def convert_water_params(wp):
    """Convert the water_params dict in place."""
    if not wp:
        return wp

    result = dict(wp)

    # Temperature
    if result.get("temperature"):
        result["temperature"] = convert_temperature(result["temperature"])

    # SG stays as-is (already metric-ish)

    return result


# ---------------------------------------------------------------------------
# Process one species record
# ---------------------------------------------------------------------------

def convert_species(s):
    s["max_size"] = convert_max_size(s.get("max_size", ""))
    s["min_tank_size"] = convert_tank_size(s.get("min_tank_size", ""))
    s["water_params"] = convert_water_params(s.get("water_params", {}))
    return s


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    for filename in FILES:
        filepath = os.path.join(DATA_DIR, filename)
        if not os.path.exists(filepath):
            print(f"[SKIP] {filename} not found")
            continue

        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)

        converted = [convert_species(s) for s in data]

        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(converted, f, ensure_ascii=False, indent=2)

        print(f"[OK] {filename}: {len(converted)} species converted")

        # Print a few samples
        samples = [s for s in converted if s.get("max_size") or s.get("min_tank_size")][:3]
        for s in samples:
            print(f"  {s['name']}")
            print(f"    max_size:      {s.get('max_size')}")
            print(f"    min_tank_size: {s.get('min_tank_size')}")
            print(f"    temperature:   {s.get('water_params', {}).get('temperature')}")


if __name__ == "__main__":
    main()
