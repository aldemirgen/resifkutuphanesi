#!/usr/bin/env python3
"""
LiveAquaria.com Species Data Scraper
Collects care information for Marine Fish, Corals, and Marine Invertebrates.

Changes:
- Species names are NOT translated (proper nouns) - name_tr = name
- Descriptions and feeding text are translated to Turkish via Google Translate
- Proper parsing of LiveAquaria's quick_stat_entry structure
"""

import json
import os
import re
import sys
import time
import random
import urllib.parse
import urllib.request
from urllib.parse import urljoin

# Fix Windows console encoding
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

import requests
from bs4 import BeautifulSoup
from tqdm import tqdm

BASE_URL = "https://www.liveaquaria.com"
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DATA_DIR, exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}

SESSION = requests.Session()
SESSION.headers.update(HEADERS)

# ---------------------------------------------------------------------------
# Turkish Translation Dictionaries (structured fields only - NOT species names)
# ---------------------------------------------------------------------------

CARE_LEVEL_TR = {
    "Easy": "Kolay",
    "Moderate": "Orta",
    "Difficult": "Zor",
    "Expert Only": "Sadece Uzman",
    "Expert": "Uzman",
}

TEMPERAMENT_TR = {
    "Peaceful": "Barışçıl",
    "Semi-aggressive": "Yarı Saldırgan",
    "Semi-Aggressive": "Yarı Saldırgan",
    "Aggressive": "Saldırgan",
    "Community Safe": "Topluluk Güvenli",
}

DIET_TR = {
    "Omnivore": "Hepçil",
    "Herbivore": "Otçul",
    "Carnivore": "Etçil",
    "Planktivore": "Planktoncu",
    "Filter Feeder": "Filtre Besleyici",
    "Photosynthetic": "Fotosentetik",
}

REEF_COMPAT_TR = {
    "Yes": "Evet",
    "No": "Hayır",
    "With Caution": "Dikkatli Olunmalı",
    "Monitor": "İzlenmeli",
}

CATEGORIES = [
    {
        "name": "Marine Fish",
        "name_tr": "Deniz Balıkları",
        "slug": "marine-fish",
        "url": "/category/15/marine-fish",
        "cat_param": "c=15",
    },
    {
        "name": "Corals",
        "name_tr": "Mercanlar",
        "slug": "corals",
        "url": "/category/597/coral",
        "cat_param": "c=597",
    },
    {
        "name": "Marine Invertebrates",
        "name_tr": "Deniz Omurgasızları",
        "slug": "marine-invertebrates",
        "url": "/category/497/marine-invert-plant",
        "cat_param": "c=497",
    },
]

# Skip these subcategory patterns (collection/sale pages, not species)
SKIP_SUBCATEGORY_PATTERNS = [
    "value pack", "sale", "customer favorite", "nano fish",
    "beginners", "captive-bred fish", "tank-raised fish",
    "africa", "brackish", "popular",
]


# ---------------------------------------------------------------------------
# Translation via Google Translate free endpoint
# ---------------------------------------------------------------------------

_translate_cache = {}

# Set of all known species names — populated at startup from existing JSON files.
# Used to protect species names from being translated inside description text.
_known_species_names = set()


def load_known_species_names():
    """Load all species names from existing JSON data files into _known_species_names."""
    global _known_species_names
    files = ["marine-fish.json", "corals.json", "marine-invertebrates.json"]
    for fname in files:
        fpath = os.path.join(DATA_DIR, fname)
        if not os.path.exists(fpath):
            continue
        try:
            with open(fpath, "r", encoding="utf-8") as f:
                data = json.load(f)
            for s in data:
                name = s.get("name", "")
                if name:
                    _known_species_names.add(name.strip())
        except Exception:
            pass


def _protect_names(text, extra_names=None):
    """Replace known species names in text with numbered placeholders.

    Returns (protected_text, placeholder_map) where placeholder_map maps
    each placeholder back to the original name.
    """
    placeholder_map = {}
    protected = text

    # Build sorted list (longest first to avoid partial replacements)
    names = sorted(_known_species_names, key=len, reverse=True)
    if extra_names:
        for n in sorted(extra_names, key=len, reverse=True):
            if n and n not in names:
                names.insert(0, n)

    idx = 0
    for name in names:
        if not name or len(name) < 4:
            continue
        # Case-insensitive search, preserve placeholder as non-translatable token
        pattern = re.compile(re.escape(name), re.IGNORECASE)
        if pattern.search(protected):
            placeholder = f"SPNAME{idx}X"
            # Store the first matched casing for restoration
            match = pattern.search(protected)
            placeholder_map[placeholder] = match.group(0)
            protected = pattern.sub(placeholder, protected)
            idx += 1

    return protected, placeholder_map


def _restore_names(text, placeholder_map):
    """Restore species names from placeholders after translation."""
    result = text
    for placeholder, original in placeholder_map.items():
        # Google Translate may add spaces around or alter casing of placeholders
        # Try a few variants
        for variant in [placeholder, placeholder.lower(), placeholder.upper(),
                        placeholder.replace("X", " X"), placeholder.replace("X", "x")]:
            result = result.replace(variant, original)
    return result


def translate_to_turkish(text, retries=3, extra_names=None):
    """Translate English text to Turkish using Google Translate free API.

    Species names (from _known_species_names + extra_names) are protected
    from translation using placeholders.
    """
    if not text or not text.strip():
        return text

    text = text.strip()

    # Protect known species names with placeholders before translating
    protected_text, placeholder_map = _protect_names(text, extra_names)

    # Check cache (use protected text as key)
    cache_key = protected_text
    if cache_key in _translate_cache:
        translated = _translate_cache[cache_key]
        return _restore_names(translated, placeholder_map)

    # Limit text length
    send_text = protected_text
    if len(send_text) > 4000:
        send_text = send_text[:4000]

    for attempt in range(retries):
        try:
            encoded = urllib.parse.quote(send_text)
            url = (
                f"https://translate.googleapis.com/translate_a/single"
                f"?client=gtx&sl=en&tl=tr&dt=t&q={encoded}"
            )
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))

            # Response structure: [[[translated, original, ...], ...], ...]
            translated_parts = []
            if data and data[0]:
                for segment in data[0]:
                    if segment and segment[0]:
                        translated_parts.append(segment[0])
            translated = "".join(translated_parts)
            _translate_cache[cache_key] = translated
            return _restore_names(translated, placeholder_map)

        except Exception as e:
            if attempt < retries - 1:
                time.sleep(2)
            else:
                print(f"    [Translation error]: {e}")
                return text  # Return original on failure

    return text


def translate_field(value, dictionary):
    """Translate a structured field value using a dictionary."""
    if not value:
        return value
    val = value.strip()
    if val in dictionary:
        return dictionary[val]
    for k, v in dictionary.items():
        if k.lower() == val.lower():
            return v
    return val


# ---------------------------------------------------------------------------
# Rate limiting
# ---------------------------------------------------------------------------

def rate_limit(min_sec=1.0, max_sec=2.5):
    time.sleep(random.uniform(min_sec, max_sec))


def translate_delay():
    """Small delay after translation to be polite to Google."""
    time.sleep(random.uniform(0.3, 0.7))


# ---------------------------------------------------------------------------
# Fetching
# ---------------------------------------------------------------------------

def fetch(url, retries=3):
    """Fetch a URL and return BeautifulSoup, or None on failure."""
    full_url = urljoin(BASE_URL, url) if not url.startswith("http") else url
    for attempt in range(retries):
        try:
            resp = SESSION.get(full_url, timeout=30)
            resp.raise_for_status()
            return BeautifulSoup(resp.text, "lxml")
        except Exception as e:
            print(f"  [Attempt {attempt+1}/{retries}] Error fetching {full_url}: {e}")
            if attempt < retries - 1:
                time.sleep(3 * (attempt + 1))
    return None


# ---------------------------------------------------------------------------
# Category & subcategory discovery
# ---------------------------------------------------------------------------

def get_subcategories(category):
    """Get all real subcategory URLs for a given category."""
    soup = fetch(category["url"])
    if not soup:
        return []

    cat_id = category["url"].split("/")[2]  # e.g. '15' from '/category/15/...'
    param = f"c={cat_id}"

    seen = set()
    subcategories = []

    for link in soup.select(f"a[href*='{param}']"):
        href = link.get("href", "")
        text = link.get_text(strip=True)

        if not text or not href or "/category/" not in href:
            continue

        # Skip pagination/misc links
        if any(x in href for x in ["start=", "page_num=", "sar=", "s=ts"]):
            continue

        # Skip category itself
        if href.rstrip("/") == category["url"].rstrip("/"):
            continue

        # Skip sale/collection pages
        text_lower = text.lower()
        if any(pat in text_lower for pat in SKIP_SUBCATEGORY_PATTERNS):
            continue

        # Deduplicate by category number
        cat_match = re.search(r"/category/(\d+)/", href)
        if cat_match:
            cat_num = cat_match.group(1)
            if cat_num in seen or cat_num == cat_id:
                continue
            seen.add(cat_num)

        # Clean URL - remove r= and extra params
        clean_href = href.split("&r=")[0].split("?c=")[0]
        if "?" in href:
            clean_href = href.split("&r=")[0]

        subcategories.append({
            "name": text,
            "url": clean_href,
        })

    return subcategories


# ---------------------------------------------------------------------------
# Product listing
# ---------------------------------------------------------------------------

def get_product_urls_from_page(soup):
    """Extract product URLs from a category listing page."""
    seen = set()
    urls = []
    for link in soup.select("a[href*='/product/']"):
        href = link.get("href", "")
        if not href or "/product/" not in href:
            continue
        # Skip non-species product links
        if "aquarium-fish-supplies" in href or ".cfm" in href:
            continue
        # Extract base product URL (without query params)
        base = href.split("?")[0]
        if base in seen:
            continue
        seen.add(base)
        urls.append(base)
    return urls


def get_all_product_urls(subcat_url):
    """Get all product URLs from a subcategory, across all pages."""
    all_urls = []
    page = 1

    while page <= 30:  # Safety limit
        if page == 1:
            url = subcat_url
        else:
            # LiveAquaria pagination
            sep = "&" if "?" in subcat_url else "?"
            url = f"{subcat_url}{sep}s=ts&start=1&page_num={page}&count=24"

        soup = fetch(url)
        if not soup:
            break

        page_urls = get_product_urls_from_page(soup)
        if not page_urls:
            break

        new_found = False
        for pu in page_urls:
            if pu not in all_urls:
                all_urls.append(pu)
                new_found = True

        if not new_found:
            break

        # Check if there's a next page link
        next_link = soup.select_one("a[href*='page_num=" + str(page + 1) + "']")
        if not next_link:
            break

        page += 1
        rate_limit(0.8, 1.5)

    return all_urls


# ---------------------------------------------------------------------------
# Product page parsing
# ---------------------------------------------------------------------------

def parse_species_page(url, category_slug, subcategory_name=""):
    """Parse a LiveAquaria product page and return species data dict."""
    soup = fetch(url)
    if not soup:
        return None

    species = {
        "id": "",
        "url": urljoin(BASE_URL, url),
        "name": "",
        "name_tr": "",  # Same as name - species names are proper nouns
        "scientific_name": "",
        "family": "",
        "category": category_slug,
        "subcategory": subcategory_name,
        "care_level": "",
        "care_level_tr": "",
        "temperament": "",
        "temperament_tr": "",
        "diet": "",
        "diet_tr": "",
        "max_size": "",
        "min_tank_size": "",
        "reef_compatible": "",
        "reef_compatible_tr": "",
        "color_form": "",
        "water_params": {
            "temperature": "",
            "sg": "",
            "ph": "",
            "dkh": "",
        },
        "description": "",
        "description_tr": "",
        "feeding": "",
        "feeding_tr": "",
        "image_url": "",
    }

    # --- Product ID ---
    url_match = re.search(r"/product/(\d+)", url)
    if url_match:
        species["id"] = url_match.group(1)
    else:
        return None  # Skip non-product pages

    # --- Product Name (from page title - NOT translated) ---
    title_tag = soup.title
    if title_tag:
        title_text = title_tag.get_text(strip=True)
        # Format: "Clarkii Clownfish : Saltwater Aquarium Fish for Marine Aquariums"
        name = title_text.split(":")[0].strip() if ":" in title_text else title_text
        # Also try | separator
        name = name.split("|")[0].strip()
        species["name"] = name
        species["name_tr"] = name  # Proper noun - no translation

    # Fallback: breadcrumb last segment
    if not species["name"]:
        bc = soup.find("span", class_="breadcrumb")
        if bc:
            bc_text = bc.get_text(strip=True)
            parts = [p.strip() for p in bc_text.split(">") if p.strip()]
            if parts:
                species["name"] = parts[-1]
                species["name_tr"] = parts[-1]

    # --- Quick Stats ---
    for entry in soup.select(".quick_stat_entry"):
        lbl_el = entry.select_one(".quick_stat_label")
        val_el = entry.select_one(".quick_stat_value")
        if not lbl_el or not val_el:
            continue
        label = lbl_el.get_text(strip=True)
        value = val_el.get_text(strip=True)

        if label == "Care Level":
            species["care_level"] = value
        elif label == "Temperament":
            species["temperament"] = value
        elif label in ("Color Form", "Color"):
            species["color_form"] = value
        elif label == "Diet":
            species["diet"] = value
        elif label == "Reef Compatible":
            species["reef_compatible"] = value
        elif label == "Water Conditions":
            _parse_water_conditions(value, species)
        elif label in ("Max. Size", "Maximum Size"):
            species["max_size"] = value
        elif label == "Family":
            species["family"] = value
        elif label in ("Minimum Tank Size", "Min. Tank Size"):
            species["min_tank_size"] = value
        elif label == "Scientific Name":
            species["scientific_name"] = value

    # --- Scientific Name (from italic tags in description if not in stats) ---
    if not species["scientific_name"]:
        for em in soup.select("em, i"):
            t = em.get_text(strip=True)
            if re.match(r"^[A-Z][a-z]+ [a-z]+", t) and len(t) < 50:
                species["scientific_name"] = t
                break

    # --- Image ---
    for img in soup.select("img"):
        src = img.get("src", "")
        if "/images/categories/product/" in src or "/images/product/" in src:
            species["image_url"] = urljoin(BASE_URL, src)
            break

    # Fallback for image
    if not species["image_url"]:
        for img in soup.select("img[src*='liveaquaria']"):
            src = img.get("src", "")
            if src:
                species["image_url"] = src
                break

    # --- Description ---
    overview = soup.select_one(".overview-content")
    if overview:
        species["description"] = overview.get_text(strip=True)[:3000]

    # Fallback description
    if not species["description"]:
        for div in soup.select(".product_content_bottom_details_mobile, .description"):
            txt = div.get_text(strip=True)
            if len(txt) > 100:
                species["description"] = txt[:3000]
                break

    # --- Feeding info ---
    for heading in soup.select("h3, h4, strong"):
        heading_text = heading.get_text(strip=True).lower()
        if "feeding" in heading_text or "nutrition" in heading_text:
            sib = heading.find_next_sibling(["p", "div"])
            if sib and len(sib.get_text(strip=True)) > 20:
                species["feeding"] = sib.get_text(strip=True)[:1500]
                break

    # --- Turkish structured field translations ---
    species["care_level_tr"] = translate_field(species["care_level"], CARE_LEVEL_TR)
    species["temperament_tr"] = translate_field(species["temperament"], TEMPERAMENT_TR)
    species["diet_tr"] = translate_field(species["diet"], DIET_TR)
    species["reef_compatible_tr"] = translate_field(species["reef_compatible"], REEF_COMPAT_TR)

    # --- Turkish text translations (description & feeding) ---
    # Pass species name as extra protected term so it won't be translated in text
    species_name = species.get("name") or ""
    extra = [species_name] if species_name else None

    if species["description"]:
        species["description_tr"] = translate_to_turkish(species["description"], extra_names=extra)
        translate_delay()

    if species["feeding"]:
        species["feeding_tr"] = translate_to_turkish(species["feeding"], extra_names=extra)
        translate_delay()

    return species


def _parse_water_conditions(text, species):
    """Parse temperature, SG, pH, dKH from a water conditions string."""
    # Temperature: 72-78°F
    temp = re.search(r"(\d+[\-–]\d+)\s*[°]?\s*F", text)
    if temp:
        species["water_params"]["temperature"] = temp.group(1) + "°F"

    # Specific gravity: 1.020-1.025
    sg = re.search(r"(1\.\d+[\-–]1\.\d+)", text)
    if sg:
        species["water_params"]["sg"] = sg.group(1)

    # pH
    ph = re.search(r"pH\s*([\d.]+[\-–][\d.]+)", text, re.IGNORECASE)
    if ph:
        species["water_params"]["ph"] = ph.group(1)

    # dKH
    dkh = re.search(r"dKH\s*(\d+[\-–]\d+)", text, re.IGNORECASE)
    if dkh:
        species["water_params"]["dkh"] = dkh.group(1)


# ---------------------------------------------------------------------------
# Saving
# ---------------------------------------------------------------------------

def save_json(data, filename):
    filepath = os.path.join(DATA_DIR, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  [SAVED] {len(data)} species -> {filename}")


# ---------------------------------------------------------------------------
# Category scraping
# ---------------------------------------------------------------------------

def scrape_category(category):
    """Scrape all species in a category and return list of dicts."""
    print(f"\n{'='*60}")
    print(f"[CATEGORY] {category['name']} ({category['name_tr']})")
    print(f"{'='*60}")

    filename = f"{category['slug']}.json"
    filepath = os.path.join(DATA_DIR, filename)

    # Load existing to allow resume
    all_species = []
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            all_species = json.load(f)
        print(f"  [RESUME] {len(all_species)} already downloaded")

    existing_ids = {s["id"] for s in all_species if s.get("id")}

    # Get subcategories
    print(f"  Fetching subcategories...")
    subcats = get_subcategories(category)
    print(f"  Found {len(subcats)} subcategories")
    rate_limit()

    if not subcats:
        subcats = [{"name": category["name"], "url": category["url"]}]

    for subcat in subcats:
        print(f"\n  [SUBCAT] {subcat['name']}")

        # Get product URLs
        prod_urls = get_all_product_urls(subcat["url"])
        new_urls = [u for u in prod_urls if re.search(r"/product/(\d+)", u) and
                    re.search(r"/product/(\d+)", u).group(1) not in existing_ids]

        print(f"    Found {len(prod_urls)} products, {len(new_urls)} new")

        for url in tqdm(new_urls, desc=f"    Parsing", leave=False, unit="sp"):
            species = parse_species_page(url, category["slug"], subcat["name"])

            if species and species.get("name") and species.get("id"):
                all_species.append(species)
                existing_ids.add(species["id"])
                print(f"    [OK] {species['name']}")
            else:
                print(f"    [FAIL] {url}")

            rate_limit()

        # Incremental save
        save_json(all_species, filename)

    return all_species


def create_categories_meta(categories_data):
    """Create categories.json summary file."""
    meta = []
    for cat in CATEGORIES:
        species_list = categories_data.get(cat["slug"], [])
        subcats = sorted(set(s.get("subcategory", "") for s in species_list if s.get("subcategory")))
        meta.append({
            "name": cat["name"],
            "name_tr": cat["name_tr"],
            "slug": cat["slug"],
            "species_count": len(species_list),
            "subcategories": subcats,
        })
    save_json(meta, "categories.json")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("=" * 60)
    print("  LiveAquaria Species Scraper")
    print("  - Species names: English (proper nouns, not translated)")
    print("  - Descriptions: Translated to Turkish via Google Translate")
    print("=" * 60)

    # Load existing species names so they are protected during translation
    load_known_species_names()
    print(f"  Protected species names loaded: {len(_known_species_names)}")

    categories_data = {}

    for category in CATEGORIES:
        try:
            species = scrape_category(category)
            categories_data[category["slug"]] = species
            print(f"\n  [DONE] {category['name']}: {len(species)} species")
        except KeyboardInterrupt:
            print("\n[INTERRUPT] Saving progress...")
            categories_data[category["slug"]] = []
            save_json(categories_data.get(category["slug"], []), f"{category['slug']}.json")
            break
        except Exception as e:
            print(f"\n  [ERROR] {category['name']}: {e}")
            import traceback
            traceback.print_exc()

    create_categories_meta(categories_data)

    print("\n" + "=" * 60)
    print("DONE")
    total = sum(len(v) for v in categories_data.values())
    print(f"Total: {total} species")
    for cat in CATEGORIES:
        count = len(categories_data.get(cat["slug"], []))
        print(f"  {cat['name']}: {count}")
    print(f"Data: {DATA_DIR}")


if __name__ == "__main__":
    main()
