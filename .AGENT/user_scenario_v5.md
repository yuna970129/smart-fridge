# 🧊 Fridge AI | User Scenario — Complete (v3 Final)

**Language**: English  
**Platform**: Web  
**Core Features**: Receipt scan, dish check (photo + voice), fridge management  
**Advanced Features**: Real-time voice STT + missing ingredients auto-add

---

## 📖 Overview

**Fridge AI** helps you manage what's in your fridge and what you cook:

1. **📸 Scan Receipt** — Upload receipt photos → AI extracts ingredients → auto-assign expiry dates
2. **🍽️ Check Dish** — Two ways to record what you cooked:
   - 📷 Upload a dish photo (original)
   - 🎙️ Speak what you cooked (new voice STT)
3. **💡 Smart Recipe Suggestion** — AI recommends recipes based on expiring items (use only fridge vs. need to buy)
4. **📋 My Fridge** — View all ingredients with freshness status (🟢🟡🔴) + manage expiry

---

## 1️⃣ Home Screen (Updated)

```
┌─────────────────────────────┐
│                             │
│      🧊 Fridge AI           │
│                             │
│  ⚠️ Smart Recipe Banner      │
│  "Onion, Carrot expiring.   │
│   Click for recipes!"        │ ← NEW: Clickable
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
│  │  📋 My Fridge       │    │
│  └─────────────────────┘    │
│                             │
└─────────────────────────────┘
```

**Urgent Expiring Banner:**
- Shows count of items expiring soon (🟡) or expired (🔴)
- **🆕 Now clickable** → Navigate to Smart Recipe Suggestions
- Hidden when no items need attention

**User Actions:**
- Tap "⚠️ Smart Recipe Banner" → Recipe recommendations
- Tap "📸 Scan Receipt"
- Tap "🍽️ Check Dish"
- Tap "📋 My Fridge"

---

## 2️⃣ Scan Receipt

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

## 3️⃣ Check Dish — Photo Path (Original)

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

## 4️⃣ Check Dish — Voice Path (NEW)

### Step 1️⃣ — Choose Input: Photo or Voice

```
┌─────────────────────────────┐
│   🍽️ Check Dish             │
│                             │
│  ┌───────────────────────┐  │
│  │   📷  Upload a photo   │  │
│  └───────────────────────┘  │
│                             │
│        — or —               │
│                             │
│      ┌───────────┐          │
│      │    🎙️     │          │
│      └───────────┘          │
│   "Tell me what you cooked" │
│                             │
│  ← Back                     │
└─────────────────────────────┘
```

**User Action:** Tap **🎙️ mic** → browser requests microphone permission.

---

### Step 2️⃣ — Live Transcription (Real-time)

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

### Step 3️⃣ — AI Identifies Dish & Used Ingredients

The transcript is sent to the LLM, which returns:
- **Dish name**
- **Ingredients in your fridge that were used**

```
Input: "I made ramen with an egg"

LLM Output:
{
  "dishName": "Ramen",
  "ingredients": ["Ramen", "Eggs"]
}
```

---

### Step 4️⃣ — Standard Checklist

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

### Step 5️⃣ — Applied

```
┌─────────────────────────────┐
│        ✅ Done!              │
│                             │
│  Items removed:             │
│  - Ramen, Eggs, Garlic      │
│                             │
│  [View My Fridge] [Home]    │
└─────────────────────────────┘
```

---

## 5️⃣ Smart Recipe Suggestion (NEW)

### Step 1️⃣ — Recommended Recipes List

When user taps the **⚠️ Smart Recipe Banner**, AI analyzes expiring items and generates recipe suggestions.

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

### Step 3️⃣ — Confirm Used Items (Like Check Dish)

Just like Check Dish, user selects which items were fully used vs. partially used.

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
- Tap **[Confirm]** → items marked "Used all" are removed from fridge

---

### Step 4️⃣ — Update Fridge

When user taps **[Confirm]**:
- Items marked "Used all" are removed from fridge
- User is returned to Home screen
- Fridge inventory automatically updated

```
Example:
Before: [Carrot: 🟡], [Onion: 🟡]
If user selects: Carrot "Used all", Onion "Still have"
After: [Onion: 🟡] (only Carrot removed)
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

## 📊 Complete User Journey

### Day 1: Shopping

```
1. Home → "📸 Scan Receipt"
2. Upload receipt photo
3. AI: 🥚 Eggs (30d), 🥕 Carrot (14d), 🍜 Ramen (180d), 🧄 Garlic (60d)
4. Tap "Confirm & Save"
5. All added to fridge (🟢 Fresh)
```

### Day 2: Smart Recipe Recommendations

```
1. Home → See "⚠️ Smart Recipe Banner: Carrot, Onion expiring"
2. Tap banner → Recipe recommendations
3. AI suggests:
   - 🍳 Fried Rice (fridge-only)
   - 🍲 Veggie Curry (needs Potato, Curry Powder)
   - 🥗 Egg Salad (needs Lettuce, Mayo)
4. Tap "🍲 Veggie Curry"
5. View ingredients + instructions
6. Follow instructions and cook
7. Tap "🍳 Cooked! (Next)"
8. Confirm used items:
   - Carrot: [Still have] or [Used all] ← select
   - Onion: [Still have] or [Used all] ← select
9. Tap Confirm → selected items removed (like Check Dish)
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
| **Home Screen** | ✅ | 3 buttons + Alert banner (now clickable for recipes) |
| **Scan Receipt** | ✅ | Upload → AI extract → auto-expiry → save |
| **Check Dish (Photo)** | ✅ | Upload → AI identify → checklist |
| **Check Dish (Voice)** | ✅ | 🎙️ tap → BizCrush STT → AI identify → checklist |
| **🆕 Smart Recipe Suggestion** | ✅ | AI recommends recipes based on expiring items |
| **🆕 Fridge-only vs Add-ons** | ✅ | Categorize recipes (use only fridge vs. need to buy) |
| **🆕 Auto-deduct** | ✅ | [Cooked!] button → auto-remove used items from fridge |
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
[... expandable list ...]
```

---

## 🔧 Technical Appendix

### A. OpenAI GPT-4o-mini (Vision + Text)

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

**Spec complete and ready for implementation.** All three paths (receipt scan, photo check, voice check) and missing ingredients detection are specified with UI, logic, and data flow.

