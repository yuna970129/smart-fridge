# 🧊 Fridge AI

Scan a grocery receipt to stock your fridge, snap a photo of a cooked dish to
mark ingredients as used up, and track freshness — all in one calm, glassy UI.

Built as a single **Next.js (App Router)** app that holds **both the frontend
and the backend** in this one repo.

- **Frontend** — React screens in `app/` + reusable UI in `components/`
- **Backend** — API routes in `app/api/` + domain logic in `lib/`
- **AI** — Google Gemini (vision) for receipt & dish analysis
- **Storage** — Supabase (Postgres); falls back to a local JSON file for demos
- **Freshness (v2)** — auto-assigned expiry dates + 🟢🟡🔴 status & alerts

> Runs instantly with **no API keys** — storage uses a local JSON file and the
> AI uses a built-in mock provider. Add keys to go live.

---

## 🚀 Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

That is it — the app works in **demo mode** out of the box. Open the app, scan a
receipt (any image), and you will get a sample ingredient list you can save.

To use real services, copy the env template and fill it in:

```bash
cp .env.example .env.local
```

---

## 📁 Folder structure

```
smart-fridge/
├── app/                      # ── FRONTEND (screens) ── + ── BACKEND (api) ──
│   ├── page.tsx              # Home (Scan Receipt / Check Dish / My Fridge)
│   ├── scan-receipt/page.tsx # Upload → Loading → Results → Save
│   ├── check-dish/page.tsx   # Upload → Loading → Checklist → Confirm
│   ├── fridge/page.tsx       # Inventory list + delete
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Palette + glassmorphism (design.md)
│   └── api/                  # ── BACKEND ──
│       ├── scan-receipt/route.ts   # POST: recognize receipt items
│       ├── check-dish/route.ts     # POST: identify dish + used items
│       ├── fridge/route.ts         # GET / POST / PATCH / DELETE inventory
│       └── seed/route.ts           # POST: reset + demo data, DELETE: clear
├── components/               # ── FRONTEND (reusable UI) ──
├── lib/                      # ── BACKEND (domain logic) + shared types ──
│   ├── config.ts             # Env detection (real keys vs. demo fallback)
│   ├── store.ts              # FridgeStore: Supabase OR local JSON store
│   ├── gemini.ts             # Receipt/dish analysis (real OR mock AI)
│   ├── supabase.ts           # Supabase client factory
│   ├── emoji.ts              # Ingredient → emoji lookup
│   ├── image.ts              # data-URL parsing
│   ├── api.ts                # Client-side fetch helpers
│   └── types.ts              # Ingredient, ScannedItem, DishAnalysis
└── .AGENT/                   # Living product docs (scenario, design, tech)
```

---

## 🔌 API reference

| Method   | Route                | Body                         | Purpose                              |
| -------- | -------------------- | ---------------------------- | ------------------------------------ |
| `POST`   | `/api/scan-receipt`  | `{ image }`                  | Recognize food items (no save)       |
| `POST`   | `/api/check-dish`    | `{ image }`                  | Dish name + matched fridge items     |
| `GET`    | `/api/fridge`        | `?status=have\|gone\|all`    | List ingredients                     |
| `POST`   | `/api/fridge`        | `{ items: [{name,emoji}] }`  | Save items ("Confirm & Save")        |
| `PATCH`  | `/api/fridge`        | `{ id, status }`             | Mark `gone` ("Used all") / `have`    |
| `DELETE` | `/api/fridge`        | `{ id }`                     | Permanently delete                   |
| `POST`   | `/api/seed`          | —                            | Reset + load demo inventory          |
| `DELETE` | `/api/seed`          | —                            | Clear the fridge                     |

`image` is a base64 data URL (e.g. `data:image/png;base64,...`).

---

## 🗄️ Supabase setup (optional)

Create the table in the Supabase SQL editor:

```sql
CREATE TABLE ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'demo-user',
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('have', 'gone')),
  shelf_life_days INT NOT NULL DEFAULT 14,
  expires_at DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_status ON ingredients(user_id, status);
CREATE INDEX idx_user_expires ON ingredients(user_id, expires_at);
```

Freshness (🟢🟡🔴) is derived from `expires_at` at read time, so no extra column
is needed for status.

Then set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (or the anon
key) in `.env.local`. With no Supabase config, data is stored in
`.data/fridge.json`.

## 🤖 Gemini setup (optional)

Set `GEMINI_API_KEY` in `.env.local`. The model defaults to `gemini-2.0-flash`
and is overridable with `GEMINI_MODEL`. Without a key, a deterministic mock
provider returns sample data so the full flow is demoable offline.

---

## 🧪 Scripts

```bash
npm run dev      # start dev server
npm run build    # production build
npm run start    # run the production build
npm run lint     # eslint
```

## ☁️ Deploy (Vercel)

Import the repo into Vercel, add the environment variables, and deploy. If you
deploy without Supabase, set `DATA_DIR=/tmp` (the local JSON store needs a
writable path; note it is ephemeral on serverless).

---

## 📐 Product docs

The `.AGENT/` folder is the living source of truth and is kept in sync with the
code:

- `user_scenario.md` — flow & UX
- `design.md` — colors & visual style
- `technical_implementation.md` — stack, APIs, data model
