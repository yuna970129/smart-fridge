# 🧊 Fridge AI | User Scenario

**Language**: English
**Platform**: Web
**Quantity Tracking**: Yes/No only (no numbers)
**Freshness Tracking**: Auto-calculated based on food category

---

## 1️⃣ Home Screen

**Display:**
```
┌─────────────────────────────┐
│                             │
│      🧊 Fridge AI          │
│                             │
│  ⚠️ ALERT: 2 items expiring! │  ← Urgent Expiring Banner
|                            │
│  ┌─────────────────────┐   │
│  │  📸 Scan Receipt    │   │
│  └─────────────────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │  🍽️ Check Dish      │   │
│  └─────────────────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │  📋 My Fridge       │   │
│  └─────────────────────┘   │
│                             │
└─────────────────────────────┘
```

**User Actions:**
- Click "📸 Scan Receipt"
- Click "🍽️ Check Dish"
- Click "📋 My Fridge"

**Urgent Expiring Banner:**
- Highlights items with 🔴 Red (Expired) or 🟡 Yellow (Expiring soon) status.
- Shows a live count of items that need attention.
- Hidden when no items are expiring.

---

## 2️⃣ Feature 0-a: Scan Receipt

### Step 1️⃣: Upload Receipt

**Display:**
```
┌─────────────────────────────┐
│                             │
│   📸 Scan Receipt           │
│                             │
│                             │
│  [Choose File Button]       │
│  (Upload receipt image)     │
│                             │
│                             │
│  ← Back                     │
│                             │
└─────────────────────────────┘
```

**User Action:**
- Click "Choose File"
- Select receipt photo from phone/computer
- Upload file

---

### Step 2️⃣: AI Analyzing (Loading)

**Display:**
```
┌─────────────────────────────┐
│                             │
│   Analyzing...              │
│   ⏳ Reading receipt        │
│                             │
└─────────────────────────────┘
```

---

### Step 3️⃣: AI Results (Ingredient List)

**Display:**
```
┌─────────────────────────────┐
│                             │
│  Found in Receipt:          │
│                             │
│  ✓ 🥚 Eggs (Avg 30d)       │
│  ✓ 🥕 Carrot (Avg 14d)     │
│  ✓ 🍜 Ramen (Avg 180d)     │
│  ✓ 🧄 Garlic (Avg 60d)     │
│  ✓ 🧈 Butter (Avg 90d)     │
│  ✓ 🥬 Kimchi (Avg 30d)     │
│  ✓ 🧅 Green Onion (Avg 7d) │
│                             │
│  [Confirm & Save]           │
│  [Upload Again]             │
│                             │
└─────────────────────────────┘
```

**What User Sees:**
- AI-recognized ingredient list
- Each item with emoji (no quantity numbers)
- **Automatically assigned expiration window** based on general category averages (e.g., Eggs: 30 days)

**User Action:**
- Click "Confirm & Save" → Ingredients added to fridge
- Click "Upload Again" → Upload different receipt

**What Happens:**
- All ingredients added to "My Fridge" (status: 🟢 Fresh)
- Each ingredient's `expires_at` = Date of Scan + Category Average

---

## 3️⃣ Feature 0-b: Check Dish

### Step 1️⃣: Upload Dish Photo

**Display:**
```
┌─────────────────────────────┐
│                             │
│   🍽️ Check Dish            │
│                             │
│                             │
│  [Choose File Button]       │
│  (Upload dish photo)        │
│                             │
│                             │
│  ← Back                     │
│                             │
└─────────────────────────────┘
```

**User Action:**
- Click "Choose File"
- Select cooked dish photo
- Upload file

---

### Step 2️⃣: AI Analyzing (Loading)

**Display:**
```
┌─────────────────────────────┐
│                             │
│   Analyzing...              │
│   ⏳ Identifying dish       │
│   and ingredients           │
│                             │
└─────────────────────────────┘
```

---

### Step 3️⃣: AI Results (Checklist)

**Example: User uploaded Kimchi Jjigae (김치찌개) photo**

**Display:**
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
│  🥘 Gochugaru (chili flake) │
│    [Still have] [Used all] │
│                             │
│  [Confirm]  [Cancel]        │
│                             │
└─────────────────────────────┘
```

**What User Sees:**
- AI-recognized dish name
- List of ingredients from MY FRIDGE that were likely used
- For each ingredient: 2 buttons

**User Action:**
For each ingredient, click ONE button:
- "Still have" → Keep in fridge (status remains its current freshness)
- "Used all" → Remove from fridge (item is gone)

**Example Flow:**
```
🥬 Kimchi: User clicks "Used all"
  → Kimchi removed from fridge

🧄 Garlic: User clicks "Still have"
  → Garlic stays in fridge

🧅 Green Onion: User clicks "Used all"
  → Green Onion removed from fridge
```

**After User Clicks "Confirm":**
- **Automatic Sync:** Every "Used all" item is immediately removed from the inventory
- Changes saved to fridge inventory
- User returns to home screen

---

## 4️⃣ Feature 0-c: My Fridge

### Display

**Current Fridge Inventory:**

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
│  🟢 🧈 Butter (85d left)          │
│      [🗑️ Delete]                  │
│                                   │
│  ← Back to Home                   │
│                                   │
└───────────────────────────────────┘
```

**What User Sees:**
- All ingredients in fridge (status icon + emoji + name + days left)
- Delete button next to each ingredient
- Filter bar to sort by freshness/status

**Status Icons (Auto-calculated):**
- 🟢 **Green — Fresh:** 4+ days left
- 🟡 **Yellow — Expiring soon:** ≤ 3 days left
- 🔴 **Red — Expired:** 0 days left (past `expires_at`)

**Auto-Expiry Logic:**
- Expiration date is calculated as `Date of Scan + Category Average`.
- Status icon updates automatically each day.

**Filtering:**
- Users can sort/filter by expiration date or status (All / Fresh / Expiring).

**User Action:**
- Click "🗑️" button next to any ingredient
- Confirmation: "Delete [ingredient] from fridge?"
- Click "Yes" → Item removed
- Click "No" → Cancel

**Example:**
```
User: Clicks "🗑️" next to Carrot
↓
System: "Delete Carrot from fridge?"
↓
User: Clicks "Yes"
↓
Result: Carrot disappears from list
```

---

## 📊 Complete User Journey

### Day 1: Shopping at Mart

```
1. Home Screen → Click "📸 Scan Receipt"
2. Upload receipt photo
3. AI analyzes → Shows ingredients + auto expiry date:
   🥚 Eggs (Avg 30d)
   🥕 Carrot (Avg 14d)
   🍜 Ramen (Avg 180d)
   🧄 Garlic (Avg 60d)
   🧈 Butter (Avg 90d)
4. Click "Confirm & Save"
5. All ingredients added to fridge with status 🟢 Fresh
```

### Day 2: Cooked a Dish

```
1. Home Screen → Click "🍽️ Check Dish"
2. Upload cooked dish photo (Kimchi Jjigae)
3. AI analyzes → Shows checklist:
   🥬 Kimchi: [Still have] [Used all]
   🧄 Garlic: [Still have] [Used all]
   🧅 Green Onion: [Still have] [Used all]
4. User selects:
   - Kimchi: "Used all" ✓
   - Garlic: "Still have" ✓
   - Green Onion: "Used all" ✓
5. Click "Confirm"
6. Kimchi & Green Onion auto-removed from fridge
   Garlic stays in fridge
```

### Day 3: Fridge Management

```
1. Home Screen → See "⚠️ ALERT: 1 item expiring!" in the banner
2. Click "📋 My Fridge"
3. Current fridge shows:
   🟢 🥚 Eggs (28d left)
   🟡 🥕 Carrot (2d left)   ← Expiring soon!
   🟢 🍜 Ramen (175d left)
   🟢 🧈 Butter (85d left)
   🟢 🧄 Garlic (58d left)
4. Carrot went bad → Click "🗑️" next to Carrot
5. Confirm "Delete Carrot from fridge?"
6. Click "Yes"
7. Carrot removed from fridge
```

---

## 🎯 Summary: What Must Be Built

| Feature | Required? | Description |
|---------|-----------|-------------|
| **Home Screen** | ✅ | 3 buttons + Urgent Expiring Alert Banner |
| **Scan Receipt** | ✅ | Upload → AI analyze → Auto-set expiry date → Save to database |
| **Check Dish** | ✅ | Upload → AI analyze → Toggle consumption → Auto-sync inventory |
| **My Fridge** | ✅ | Display freshness (🟢🟡🔴) + days left + Sort/Filter + Delete |
| **Database** | ✅ | Store ingredients + expiry dates (Yes/No status) |
| **AI (LLM)** | ✅ | Recognize receipt text, identify dish & ingredients, assign category dates |
| **Web Interface** | ✅ | Simple HTML/React buttons & screens |
| **Photo Capture** | ❌ | File upload only (for demo) |
| **Quantity Tracking** | ❌ | Not needed (yes/no only) |
| **Pretty Design** | ❌ | Function > Design for hackathon |
| **User Login** | ❌ | Single demo user |
| **Recipe Suggestions** | ❌ | Phase 2 feature |

---

## 💾 Data Model

**Fridge Ingredients:**
```json
[
  {
    "emoji": "🥚",
    "name": "Eggs",
    "added_at": "2026-06-20",
    "expires_at": "2026-07-20",
    "status": "Fresh"
  },
  {
    "emoji": "🥕",
    "name": "Carrot",
    "added_at": "2026-06-20",
    "expires_at": "2026-07-04",
    "status": "Fresh"
  }
]
```

- `added_at`: Date the ingredient was scanned/saved.
- `expires_at`: Added automatically (`added_at` + category average, e.g. Eggs = 30 days).
- `status`: Derived from `expires_at` vs. today.

**Status Logic (auto-calculated):**
- 🟢 **Fresh:** `expires_at − today > 3 days`
- 🟡 **Expiring soon:** `expires_at − today ≤ 3 days`
- 🔴 **Expired:** `expires_at − today ≤ 0 days`

When an ingredient is consumed via "Check Dish → Used all" or deleted in "My Fridge", it is removed from the list entirely.

---

**Ready to build this?** 🚀
