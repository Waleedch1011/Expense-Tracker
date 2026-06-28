# PWA + Quick Add Setup

Yeh package aapki existing expense tracker app mein 3 cheezein add karta hai:

1. **PWA** — Home screen pe installable, fast cached loads
2. **`/quick` route** — Bina login ke fast transaction entry page (offline support ke saath)
3. **Offline queue** — Internet na ho to localStorage mein save hota hai, online aane par auto-sync

---

## Files is package mein

```
package.json                         (REPLACE)
vite.config.js                       (REPLACE)
index.html                           (REPLACE)
src/App.jsx                          (REPLACE)
src/main.jsx                         (REPLACE)
src/QuickAdd.jsx                     (NEW)
public/icon-192.png                  (NEW)
public/icon-512.png                  (NEW)
OPTIONAL-supabase-policy.sql         (Optional — Supabase mein run karna)
```

---

## Setup Steps

### 1. ZIP extract karo
Apne local repo folder mein (jahan `package.json` hai) extract karo. Existing files overwrite ho jayengi — jo files "REPLACE" hain woh purani versions ki jagah aa jayengi.

### 2. Dependencies install karo
Terminal mein repo folder mein:
```bash
npm install
```
Yeh `vite-plugin-pwa` install kar dega (jo `package.json` mein add ho gaya hai).

### 3. Local test (optional but recommended)
```bash
npm run dev
```
Browser mein:
- `http://localhost:5173/` — main app (login wala)
- `http://localhost:5173/quick` — naya quick add page

Quick page khol ke ek test transaction add karke dekho. Supabase mein appear hona chahiye.

### 4. Git commit + push
```bash
git add .
git commit -m "Add PWA support and /quick route for fast mobile entry"
git push
```
Vercel apne aap deploy kar dega (1-2 min).

### 5. Phone pe install karo
Vercel deploy hone ke baad:
1. Phone par Chrome (Android) ya Safari (iOS) mein kholo:
   `https://waleedexpense.vercel.app/quick`
2. Browser menu → **"Add to Home screen"**
3. Icon home screen pe aa jayega
4. Ek tap mein quick page khulega — almost instant load (cached)

### 6. (Optional) Supabase policy lagao
Agar aap chahte ho ke aapki custom categories/accounts (jo dashboard Settings tab se add hoti hain) `/quick` page pe bhi automatic dikhain:
1. Supabase Dashboard → SQL Editor
2. `OPTIONAL-supabase-policy.sql` file ka content paste karke run karo

Agar yeh nahi karte, `/quick` page hardcoded list use karega (jo abhi DEFAULT_SETTINGS mein hain). Form phir bhi pura kaam karega.

---

## Kya kaam karta hai

### Quick Add Page (`/quick`)
- ✅ Saare 9 transaction types (Income, Expense, Transfer, Loan Given, etc.)
- ✅ Categories dropdown
- ✅ Group buttons (Personal/Office)
- ✅ From/To Account (To sirf Transfer ke time)
- ✅ Party (sirf Loan types ke time)
- ✅ Description + Notes (collapsible "More" section mein date bhi)
- ✅ Recent 3 transactions preview
- ✅ Online/Offline status indicator
- ✅ Offline queue with auto-sync

### Offline Mode
- Service worker app shell cache karta hai → instant load
- Transactions offline submit kar saktay ho → localStorage mein queue hota hai
- Internet aate hi auto-flush — toast notification se confirm ho jata hai
- Queue count header mein dikhta hai (e.g. "⏳ 3")

### PWA Features
- Home screen pe installable
- Standalone app mode (no browser bar)
- Long-press shortcut: "Quick Add" → seedha `/quick` open
- Theme color matches app

---

## Security

`/quick` page **bina login** kaam karta hai — kyunki existing RLS policy (jo humne Apps Script ke liye banaya tha) anon role ko sirf aapke specific user_id ke under insert karne deti hai.

Matlab agar koi `/quick` URL khol bhi le (URL share ya leak ho), woh:
- ❌ Kuch read nahi kar sakta
- ❌ Kisi aur ki transactions nahi chhed sakta
- ⚠️ Sirf aapke account mein fake transaction add kar sakta hai (Google Form jaisa risk)

URL sensitive nahi hai per se, lekin best practice: kisi ke saath share mat karna.

---

## Troubleshooting

**Service worker register nahi ho raha:**
- Build production mein hi register hota hai. Local dev mein bhi enable karna ho to `vite.config.js` mein `VitePWA({ devOptions: { enabled: true } })` add karo.

**Categories dynamic nahi aa rahi:**
- Step 6 ka SQL run karo (RLS policy for user_settings SELECT).

**Form submit nahi ho raha:**
- Browser console kholo (F12) — error log dekho
- Supabase RLS policy (humne Apps Script ke time banayi thi) zaroor enabled honi chahiye

**"Add to home screen" option nahi dikh raha:**
- HTTPS pe deploy karna zaroori hai (Vercel ka URL automatically HTTPS hai)
- Pehli baar visit ke baad service worker install hota hai, refresh karke try karo

---

Banaya gaya: Claude (Anthropic) | Stack: Vite + React + Supabase + vite-plugin-pwa
