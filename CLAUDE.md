# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Resif Kütüphanesi** — A Turkish marine species library (1535 species: fish, corals, invertebrates). Express.js backend + React frontend, deployed to DigitalOcean at resifkutuphanesi.com.

## Commands

### Development
```bash
# Install server deps (root)
npm install

# Start API server (port 3001)
npm start
# or directly:
node --experimental-sqlite server/index.js

# Start React dev server (port 5173, proxies /api → 3001)
cd site && npm run dev

# Build React for production
npm run build
# or:
cd site && npm run build

# Lint frontend
cd site && npm run lint
```

### Database Scripts (always need --experimental-sqlite)
```bash
node --experimental-sqlite scripts/create-admin.js <username> <password>
node --experimental-sqlite scripts/import-json-to-sqlite.js
node --experimental-sqlite scripts/merge-scraper.js
node --experimental-sqlite scripts/normalize-field-values-v2.js [--dry-run]
node --experimental-sqlite scripts/clean-liveaquaria.js [--dry-run]
node --experimental-sqlite scripts/clean-liveaquaria-names.js [--dry-run]
```

### Production Deploy (on DigitalOcean droplet 167.172.178.159)
```bash
cd /var/www/resifkutuphanesi
git pull
# run any needed scripts above
cd site && npm run build && cd ..
pm2 restart resifkutuphanesi
```

PM2 is configured with `--experimental-sqlite` in node_args. Nginx reverse-proxies to port 3001. SSL via Certbot (apex domain only, Cloudflare Full mode).

## Architecture

### Data Flow
```
scraper/ (Python) → JSON files → import-json-to-sqlite.js → SQLite DB
                                                               ↑
                                              merge-scraper.js (respects manually_edited_fields)

Browser → React (site/) → /api/* → Express (server/) → node:sqlite → database.sqlite
```

In production, Express serves `site/dist/` as static files. In dev, Vite proxies `/api` to `localhost:3001` (configured in `site/vite.config.js`).

### SQLite — Critical Notes
- Uses Node 23's **built-in `node:sqlite`** (`DatabaseSync` from `'node:sqlite'`), NOT `better-sqlite3`
- Always pass `--experimental-sqlite` flag — omitting it causes a module-not-found error
- `db.transaction()` does NOT exist in `node:sqlite` — use `db.exec('BEGIN')` / `db.exec('COMMIT')` / `db.exec('ROLLBACK')`
- API: `db.prepare(sql).get(...params)`, `.all(...params)`, `.run(...params)` — params are spread, not an array

### Server Structure (`server/`)
- `db.js` — singleton `getDb()`, creates schema on first call
- `routes/species.js` — full CRUD; `parseRow()` deserializes `water_params` (JSON) and `manually_edited_fields` (JSON array); `prepareRow()` serializes back
- `routes/auth.js` — `POST /api/auth/login` → 24h JWT
- `middleware/auth.js` — `requireAuth` middleware, reads `Authorization: Bearer <token>`

### Frontend Structure (`site/src/`)
- `data/index.js` — all data-fetching functions (`loadCategoryData`, `filterSpecies`, `sortSpecies`, `getUniqueValues`). Client-side filtering/sorting; API fetches full category data.
- `utils/translations.js` — CARE_LEVELS, TEMPERAMENTS, REEF_COMPAT, DIETS, CATEGORIES dictionaries. All filter field values in the DB are now stored in **Turkish** (normalized). The `_tr` sibling fields (e.g. `care_level_tr`) mirror the primary field value.
- `hooks/useSearchSuggestions.js` — debounced autocomplete hook used by both SearchBar and Navbar
- `components/SuggestionDropdown.jsx` — shared dropdown component for search autocomplete

### `manually_edited_fields` Pattern
When an admin edits a field via PUT `/api/species/:id`, that field name is recorded in the `manually_edited_fields` JSON array. `scripts/merge-scraper.js` checks this array before overwriting — fields listed here are never overwritten by scraper data.

### Turkish Translation Strategy
All enumerable fields (`care_level`, `temperament`, `reef_compatible`, `diet` and their `_tr` variants) store Turkish values in the DB. Translations live in `site/src/utils/translations.js`. When adding new scraped data, run `normalize-field-values-v2.js` to convert English → Turkish.

## Key Patterns

- **Auth**: JWT stored in `localStorage` as `adminToken`. `PrivateRoute` redirects to `/admin/login` if missing.
- **Cache**: `site/src/data/index.js` caches category data in a module-level `dataCache` object. Call `clearCache(slug)` after mutations.
- **Routes**: Admin routes (`/admin/*`) are excluded from `Navbar`/`Footer` rendering via path check in `App.jsx`.
- **Windows path**: Working directory contains Turkish characters (`kütüphane`). Use `/h/Spec/Liveaquaria kütüphane` in bash or `"H:\Spec\Liveaquaria kütüphane"` with quoting.
