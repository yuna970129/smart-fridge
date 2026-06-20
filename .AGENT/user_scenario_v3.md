# 🧊 Fridge AI | User Scenario v3 — Voice in Check Dish (BizCrush STT)

**Language**: English
**Platform**: Web
**New Input Method**: 🎙️ Real-time voice via **BizCrush Speech-to-Text**, inside the Check Dish screen

> **Goal:** Inside **Check Dish**, instead of uploading a photo of the dish, the
> user can tap a mic and just *talk*. Saying *"나 라면 끓였어. 계란 하나 넣어서"*
> ("I made ramen with an egg") is transcribed in real time, turned into the used
> ingredients, and runs through the same Check Dish checklist.

This extends **Check Dish** in the integrated `user_scenario.md` — voice is an
**alternate input** (alongside photo), not a new screen.

---

## 0️⃣ Why Voice?

Today, **Check Dish** lets you record what you cooked by uploading a *photo*.
v3 adds a **second way to do the same thing — just talk.** Inside the Check
Dish screen, a mic button lets you say *"I made ramen with an egg"* instead of
snapping a picture.

| Check Dish input | Result |
|------------------|--------|
| 📷 Upload photo (existing) | AI identifies dish + used ingredients |
| 🎙️ Speak (new) | AI transcribes speech → identifies used ingredients |

Both paths end at the **same checklist** (Still have / Used all → Confirm), so
voice reuses the existing Check Dish flow — no separate screen, cleaner UX.

> **Design decision:** Voice lives **inside Check Dish**, not as a separate Home
> button. Tapping the mic is just an alternate input to the photo upload.

---

## 1️⃣ Home Screen (No change)

The Home screen keeps its **3 buttons** — voice is accessed inside Check Dish,
so nothing is added here.

```
┌─────────────────────────────┐
│      🧊 Fridge AI           │
│                             │
│  ⚠️ ALERT: 2 items expiring! │
│                             │
│  ┌─────────────────────┐    │
│  │  📸 Scan Receipt    │    │
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │  🍽️ Check Dish      │  ← voice lives in here
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │  📋 My Fridge       │    │
│  └─────────────────────┘    │
└─────────────────────────────┘
```

---

## 2️⃣ Check Dish — Now with Voice (Updated)

### Step 1️⃣ — Choose input: Photo or Voice

When entering Check Dish, the user can either upload a photo (existing) **or**
tap the mic to speak (new).

```
┌─────────────────────────────┐
│   🍽️ Check Dish             │
│                             │
│  ┌───────────────────────┐  │
│  │   📷  Upload a photo   │  │  ← existing
│  └───────────────────────┘  │
│                             │
│        — or —               │
│                             │
│      ┌───────────┐          │
│      │    🎙️     │          │  ← NEW: tap to speak
│      └───────────┘          │
│   "Tell me what you cooked" │
│                             │
│   ← Back                    │
└─────────────────────────────┘
```

**User Action:** Tap the **🎙️ mic** → browser asks for microphone permission →
start talking. (Or use the photo path exactly as before.)

---

### Step 2️⃣ — Live Transcription (Real-time)

As the user speaks, partial text appears **live** (interim results), then locks
in as final text. Powered by the BizCrush live STT WebSocket.

```
┌─────────────────────────────┐
│   🎙️ Listening…  ●REC        │
│                             │
│   "나 라면 끓였어. 계란       │
│    하나 넣어서…"             │   ← updates word-by-word
│                             │
│      ┌───────────┐          │
│      │    ⏹️ Stop  │          │
│      └───────────┘          │
└─────────────────────────────┘
```

- 🟢 Interim text shown in gray (still being recognized)
- ⚫ Final text shown in solid color
- Tap **⏹️ Stop** when done → audio stream ends, AI parses the full transcript

---

### Step 3️⃣ — AI Identifies the Dish & Used Ingredients

The final transcript is sent to the LLM, which (just like the photo path)
returns a **dish name + the fridge ingredients that were used**, pre-filling the
same checklist.

**Example: "나 라면 끓였어. 계란 하나 넣어서"**
```
┌─────────────────────────────┐
│  Heard: "I made ramen        │
│          with an egg"        │
│  Dish: Ramen                 │
│                             │
│  Did you use these?          │
│                             │
│  🍜 Ramen  [Still have][Used]│
│  🥚 Eggs   [Still have][Used]│
│                             │
│  [Confirm]   [Try Again]     │
└─────────────────────────────┘
```

This is the **exact same checklist** as the photo path — the only difference is
how the dish was captured (voice vs. photo). The transcript is shown for
transparency.

> **Note:** The mic primarily supports the *"I cooked …"* (USE) intent that
> matches Check Dish. If the user instead says *"I bought milk and eggs"*, the
> AI may surface an **ADD** suggestion — a possible enhancement, but the core
> v3 flow is voice-driven consumption inside Check Dish.

**User Action:** Review the checklist (pre-filled by AI), toggle Still have /
Used all per item, tap **Confirm**.

---

### Step 4️⃣ — Applied

```
┌─────────────────────────────┐
│        ✅ Done!              │
│  Ramen & Eggs marked used   │
│  and removed from fridge.   │
│                             │
│  [View My Fridge]  [Home]   │
└─────────────────────────────┘
```

Every "Used all" item is removed from inventory — identical to the photo path.

---

## 📊 Complete User Journey (Voice in Check Dish)

```
1. Home → Tap "🍽️ Check Dish"
2. On the Check Dish screen, tap the 🎙️ mic (instead of uploading a photo)
3. Speak: "나 라면 끓였어. 계란 하나 넣어서"
4. Live transcript appears as you speak
5. Tap Stop → AI: dish=Ramen, used=[Ramen, Eggs]
6. Same checklist shows Ramen + Eggs pre-marked "Used all"
7. Tap Confirm → both removed from fridge
```

---

## 🎯 Summary: What Must Be Built

| Feature | Required? | Description |
|---------|-----------|-------------|
| **Mic button in Check Dish** | ✅ | Add a 🎙️ option beside the photo upload on the Check Dish screen |
| **Mic capture** | ✅ | Browser mic → PCM16 16kHz mono audio frames |
| **Live STT** | ✅ | Stream audio to BizCrush WebSocket, show interim/final text |
| **Transcript → ingredients** | ✅ | LLM turns the spoken sentence into dish name + used fridge items |
| **Shared checklist** | ✅ | Reuse the existing Check Dish "Still have / Used all" checklist |
| **Apply to fridge** | ✅ | "Used all" items removed (same as photo path) |
| **Multi-language** | ⭐ | BizCrush auto-detects (Korean + English both work) |
| **ADD intent ("I bought…")** | ⭐ | Optional enhancement; core flow is USE inside Check Dish |
| **Speaker diarization** | ❌ | Not needed (single user) |

---

## 💾 Data Flow

```
🍽️ Check Dish screen → tap 🎙️ mic
   │
🎙️ Mic (browser)
   │  PCM16 16kHz mono, 640-byte/20ms frames
   ▼
BizCrush Live STT  (WebSocket)
   │  { "chunk": { "text", "is_final" } }
   ▼
Final transcript  ("I made ramen with an egg")
   │
   ▼
LLM parse  →  { "dishName": "Ramen", "ingredients": ["Ramen","Eggs"] }
   │
   ▼
Same Check Dish checklist  →  "Used all" → status: gone (removed)
```

No new screen and no new DB columns: voice is an alternate **input** to Check
Dish and reuses the existing checklist + the `ingredients` model from
`user_scenario.md`. The transcript→ingredients step mirrors the photo path's
`analyzeDish`, just starting from text instead of an image.

---

## 🔧 Technical Appendix — How to Use BizCrush (Real-time STT)

> Source: BizCrush API Quick Start + Developer docs
> (`https://extapi.bizcrush.ai/developer`).

### A. Get an API key
1. Sign up at **https://bizcru.sh** (Google login)
2. **Settings** → https://bizcru.sh/en/settings → **API Keys**
3. Click **"Issue API Key"** → copy immediately (shown once)
4. Format: `BIZCRUSH_API_KEY=sk-prod-xxxxxx` (up to 5 keys/account)

Store it server-side only:
```
# .env.local  (gitignored — never put real keys in .env.example)
BIZCRUSH_API_KEY=sk-prod-xxxxxx
```

### B. Live STT — WebSocket protocol
- **URL:** `wss://extapi.bizcrush.ai/v1/stt/stream?api_key=KEY&format=json`
  (alt base seen in quick-start: `wss://extapi-stt.bizcrush.ai/?api_key=KEY&format=json`)
- **Auth:** `api_key` query parameter
- **Handshake:** first send config, then audio
  ```jsonc
  // 1) send as text
  { "encoding": "pcm16" }
  // 2) server replies
  { "connected": true }
  ```
- **Audio:** raw **PCM16, 16 kHz, mono, 16-bit little-endian**, sent as
  **binary frames of 640 bytes (= 20 ms)**.
- **Results (streamed back):**
  ```jsonc
  { "chunk": { "id": 1, "text": "I made ramen", "is_final": false, "speaker": 0 } }
  ```
  `is_final:false` = interim (still updating), `true` = locked in.
- **End of audio:** send an **empty binary frame** (`b''` / `ArrayBuffer(0)`).
  ⚠️ Do **NOT** call `ws.close()` — the server needs the socket open to deliver
  trailing finals, then closes it itself (~5 s).

### C. Minimal browser example (from BizCrush docs)
```js
const ws = new WebSocket(
  "wss://extapi.bizcrush.ai/v1/stt/stream?api_key=KEY&format=json"
);
ws.onopen = () => ws.send(JSON.stringify({ encoding: "pcm16" }));
ws.onmessage = (e) => {
  const d = JSON.parse(e.data);
  if (d.connected) console.log("ready");
  if (d.chunk) console.log(d.chunk.is_final ? "FINAL" : "…", d.chunk.text);
};
function sendAudioChunk(pcm) {            // pcm = Int16 PCM bytes
  if (ws.readyState === WebSocket.OPEN) ws.send(pcm);
}
function endStream() { ws.send(new ArrayBuffer(0)); }  // never ws.close()
```

### D. Capturing PCM16 in the browser
```js
const ctx = new AudioContext({ sampleRate: 16000 });
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const src = ctx.createMediaStreamSource(stream);
// AudioWorklet converts Float32 → Int16 PCM, buffered into 640-byte frames,
// then posted to the main thread and sent over the WebSocket.
```

### E. Security note (important for our app)
The WebSocket authenticates with the API key in the URL. If the browser
connects directly, the key is exposed to the client.
- **Demo/hackathon:** acceptable for a single demo user; serve the key from a
  server route and document it as demo-only.
- **Production:** proxy the WebSocket through our server (key stays server-side)
  or use a short-lived token. Mirror the Gemini pattern — keep
  `BIZCRUSH_API_KEY` in `.env.local`, never in `.env.example`.

### F. Graceful fallback (no key)
Like the Gemini integration, the app should run without a BizCrush key:
- **With key:** real live transcription.
- **Without key (mock):** simulate a transcript (e.g. "I made ramen with an
  egg") so the full flow is demoable offline.

---

## 🔗 References
- API Quick Start: `https://bizcrush.app/blog/bizcrush-api-quick-start-guide`
- Developer docs: `https://extapi.bizcrush.ai/developer`
- Issue key: `https://bizcru.sh/en/settings`

---

**Status:** Spec only — ready for review. Implementation pending user GO. 🚀
