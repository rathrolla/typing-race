# Typing Race

Online multiplayer typing speed game for **4 or 8 players**. Race through **10 rounds** of progressively longer words (3→12 letters), with scaling timeouts and funny **3D word animations**.

## Quick Start (solo / local)

```bash
npm install
npm run build -w shared
npm run dev
```

- **Client**: http://localhost:5173
- **Server**: http://localhost:3002

## Play with Friends on the Same Wi-Fi (LAN)

This is the easiest way to host a session for friends in the same room or on the same network.

```bash
npm run dev:lan
```

That command will:

1. Detect your computer's local IP (e.g. `192.168.1.42`)
2. Write `client/.env` with `VITE_SOCKET_URL=http://YOUR_IP:3002`
3. Start the client and server
4. Print a **shareable link** like `http://192.168.1.42:5173`

**What to share with friends:**

| Share | Example |
|-------|---------|
| Game link | `http://192.168.1.42:5173` |
| Room code | Shown in your lobby after you create a room |

Friends open the game link, click **Join Room**, enter the code, and play. They do **not** need the server URL separately — it's configured in the client automatically.

### Windows Firewall (most common fix)

If friends see **"not reachable"** or **"connection refused"**:

1. **Right-click** `scripts/open-firewall.bat` → **Run as administrator**
2. Stop old dev servers (close other terminals running `npm run dev`)
3. Run `npm run dev:lan` again
4. Share the **exact URL** printed in the terminal (usually `http://YOUR_IP:5173`)

Run `npm run check:lan` to verify ports are open.

### Friends still can't connect?

| Check | Why |
|-------|-----|
| Same Wi-Fi? | Mobile data or a different network won't reach `10.x.x.x` |
| Office/guest Wi-Fi? | Many networks block device-to-device traffic |
| Correct port? | Use the URL from `dev:lan`, not an old port like `:5175` |
| Test on your phone | Open the LAN URL on your phone (Wi-Fi on, not mobile data) |

If it fails on your phone too → firewall issue. Run `open-firewall.bat` as admin.

If it works on your phone but not friends' → their network may block peer connections.

### Manual LAN setup

If you prefer to configure it yourself:

1. Find your local IP (`ipconfig` on Windows, `ifconfig` / `ip addr` on Mac/Linux)
2. Create `client/.env`:
   ```
   VITE_SOCKET_URL=http://192.168.1.42:3002
   ```
3. Run `npm run dev`
4. Share `http://192.168.1.42:5173` with friends

## Deploy updates (why local works but live site doesn't)

Your code is on GitHub **`master`**. Two separate hosts must both redeploy:

| What changed | Where it runs | Host |
|--------------|---------------|------|
| UI (podium, confetti, solo, etc.) | React app | **Vercel** ← friends open this URL |
| API / multiplayer | Socket.io server | **Render** ← do not share this URL |

**Opening `https://typing-race-d9ix.onrender.com` will NOT show the game UI** — that is the server only.

### After every `git push`

1. **Render** → Dashboard → your service → **Events** → confirm latest deploy succeeded (branch **`master`**)
2. **Vercel** → Project → **Deployments** → confirm latest deploy succeeded
3. Hard-refresh the Vercel URL: **Ctrl+Shift+R**

### If Render didn't auto-deploy

Render dashboard → **Manual Deploy** → **Deploy latest commit**

### If you never set up Vercel (most common)

Client changes will **only** appear locally until Vercel exists:

1. [vercel.com](https://vercel.com) → **Add New Project** → import `rathrolla/typing-race`
2. **Production branch:** `master`
3. **Environment variable:** `VITE_SOCKET_URL` = `https://typing-race-d9ix.onrender.com`
4. Deploy → share the `*.vercel.app` URL

Root `vercel.json` in this repo configures the monorepo build automatically.

### If Vercel build fails with `No workspaces found: --workspace=shared`

Vercel is running the build from the wrong folder. Fix **one** of these:

**Option A (recommended):** Project → Settings → General → **Root Directory** → leave **empty** (repo root). Redeploy.

**Option B:** Set Root Directory to **`client`** — the repo includes `client/vercel.json` which installs from the monorepo root automatically.

Also clear any custom **Build Command** in Vercel project settings so `vercel.json` controls the build.

---

## Play Over the Internet

`localhost` and LAN IPs only work on your network. For friends elsewhere, deploy both parts:

| Part | Suggested hosts |
|------|-----------------|
| **Server** | [Railway](https://railway.app), [Render](https://render.com), [Fly.io](https://fly.io) |
| **Client** | [Vercel](https://vercel.com), [Netlify](https://netlify.com), [Cloudflare Pages](https://pages.cloudflare.com) |

**Deploy steps (overview):**

1. Deploy the server (`server/`) and note the public URL, e.g. `https://typing-race-api.up.railway.app`
2. Set `VITE_SOCKET_URL` to that URL when building the client
3. Deploy the `client/dist` folder (or connect the repo with build env var)
4. Share the public client URL + room code

**Quick tunnel (no deploy):** Tools like [ngrok](https://ngrok.com) or [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) can expose your local server temporarily. You'd tunnel port **3001**, set `VITE_SOCKET_URL` to the tunnel URL, and share your LAN/public client URL.

## Play Solo (no server needed)

Click **Play Solo** on the landing screen — works offline and without a room code.

| Mode | Description |
|------|-------------|
| **Practice** | Just you vs the clock — 10 rounds, 3→12 letters |
| **vs Computer** | Race against 1–3 bots (Easy / Medium / Hard) |

Solo mode runs entirely in the browser. No Socket.io connection required.

## How to Play (Multiplayer)

1. **Host** creates a room and picks 4 or 8 players
2. Share the **game link** and **room code** with friends
3. Everyone joins, clicks **Ready Up**
4. Host clicks **Start Game**
5. Type each word as fast as you can — longer words get more time
6. Winners are ranked by round wins, then average WPM

## Scoring

- Finish in time beats timing out
- Fastest completion wins the round
- Tie-breaker: higher WPM (`wordLength / 5 / minutes`)
- Overall: most round wins → highest avg WPM → fastest single word

## Timeout Formula

```
timeout = 3s + (wordLength × 0.8s)
```

| Letters | Time |
|---------|------|
| 3 | 5.4s |
| 6 | 7.8s |
| 9 | 10.2s |
| 12 | 12.6s |

## Tech Stack

- **Client**: React, Vite, Tailwind CSS, Framer Motion, React Three Fiber
- **Server**: Node.js, Express, Socket.io
- **Shared**: TypeScript types, scoring, events

## Environment

Copy `client/.env.example` to `client/.env` to customize the socket URL:

```
VITE_SOCKET_URL=http://localhost:3002
```

Use `npm run dev:lan` to auto-configure this for Wi-Fi play.

## Project Structure

```
typing-race/
  client/    # React frontend + 3D word stage
  server/    # Game authority + word API
  shared/    # Types, events, scoring
  scripts/   # LAN dev helper
```
