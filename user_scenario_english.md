# 🧊 Fridge AI | User Scenario

**Language**: English  
**Platform**: Web  
**Quantity Tracking**: Yes/No only (no numbers)  

---

## 1️⃣ Home Screen

**Display:**
```
┌─────────────────────────────┐
│                             │
│      🧊 Fridge AI          │
│                             │
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
│  ✓ 🥚 Eggs                 │
│  ✓ 🥕 Carrot               │
│  ✓ 🍜 Ramen                │
│  ✓ 🧄 Garlic               │
│  ✓ 🧈 Butter               │
│  ✓ 🥬 Kimchi               │
│  ✓ 🧅 Green Onion          │
│                             │
│  [Confirm & Save]           │
│  [Upload Again]             │
│                             │
└─────────────────────────────┘
```

**What User Sees:**
- AI-recognized ingredient list
- Each item with emoji (no quantity numbers)

**User Action:**
- Click "Confirm & Save" → Ingredients added to fridge
- Click "Upload Again" → Upload different receipt

**What Happens:**
- All ingredients added to "My Fridge" (status: "Have")

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
- "Still have" → Keep in fridge (status remains "Have")
- "Used all" → Remove from fridge (status becomes "Gone")

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
- Changes saved to fridge inventory
- User returns to home screen

---

## 4️⃣ Feature 0-c: My Fridge

### Display

**Current Fridge Inventory:**

```
┌─────────────────────────────┐
│                             │
│   📋 My Fridge              │
│                             │
│  🥚 Eggs                    │
│      [🗑️ Delete]            │
│                             │
│  🥕 Carrot                  │
│      [🗑️ Delete]            │
│                             │
│  🍜 Ramen                   │
│      [🗑️ Delete]            │
│                             │
│  🧈 Butter                  │
│      [🗑️ Delete]            │
│                             │
│  🥬 Kimchi                  │
│      [🗑️ Delete]            │
│                             │
│  ← Back to Home             │
│                             │
└─────────────────────────────┘
```

**What User Sees:**
- All ingredients in fridge (emoji + name only)
- Delete button next to each ingredient

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
3. AI analyzes → Shows:
   🥚 Eggs
   🥕 Carrot
   🍜 Ramen
   🧄 Garlic
   🧈 Butter
4. Click "Confirm & Save"
5. All ingredients added to fridge
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
6. Kimchi & Green Onion removed from fridge
   Garlic stays in fridge
```

### Day 3: Fridge Management

```
1. Home Screen → Click "📋 My Fridge"
2. Current fridge shows:
   🥚 Eggs
   🥕 Carrot
   🍜 Ramen
   🧈 Butter
   🧄 Garlic
3. Carrot went bad → Click "🗑️" next to Carrot
4. Confirm "Delete Carrot from fridge?"
5. Click "Yes"
6. Carrot removed from fridge
```

---

## 🎯 Summary: What Must Be Built

| Feature | Required? | Description |
|---------|-----------|-------------|
| **Home Screen** | ✅ | 3 buttons (Scan Receipt, Check Dish, My Fridge) |
| **Scan Receipt** | ✅ | Upload → AI analyze → Show list → Save to database |
| **Check Dish** | ✅ | Upload → AI analyze → Show checklist → Update database |
| **My Fridge** | ✅ | Display all ingredients → Delete function |
| **Database** | ✅ | Store ingredients (Yes/No status only) |
| **AI (LLM)** | ✅ | Recognize receipt text, identify dish & ingredients used |
| **Web Interface** | ✅ | Simple HTML/React buttons & screens |
| **Photo Capture** | ❌ | File upload only (for demo) |
| **Quantity Tracking** | ❌ | Not needed (yes/no only) |
| **Pretty Design** | ❌ | Function > Design for hackathon |
| **User Login** | ❌ | Single demo user |
| **Recipe Suggestions** | ❌ | Phase 2 feature |

---

## 💾 Data Model (Simple)

**Fridge Ingredients:**
```
[
  { emoji: "🥚", name: "Eggs", status: "Have" },
  { emoji: "🥕", name: "Carrot", status: "Have" },
  { emoji: "🍜", name: "Ramen", status: "Have" },
  { emoji: "🧄", name: "Garlic", status: "Have" },
  { emoji: "🧈", name: "Butter", status: "Gone" },
  { emoji: "🥬", name: "Kimchi", status: "Gone" }
]
```

**Status Values:**
- "Have" = Ingredient exists in fridge
- "Gone" = Ingredient removed from fridge

---

**Ready to build this?** 🚀
