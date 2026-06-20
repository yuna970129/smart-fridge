🧊 Fridge AI | User Scenario (Updated)Language: EnglishPlatform: WebFreshness Tracking: Auto-calculated based on food category1️⃣ Home Screen (Updated)
Display:
┌─────────────────────────────┐
│                             │
│      🧊 Fridge AI          │
│                             │
│  ⚠️ ALERT: 2 items expiring!│  <-- Urgent Expiring Banner
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
New Features:Urgent Expiring Banner: Highlights items with Red (Expired) or Yellow (Expiring soon) status.2️⃣ Feature 0-a: Scan Receipt (Updated)Step 3️⃣: AI Results (Ingredient List)
Display:
┌─────────────────────────────┐
│  Found in Receipt:          │
│                             │
│  ✓ 🥚 Eggs (Avg 30d)       │
│  ✓ 🥕 Carrot (Avg 14d)     │
│                             │
│  [Confirm & Save]           │
└─────────────────────────────┘
Update:AI recognizes ingredients and automatically assigns expiration dates based on general category averages (e.g., Eggs: 30 days).3️⃣ Feature 0-b: Check Dish (Updated)User Action:Same as previous (Upload photo → Select "Still have" or "Used all").Automatic Sync: Clicking "Used all" automatically removes the item from the inventory.
4️⃣ Feature 0-c: My Fridge (Updated)DisplayUpdated Inventory List:┌─────────────────────────────┐
│   📋 My Fridge              │
│  [Filter: All / Fresh / Expiring] │
│                             │
│  🟢 🥚 Eggs (28d left)      │
│      [🗑️ Delete]            │
│                             │
│  🟡 🥕 Carrot (2d left)     │
│      [🗑️ Delete]            │
│                             │
│  🔴 🥓 Ham (Expired!)       │
│      [🗑️ Delete]            │
│                             │
└─────────────────────────────┘
New Features:Status Icons:🟢 Green: Fresh (4+ days left)🟡 Yellow: Expiring soon (≤3 days left)🔴 Red: ExpiredAuto-Expiry Logic:Expiration date is calculated as Date of Scan + Category Average.Filtering: Users can sort by expiration date or status.📊 Complete User Journey (Updated)Day 1: Shopping at MartHome Screen → Click "📸 Scan Receipt"Upload receipt photoAI analyzes → Shows ingredients + Automatic Expiry Date (e.g., "Milk - Avg 14 days")Click "Confirm" → Saved to fridge with status 🟢Day 2: Fridge ManagementHome Screen → See "⚠️ ALERT: 1 item expiring!" in the banner.Click "📋 My Fridge"Check Carrot status 🟡 (Expiring soon!)Delete bad items using 🗑️ button.🎯 Summary: What Must Be Built (Updated)FeatureRequired?DescriptionHome Screen✅3 buttons + Urgent Alert BannerScan Receipt✅Upload → AI analyze → Auto-set expiry dateCheck Dish✅Upload → AI analyze → Toggle consumptionMy Fridge✅Display Freshness (🟢🟡🔴) + Sort/FilterDatabase✅Store ingredients + Expiry datesAI (LLM)✅Recognize text/dish + Assign category dates💾 Updated Data ModelFridge Ingredients:[
  { 
    emoji: "🥚", 
    name: "Eggs", 
    added_at: "2026-06-20", 
    expires_at: "2026-07-20", // Added automatically (30 days)
    status: "Fresh" 
  }
]
Status Logic:Green: expires_at - today > 3 daysYellow: expires_at - today <= 3 daysRed: expires_at - today <= 0 days