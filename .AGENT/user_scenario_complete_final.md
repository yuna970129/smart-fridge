# 🧊 Fridge AI | User Scenario — Complete (v3 Final)

**Language**: English  
**Platform**: Web  
**Core Features**: Receipt scan, check dish (photo), voice command (add/remove), fridge management  
**Advanced Features**: Real-time voice STT → **Gemini** intent routing (🛒 add ⇄ 🍽️ consume) + missing-ingredient detection

---

## 📖 Overview

**Fridge AI** helps you manage what's in your fridge and what you cook:

1. **📸 Scan Receipt** — Upload receipt photos → AI extracts ingredients → auto-assign expiry dates
2. **🍽️ Check Dish** — Upload a dish photo → AI identifies the dish & ingredients you used → remove them
3. **🎙️ Voice Command** — Speak naturally; STT → **Gemini** reads it like an image and
   auto-detects intent: **adds** what you bought 🛒 or **removes** what you cooked 🍽️
4. **📋 My Fridge** — View all ingredients with freshness status (🟢🟡🔴) + manage expiry
5. **🍲 Smart Recipe Suggestion** — Tap the expiring-items banner → **Gemini** suggests recipes
   that use up your 🟡/🔴 items (fridge-only vs. need-to-buy), then auto-deducts what you cooked

---

## 1️⃣ Home Screen

```
┌─────────────────────────────┐
│                             │
│      🧊 Fridge AI           │
│                             │
│  👋 New here? Tell us what   │
│     you have (tap to record) │ ← Quick Voice Setup
│                             │
│  ⚠️ Smart Recipe Banner      │
│  "Onion, Carrot expiring.   │
│   Click for recipes!"        │ ← Clickable
│                             │
│  ┌─────────────────────┐    │
│  │  📸 Scan Receipt    │    │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │  🍽️ Check Dish      │    │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │  🎙️ Voice Command   │    │ ← Add/Remove by voice
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │  📋 My Fridge       │    │
│  └─────────────────────┘    │
│                             │
└─────────────────────────────┘
```

**👋 Quick Voice Setup (top CTA):**
- Always available shortcut → **Quick Voice Setup** (section 2️⃣)
- Best for first launch: speak your whole fridge in one go

**Urgent Expiring Banner:**
- Shows count of items expiring soon (🟡) or expired (🔴)
- **🆕 Clickable** → opens **Smart Recipe Suggestions** (section 7️⃣)
- Hidden when no items need attention

**User Actions:**
- Tap "👋 Quick Voice Setup" → bulk-add by voice
- Tap "📸 Scan Receipt"
- Tap "🍽️ Check Dish"
- Tap "🎙️ Voice Command"
- Tap "📋 My Fridge"
- Tap the **⚠️ alert banner** → Smart Recipe Suggestions

---

## 2️⃣ Quick Voice Setup (Always Available)

> A one-shot way to fill an **already-full fridge** without photographing every
> item. Reached from the **👋 "New here? Tell us what you have"** CTA at the top
> of Home (or `/voice?setup=1`). Speak a long, natural inventory and the app
> adds everything at once — **including how fresh each item is**.
>
> Pipeline (same as Voice Command): **🎙️ mic → BizCrush STT (speech→text) →
> Gemini (text→items + timing) → fridge**. Gemini does **not** hear audio; it
> only reads the BizCrush transcript.

### Step 1️⃣ — Voice Recording

When user taps "👋 Quick Voice Setup? Tell us what you have":

```
┌─────────────────────────────┐
│  What's in your fridge?     │
│                             │
│         🎙️ Recording...     │
│                             │
│  "I have eggs, carrot that  │
│   expires in 2 weeks, milk, │
│   garlic..."                │
│                             │
│  [Stop Recording]           │
│  [← Cancel]                 │
└─────────────────────────────┘
```

**What User Does:**
- Tap 🎙️ → BizCrush STT starts recording
- Speak naturally about fridge contents
- Example: "I have eggs, carrots that expire in 2 weeks, milk, some leftover sauce..."
- Real-time transcript displays below the mic
- Tap **[Stop Recording]** when done

### Step 2️⃣ — Gemini parses items **and freshness timing**

The transcript is sent to **Gemini**, which returns an `add` command. The key
difference from a normal "I bought…" command: Gemini also extracts **when** each
item expires or was purchased, so already-aging items aren't treated as brand new.

```
Heard: "eggs, carrot that expires in 2 weeks, milk I bought 3 days ago"

Gemini → { "action": "add", "items": [
  { "emoji": "🥚", "name": "Eggs" },
  { "emoji": "🥕", "name": "Carrot", "expiresInDays": 14 },
  { "emoji": "🥛", "name": "Milk",   "boughtDaysAgo": 3 }
]}
```

**Expiry math (server-side):**

| What the user says            | Field             | `expires_at` becomes              |
| ----------------------------- | ----------------- | --------------------------------- |
| (no timing)                   | —                 | today + **category average**      |
| "expires in 2 weeks"          | `expiresInDays:14`| today + **14 days**               |
| "bought 3 days ago"           | `boughtDaysAgo:3` | today + (**average − 3**) days    |
| "got it last week" (≈7d ago)  | `boughtDaysAgo:7` | today + (**average − 7**) days    |

So a carrot (avg 14d) **bought 3 days ago** → 11 days left, and one **bought 2
weeks ago** → already expired (🔴). This keeps freshness 🟢🟡🔴 honest from day one.

### Step 3️⃣ — Confirm & Save

The recognized items appear as a checklist (each with its computed freshness /
days-left). Uncheck anything misheard → **[Confirm & Save]** adds them all in one
go (`POST /api/fridge`), and you land in a fully-stocked **My Fridge**.

---

## 3️⃣ Scan Receipt

### Step 1️⃣ — Upload Receipt

```
┌─────────────────────────────┐
│   📸 Scan Receipt           │
│                             │
│  [Choose File Button]       │
│  (Upload receipt image)     │
│                             │
│  ← Back                     │
└─────────────────────────────┘
```

**User Action:** Select receipt photo → upload.

---

### Step 2️⃣ — AI Analyzing

```
┌─────────────────────────────┐
│   Analyzing...              │
│   ⏳ Reading receipt        │
└─────────────────────────────┘
```

---

### Step 3️⃣ — AI Results (Ingredient List)

```
┌─────────────────────────────┐
│  Found in Receipt:          │
│                             │
│  ✓ 🥚 Eggs (Avg 30d)       │
│  ✓ 🥕 Carrot (Avg 14d)     │
│  ✓ 🍜 Ramen (Avg 180d)     │
│  ✓ 🧄 Garlic (Avg 60d)     │
│  ✓ 🧈 Butter (Avg 90d)     │
│                             │
│  [Confirm & Save]           │
│  [Upload Again]             │
└─────────────────────────────┘
```

**What happens:**
- AI extracts food items from receipt
- Each gets emoji + auto-calculated expiry date
- Tap **[Confirm & Save]** → all added to fridge with status 🟢 Fresh

---

## 4️⃣ Check Dish (Photo)

### Step 1️⃣ — Upload Dish Photo

```
┌─────────────────────────────┐
│   🍽️ Check Dish             │
│                             │
│  [Choose File Button]       │
│  (Upload dish photo)        │
│                             │
│  ← Back                     │
└─────────────────────────────┘
```

---

### Step 2️⃣ — AI Analyzing

```
┌─────────────────────────────┐
│   Analyzing...              │
│   ⏳ Identifying dish       │
│   and ingredients           │
└─────────────────────────────┘
```

---

### Step 3️⃣ — AI Results (Pre-filled Checklist)

```
┌─────────────────────────────┐
│  Dish: Kimchi Jjigae       │
│                             │
│  Did you use these?         │
│                             │
│  🥬 Kimchi                 │
│    [Still have] [Used all] │
│                             │
│  🧄 Garlic                 │
│    [Still have] [Used all] │
│                             │
│  🧅 Green Onion            │
│    [Still have] [Used all] │
│                             │
│  [Confirm]  [Cancel]        │
└─────────────────────────────┘
```

**What User Sees:**
- Dish name recognized
- List of ingredients from your fridge that were likely used
- For each: "Still have" or "Used all" buttons

**User Action:**
- Toggle each ingredient (Still have = keep, Used all = remove)
- Tap **[Confirm]** → items marked "Used all" are removed from fridge

---

## 5️⃣ Voice Command — Speak to Add or Remove (NEW)

> The **🎙️ Voice Command** button sits at the **top of the Home screen** — it's
> the fastest way to update your fridge. Just talk — the STT transcript is handed
> to **Gemini**, which **reads your sentence the way it reads a photo** and
> auto-detects what you mean (you never pick a mode first):
>
> - 🛒 **"I bought…"** → **add** those groceries to the fridge
> - 🍽️ **"I made…"** → **remove** the ingredients you cooked with
> - 🚀 **"I have… / 있어…"** (first launch) → **bulk-stock** an already-full fridge

### Step 0️⃣ — First-Launch Onboarding ("talk your fridge in")

> The first time you open the app, your **real fridge is already full** but the
> app's is empty — and photographing every item is painful. So when the fridge is
> empty, Voice Command greets you with an onboarding prompt: tap the mic and
> **list everything you already have in one long sentence**.

```
┌─────────────────────────────┐
│  👋 Welcome! Stock your fridge│
│  Your fridge is empty — just  │
│  list what you already have.  │
│                             │
│      ┌───────────┐          │
│      │    🎙️     │          │
│      └───────────┘          │
│  "I have eggs, milk, carrots,│
│   butter, kimchi, garlic and │
│   some green onions."        │
└─────────────────────────────┘
```

- Shown **only when the fridge is empty** (first launch / after a reset).
- "I have / 있어 …" is parsed as an **add** intent → every item gets an emoji +
  auto-expiry and is added in one **Confirm & Save**.
- Once stocked, the screen reverts to the normal "bought / cooked" prompt.

### Step 1️⃣ — Speak naturally (live transcription)

```
┌─────────────────────────────┐
│   🎙️ Listening…  ●REC        │
│                             │
│   "나 라면 끓였어. 계란       │
│    하나 넣어서…"             │
│                             │
│      ┌───────────┐          │
│      │    ⏹️ Stop  │          │
│      └───────────┘          │
└─────────────────────────────┘
```

As you speak:
- Interim text appears in gray (still being recognized)
- Final text appears in solid color
- Updates word-by-word via BizCrush WebSocket STT

**User Action:** Tap **⏹️ Stop** when done → audio stream ends, AI processes transcript.

---

### Step 2️⃣ — Gemini reads the transcript & picks the action

The transcript is sent to **Gemini**, which returns the **intent** plus the items
in one JSON call (the same model that reads receipt/dish images):

```
Heard: "I made ramen with an egg"       →  { "action": "consume",
                                               "dishName": "Ramen",
                                               "items": ["Ramen", "Eggs"] }

Heard: "I bought milk, apples, cheese"  →  { "action": "add",
                                               "items": ["Milk", "Apple", "Cheese"] }
```

Gemini then branches automatically:
- 🛒 **`action: "add"`** → **Step 3-A** (confirm list → save)
- 🍽️ **`action: "consume"`** → **Step 3-B** (used-it checklist → remove)

---

### Step 3-A — 🛒 Add → Confirm List (auto-expiry, like a receipt)

```
┌─────────────────────────────┐
│  🛒 Add these to fridge?     │
│  (heard: "bought milk,       │
│   apples, cheese")          │
│                             │
│  ✓ 🥛 Milk   (Avg 14d)      │
│  ✓ 🍎 Apple  (Avg 21d)      │
│  ✓ 🧀 Cheese (Avg 30d)      │
│                             │
│  [Confirm & Save]  [Cancel] │
└─────────────────────────────┘
```

- Each item gets an emoji + **auto-calculated expiry** (same category averages as Scan Receipt)
- Uncheck anything Gemini misheard → **[Confirm & Save]** adds them with status 🟢 Fresh (`POST /api/fridge`)

---

### Step 3-B — 🍽️ Consume → Used-it Checklist

```
┌─────────────────────────────┐
│  Did you use these?          │
│                             │
│  🍜 Ramen                   │
│    [Still have] [Used all]  │
│                             │
│  🥚 Eggs                    │
│    [Still have] [Used all]  │
│                             │
│  [Confirm]   [Back]         │
└─────────────────────────────┘
```

**User Action:**
- Review and adjust (Still have / Used all) for each item
- Tap **[Confirm]** → "Used all" items are removed from fridge

---

### Step 4️⃣ — Applied

🛒 If you added groceries:
```
┌─────────────────────────────┐
│        ✅ Added!             │
│  Added to fridge:           │
│  - Milk, Apple, Cheese      │
│  [View My Fridge] [Home]    │
└─────────────────────────────┘
```

🍽️ If you logged a cooked dish:
```
┌─────────────────────────────┐
│        ✅ Done!              │
│  Items removed:             │
│  - Ramen, Eggs              │
│  [View My Fridge] [Home]    │
└─────────────────────────────┘
```

### 🔀 Intent Routing (one button → two outcomes)

```
  🎙️ Voice Command (Home button)
      │  speak
      ▼
 ┌──────────────┐
 │  BizCrush STT │ → transcript (text)
 └──────────────┘
      │
      ▼
 ┌──────────────┐
 │    Gemini     │  "read the sentence like an image"
 └──────────────┘
      │
   action?
   ┌──┴───────────────┐
 "add"            "consume"
   │                  │
   ▼                  ▼
🛒 Confirm list     🍽️ Used-it checklist
→ Save              → remove from fridge
  (🟢 + auto-expiry)
```

---

## 6️⃣ My Fridge

```
┌───────────────────────────────────┐
│   📋 My Fridge                    │
│  [Filter: All / Fresh / Expiring] │
│                                   │
│  🟢 🥚 Eggs (28d left)            │
│      [🗑️ Delete]                  │
│                                   │
│  🟡 🥕 Carrot (2d left)           │
│      [🗑️ Delete]                  │
│                                   │
│  🔴 🥓 Ham (Expired!)             │
│      [🗑️ Delete]                  │
│                                   │
│  🟢 🍜 Ramen (175d left)          │
│      [🗑️ Delete]                  │
│                                   │
│  ← Back to Home                   │
└───────────────────────────────────┘
```

**What User Sees:**
- All ingredients with status icon + emoji + name + days left
- Delete button next to each
- Filter by All / Fresh / Expiring

**Status Icons (Auto-calculated):**
- 🟢 **Fresh:** 4+ days left
- 🟡 **Expiring soon:** ≤ 3 days left
- 🔴 **Expired:** 0 days left

**User Action:**
- Click "🗑️" → confirm → item removed

---

## 7️⃣ Smart Recipe Suggestion (NEW)

> Reached by tapping the **⚠️ expiring-items alert banner** on the Home screen.
> **Gemini** looks at what's about to expire (🟡/🔴) and suggests recipes, sorted
> into "use only what's in the fridge" vs. "need to buy a couple of things".

### Step 1️⃣ — Recommended Recipes List

Gemini analyzes your expiring items and generates recipe options:

```
┌─────────────────────────────┐
│  💡 Recommended Recipes     │
│                             │
│  Option 1                   │
│  🍳 Fried Rice              │
│  (Carrot, Onion, Egg)       │
│  ✓ Uses only fridge items   │
│                             │
│  Option 2                   │
│  🍲 Veggie Curry            │
│  (Carrot, Onion + Potato,   │
│   Curry Powder)             │
│  ⚠️ Need to buy: 2 items    │
│                             │
│  Option 3                   │
│  🥗 Egg Salad               │
│  (Egg + Lettuce, Mayo)      │
│  ⚠️ Need to buy: 2 items    │
│                             │
│  [← Back to Home]           │
└─────────────────────────────┘
```

**What User Sees:**
- **Option 1: "Fridge-only"** — Uses only current ingredients
- **Option 2 & 3: "Fridge + Add-ons"** — Suggests items to buy for better dishes
- Categorized by required vs. optional ingredients

**User Action:** Tap on a recipe to see details.

---

### Step 2️⃣ — Recipe Details & Instructions

```
┌─────────────────────────────┐
│  🍲 Veggie Curry            │
│                             │
│  Required (From Fridge):    │
│  • 🟡 Carrot (Expiring!)    │
│  • 🟡 Onion (Expiring!)     │
│                             │
│  Need to Buy:               │
│  • Potato                   │
│  • Curry Powder             │
│                             │
│  Instructions:              │
│  1. Chop all veggies        │
│  2. Add water and curry     │
│  3. Simmer 20 minutes       │
│  4. Serve hot               │
│                             │
│  [🍳 Cooked! (Next)]        │
│  [← Back]                   │
└─────────────────────────────┘
```

**What User Sees:**
- Recipe name & ingredients breakdown
- Required items from fridge (highlighted if expiring)
- Additional items to buy
- Step-by-step instructions

**User Action:** Tap **[🍳 Cooked! (Next)]** when done cooking.

---

### Step 3️⃣ — Confirm Used Items (like Check Dish)

Just like Check Dish, the user selects which items were fully used vs. still have.

```
┌─────────────────────────────┐
│  Did you use these?          │
│                             │
│  🥕 Carrot                  │
│    [Still have] [Used all]  │
│                             │
│  🧅 Onion                   │
│    [Still have] [Used all]  │
│                             │
│  [Confirm]   [Back]         │
└─────────────────────────────┘
```

**What User Sees:**
- All fridge ingredients used in the recipe
- For each: "Still have" or "Used all" buttons (just like Check Dish)

**User Action:**
- Toggle each ingredient (Still have = keep, Used all = remove)
- Tap **[Confirm]** → items marked "Used all" are removed from fridge (`PATCH /api/fridge`)

---

### Step 4️⃣ — Update Fridge

When the user taps **[Confirm]**:
- Items marked "Used all" are removed from fridge
- User is returned to the Home screen
- Fridge inventory automatically updated

```
Example:
Before: [Carrot: 🟡], [Onion: 🟡]
If user selects: Carrot "Used all", Onion "Still have"
After:  [Onion: 🟡]  (only Carrot removed)
```

---

## 📊 Complete User Journey

### Day 1: Shopping

```
1. Home → "📸 Scan Receipt"
2. Upload receipt photo
3. AI: 🥚 Eggs (30d), 🥕 Carrot (14d), 🍜 Ramen (180d), 🧄 Garlic (60d)
4. Tap "Confirm & Save"
5. All added to fridge (🟢 Fresh)
```

### Anytime: Quick Add by Voice

```
1. Home → "🎙️ Voice Command" (speak)
2. Speak: "마트에서 우유랑 사과, 치즈 사 왔어"
3. Transcript: "I bought milk, apples and cheese"
4. Gemini: action=add → 🥛 Milk (14d), 🍎 Apple (21d), 🧀 Cheese (30d)
5. Tap "Confirm & Save" → all added to fridge (🟢 Fresh)
```

### Day 2: Cooking (Voice)

```
1. Home → "🎙️ Voice Command"
2. Speak: "라면 끓였어. 계란"
3. Transcript: "I made ramen with egg"
4. Gemini: action=consume, dish=Ramen, items=[Ramen, Eggs]
5. Checklist:
   - Ramen: [Still have] [Used all]
   - Eggs: [Still have] [Used all]
6. Tap Confirm → selected items removed from fridge
```

### Smart Recipe (when items are expiring)

```
1. Home → tap "⚠️ Smart Recipe Banner: Carrot, Onion expiring"
2. Gemini suggests:
   - 🍳 Fried Rice (fridge-only)
   - 🍲 Veggie Curry (needs Potato, Curry Powder)
   - 🥗 Egg Salad (needs Lettuce, Mayo)
3. Tap "🍲 Veggie Curry" → view ingredients + instructions
4. Cook, then tap "🍳 Cooked! (Next)"
5. Confirm used items:
   - Carrot: [Still have] / [Used all]
   - Onion: [Still have] / [Used all]
6. Tap Confirm → selected items removed (like Check Dish)
```

### Day 3: Fridge Check

```
1. Home → See "⚠️ ALERT: 1 item expiring!"
2. "📋 My Fridge"
3. 🟡 Carrot (2d left) ← expiring
4. Tap 🗑️ next to Carrot → removed
```

---

## 🎯 What Must Be Built

| Feature | Required? | Description |
|---------|-----------|-------------|
| **Home Screen** | ✅ | 4 buttons + Alert banner (clickable → recipes) |
| **Scan Receipt** | ✅ | Upload → AI extract → auto-expiry → save |
| **Check Dish (Photo)** | ✅ | Upload → AI identify → checklist |
| **Voice Command** | ✅ | 🎙️ Home button → BizCrush STT → Gemini intent → 🛒 add list / 🍽️ used-it checklist |
| **Gemini Intent Routing** | ✅ | Classify transcript → `add` vs `consume`, route to the right flow |
| **🍲 Smart Recipe Suggestion** | ✅ | Tap alert banner → Gemini suggests recipes from expiring items |
| **Fridge-only vs Add-ons** | ✅ | Categorize recipes: use only fridge vs. need to buy |
| **Recipe Auto-deduct** | ✅ | [🍳 Cooked!] → used-it checklist → remove used items |
| **My Fridge** | ✅ | View all + filter + delete |
| **Status Icons** | ✅ | 🟢🟡🔴 auto-calculated daily |
| **Database** | ✅ | Store ingredients + expiry + status |
| **AI (LLM)** | ✅ | Recognize receipt/dish/voice, parse ingredients, suggest recipes |
| **BizCrush STT** | ✅ | Real-time voice transcription |
| **Multi-language** | ✅ | BizCrush auto-detects Korean + English |

---

## 💾 Data Model

**ingredients table:**
```typescript
{
  id: UUID,
  user_id: string,        // "demo-user"
  name: string,           // "Eggs"
  emoji: string,          // "🥚"
  added_at: date,         // "2026-06-20"
  expires_at: date,       // "2026-07-20" (auto-calculated)
  status: "have" | "gone" // auto-derived from expires_at
}
```

**Status Logic (auto-calculated daily):**
```
if (expires_at - today > 3 days):  🟢 Fresh
if (expires_at - today ≤ 3 days):  🟡 Expiring soon
if (expires_at - today ≤ 0):       🔴 Expired
```

**Category Expiry Defaults:**
```
Eggs: 30d
Carrot: 14d
Ramen: 180d
Garlic: 60d
Butter: 90d
Kimchi: 30d
Green Onion: 7d
Milk: 14d
Apple: 21d
Cheese: 30d
Tofu: 7d
[... expandable list ...]
```

---

## 🔧 Technical Appendix

### A. OpenAI GPT-4o-mini (Vision + Text)

> **Note:** The implemented app uses **Gemini** (see **A2** below and
> `technical_implementation.md`). This OpenAI variant is kept only as an
> alternative reference.

**For photo + voice processing:**

```typescript
// Photo path
const response = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    {
      role: "user",
      content: [
        { type: "image_url", image_url: { url: imageBase64 } },
        { type: "text", text: "What dish is this? List ingredients from my fridge." }
      ]
    }
  ]
});

// Voice path
const response = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    {
      role: "user",
      content: "I made ramen with an egg and garlic. Parse: dish name + ingredients used."
    }
  ]
});
```

**Returns:**
```json
{
  "dishName": "Ramen",
  "ingredients_in_fridge": ["Ramen", "Eggs"],
  "ingredients_not_in_fridge": ["Garlic"]
}
```

---

### A2. Gemini — Voice Intent Parsing (Add ⇄ Consume)

The voice transcript is sent to **Gemini** (`@google/generative-ai`, default
`gemini-2.5-flash`) — the same model that reads receipt/dish images — with
`responseMimeType: "application/json"`. In **one call** Gemini both
**classifies the intent** and **extracts the items**:

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const model = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  generationConfig: { responseMimeType: "application/json" },
});

const prompt = `
You are a fridge assistant. Read the user's spoken sentence and decide ONE action:
- Bought / got groceries -> action "add": list the purchased items.
- Cooked / used food      -> action "consume": give the dish + the ingredients used,
  matched against the current fridge: ${JSON.stringify(fridgeItemNames)}.
Return JSON:
{ "action": "add" | "consume",
  "dishName"?: string,
  "items": [{ "emoji": string, "name": string }] }

User said: "${transcript}"
`;

const { response } = await model.generateContent(prompt);
const result = JSON.parse(response.text());   // strip ```json fences if present
```

**action = "add"** → `POST /api/fridge` (Confirm & Save); expiry auto-filled from
category averages, status 🟢 Fresh:
```json
{ "action": "add",
  "items": [ { "emoji": "🥛", "name": "Milk" }, { "emoji": "🍎", "name": "Apple" } ] }
```

**action = "consume"** → render the Used-it checklist, then `PATCH /api/fridge`
to set matched rows to `gone`:
```json
{ "action": "consume", "dishName": "Kimchi Jjigae",
  "items": [ { "emoji": "🥬", "name": "Kimchi" }, { "emoji": "🧄", "name": "Garlic" } ] }
```

> **Mock fallback** (no `GEMINI_API_KEY`): keyword heuristic decides intent —
> "bought / 샀 / 사 왔" → **add**, "made / 끓였 / 만들 / 구웠" → **consume** — so the
> whole voice flow stays demoable offline (matches `lib/gemini.ts` mock mode).

---

### A2b. Quick Voice Setup — Purchase-Time Expiry Math

For **onboarding** ("Quick Voice Setup"), the same `add` parse also extracts
**per-item timing** so an already-aging fridge isn't logged as brand new. Gemini
returns optional numeric fields and the **server** turns them into `expires_at`:

```typescript
// Gemini add items (timing optional):
// { name, emoji, expiresInDays?, boughtDaysAgo? }

const shelf = shelfLifeFor(name);              // category average
let expires_at;
if (expiresInDays != null)      expires_at = today + expiresInDays;        // explicit
else if (boughtDaysAgo != null) expires_at = today + (shelf - boughtDaysAgo); // aged
else                            expires_at = today + shelf;                // fresh
```

- "expires in 2 weeks" → `expiresInDays: 14` → `expires_at = today + 14`.
- "bought 3 days ago" → `boughtDaysAgo: 3` → `expires_at = today + (avg − 3)`.
- "last week / yesterday" map to 7 / 1 days ago.
- Computed in `app/api/voice/command` + `lib/store.ts` (`resolveExpiry`); the
  freshness 🟢🟡🔴 then follows from `expires_at` as usual.
- **Mock fallback** (no key): `parseTiming()` in `lib/gemini.ts` regex-extracts
  "N days/weeks ago" and "expires in N" per comma-chunk, so the math still works
  offline.

---

### A3. Gemini — Recipe Suggestions

When the user taps the expiring-items banner, the app sends the current fridge
(names + freshness) to **Gemini** (`responseMimeType: "application/json"`) and asks
for recipes that prioritize 🟡/🔴 items:

```typescript
const prompt = `
Suggest 3 recipes that use these soon-to-expire items first: ${expiringNames}.
Current fridge: ${JSON.stringify(fridgeItemNames)}.
For each recipe, split ingredients into "fromFridge" and "needToBuy".
Return JSON: { "recipes": [ { "emoji": string, "name": string,
  "fromFridge": string[], "needToBuy": string[], "steps": string[] } ] }
`;
```

- **Fridge-only** = `needToBuy` is empty; **Fridge + Add-ons** = `needToBuy` has items.
- After cooking, **[🍳 Cooked!]** reuses the Check-Dish checklist → `PATCH /api/fridge` sets used items to `gone`.
- Mock fallback (no key): return a couple of canned recipes built from the expiring names.

---

### B. BizCrush Live STT (Voice Transcription)

**Setup:**
1. Sign up: https://bizcru.sh
2. Get API key at: https://bizcru.sh/en/settings
3. Store in `.env.local`:
```
BIZCRUSH_API_KEY=sk-prod-xxxxxx
```

**Browser WebSocket:**
```javascript
const ws = new WebSocket(
  "wss://extapi.bizcrush.ai/v1/stt/stream?api_key=KEY&format=json"
);

ws.onopen = () => {
  ws.send(JSON.stringify({ encoding: "pcm16" }));
};

ws.onmessage = (e) => {
  const { chunk } = JSON.parse(e.data);
  if (chunk) {
    console.log(chunk.is_final ? "FINAL" : "interim", chunk.text);
  }
};

// Send PCM16 16kHz mono audio in 640-byte chunks (20ms)
function sendAudio(pcm) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(pcm);
  }
}

// End stream with empty frame (never call ws.close())
function endStream() {
  ws.send(new ArrayBuffer(0));
}
```

**Audio Capture:**
```javascript
const ctx = new AudioContext({ sampleRate: 16000 });
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const src = ctx.createMediaStreamSource(stream);

// Use AudioWorklet to convert Float32 → PCM16, buffer to 640-byte frames
```

---

### C. Security

- **Server-side only:** Keep `OPENAI_API_KEY` and `BIZCRUSH_API_KEY` in `.env.local`
- **Never expose in .env.example** (template file)
- **Demo mode:** Safe to serve API key from server route for 7-hour hackathon
- **Production:** Proxy STT through your server or use short-lived tokens

---

### D. Graceful Fallback

If API keys missing:
- **Photo path:** Use mock LLM (hardcoded dish name)
- **Voice path:** Use mock transcript (e.g., "I made ramen with an egg")
- **Full flow demoable offline**

---

## 🔗 References

- OpenAI: https://platform.openai.com/docs/guides/vision
- BizCrush API: https://extapi.bizcrush.ai/developer
- BizCrush Quick Start: https://bizcrush.app/blog/bizcrush-api-quick-start-guide

---

## 🚀 Status

**Spec complete and ready for implementation.** All paths — receipt scan, photo check, voice check, and **Gemini-routed voice commands that add 🛒 or consume 🍽️** — plus missing-ingredient detection are specified with UI, logic, and data flow.

