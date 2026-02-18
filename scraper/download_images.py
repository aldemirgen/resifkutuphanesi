#!/usr/bin/env python3
"""
Download species images from LiveAquaria and update image_url in JSON files
to local relative paths served by the site.

Images saved to: scraper/data/images/{category}/{id}.jpg
image_url updated to: /images/{category}/{id}.jpg
"""

import io
import json
import os
import sys
import time
import random

import requests
from tqdm import tqdm

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, "data")
IMG_DIR = os.path.join(DATA_DIR, "images")

FILES = [
    ("marine-fish.json", "marine-fish"),
    ("corals.json", "corals"),
    ("marine-invertebrates.json", "marine-invertebrates"),
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://www.liveaquaria.com/",
}

SESSION = requests.Session()
SESSION.headers.update(HEADERS)


def download_image(url, dest_path, retries=3):
    """Download an image URL to dest_path. Returns True on success."""
    for attempt in range(retries):
        try:
            resp = SESSION.get(url, timeout=20, stream=True)
            resp.raise_for_status()
            content_type = resp.headers.get("content-type", "")
            if "image" not in content_type and "jpeg" not in content_type:
                return False
            with open(dest_path, "wb") as f:
                for chunk in resp.iter_content(chunk_size=8192):
                    f.write(chunk)
            # Verify file is a valid image (at least 1KB)
            if os.path.getsize(dest_path) < 1000:
                os.remove(dest_path)
                return False
            return True
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(2)
            else:
                return False
    return False


def get_ext(url):
    """Get image extension from URL, defaulting to .jpg"""
    path = url.split("?")[0].lower()
    for ext in [".jpg", ".jpeg", ".png", ".gif", ".webp"]:
        if path.endswith(ext):
            return ext
    return ".jpg"


def process_category(filename, category_slug):
    filepath = os.path.join(DATA_DIR, filename)
    if not os.path.exists(filepath):
        print(f"[SKIP] {filename} not found")
        return

    # Create image dir for this category
    cat_img_dir = os.path.join(IMG_DIR, category_slug)
    os.makedirs(cat_img_dir, exist_ok=True)

    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    total = len(data)
    downloaded = 0
    skipped = 0
    failed = 0

    print(f"\n[{category_slug}] {total} species")

    for species in tqdm(data, desc=f"  Downloading", unit="img"):
        species_id = species.get("id", "")
        image_url = species.get("image_url", "")

        if not species_id or not image_url:
            failed += 1
            continue

        # Already converted to local path
        if image_url.startswith("/images/"):
            skipped += 1
            continue

        ext = get_ext(image_url)
        local_filename = f"{species_id}{ext}"
        local_path = os.path.join(cat_img_dir, local_filename)
        relative_url = f"/images/{category_slug}/{local_filename}"

        # Skip if already downloaded
        if os.path.exists(local_path) and os.path.getsize(local_path) > 1000:
            species["image_url"] = relative_url
            skipped += 1
            continue

        # Download
        success = download_image(image_url, local_path)
        if success:
            species["image_url"] = relative_url
            downloaded += 1
        else:
            # Keep original URL as fallback
            failed += 1

        # Small delay to be polite
        time.sleep(random.uniform(0.3, 0.8))

    # Save updated JSON
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"  Downloaded: {downloaded}, Skipped (cached): {skipped}, Failed: {failed}")
    print(f"  [SAVED] {filename} updated")


def main():
    print("=" * 60)
    print("  LiveAquaria Image Downloader")
    print(f"  Saving to: {IMG_DIR}")
    print("=" * 60)

    os.makedirs(IMG_DIR, exist_ok=True)

    for filename, slug in FILES:
        try:
            process_category(filename, slug)
        except KeyboardInterrupt:
            print("\n[INTERRUPT] Saving progress...")
            break
        except Exception as e:
            print(f"[ERROR] {filename}: {e}")
            import traceback
            traceback.print_exc()

    print("\n[DONE] Image download complete")

    # Count total images
    total_imgs = 0
    for _, slug in FILES:
        cat_dir = os.path.join(IMG_DIR, slug)
        if os.path.exists(cat_dir):
            count = len([f for f in os.listdir(cat_dir) if os.path.isfile(os.path.join(cat_dir, f))])
            print(f"  {slug}: {count} images")
            total_imgs += count
    print(f"  Total: {total_imgs} images")


if __name__ == "__main__":
    main()
