#!/usr/bin/env python3
"""
Sync downloaded images and updated JSON files from scraper/data/ to site/public/
Run this after download_images.py completes.
"""

import io
import json
import os
import shutil
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, "data")
SITE_PUBLIC = os.path.join(BASE_DIR, "..", "site", "public")

JSON_FILES = ["marine-fish.json", "corals.json", "marine-invertebrates.json"]
IMG_SRC = os.path.join(DATA_DIR, "images")
IMG_DST = os.path.join(SITE_PUBLIC, "images")


def sync_json():
    for fname in JSON_FILES:
        src = os.path.join(DATA_DIR, fname)
        dst = os.path.join(SITE_PUBLIC, "data", fname)
        if os.path.exists(src):
            shutil.copy2(src, dst)
            print(f"  [JSON] {fname} -> site/public/data/")


def sync_images():
    if not os.path.exists(IMG_SRC):
        print("  [SKIP] No images folder found")
        return

    os.makedirs(IMG_DST, exist_ok=True)
    total = 0

    for category in os.listdir(IMG_SRC):
        cat_src = os.path.join(IMG_SRC, category)
        cat_dst = os.path.join(IMG_DST, category)
        if not os.path.isdir(cat_src):
            continue
        os.makedirs(cat_dst, exist_ok=True)

        files = [f for f in os.listdir(cat_src) if os.path.isfile(os.path.join(cat_src, f))]
        for fname in files:
            src_path = os.path.join(cat_src, fname)
            dst_path = os.path.join(cat_dst, fname)
            # Only copy if dest doesn't exist or is older
            if not os.path.exists(dst_path) or os.path.getmtime(src_path) > os.path.getmtime(dst_path):
                shutil.copy2(src_path, dst_path)
                total += 1

        print(f"  [IMG] {category}: {len(files)} images -> site/public/images/{category}/")

    print(f"  Total synced: {total} new/updated images")


def main():
    print("=" * 50)
    print("  Syncing data to site/public/")
    print("=" * 50)
    sync_json()
    sync_images()
    print("[DONE]")


if __name__ == "__main__":
    main()
