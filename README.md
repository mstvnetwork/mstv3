# 📺 LinearTV — Free 24/7 Synchronized TV Channel

A fully serverless, 100% free linear TV channel where every viewer around the world sees
**the exact same video at the exact same playback position**, regardless of when they join.
Seeking is strictly disabled and reverted server-side.

---

## ✅ Feature Summary

| Feature | Implementation |
|---|---|
| Same video + same position for all viewers | Cloudflare Worker computes position from wall-clock UTC time |
| Seek bar locked (any attempt reverted) | CSS disables UI + JS intercepts `seeking` event and reverts |
| MP4 playback | Video.js native |
| M3U8/HLS playback | videojs-contrib-hls plugin |
| 24/7 forever loop | Playlist cycles endlessly; math never expires |
| Free hosting | GitHub Pages (player) + Cloudflare Workers (sync API) |
| Global CDN | GitHub Pages → Fastly CDN; Workers → Cloudflare edge (300+ cities) |
| No free tier limit issues | Designed for < 100k Worker req/day |

---

## 🏗️ Architecture

```
Viewer's Browser
      │
      │  1. Load player page
      ▼
GitHub Pages (free, global Fastly CDN)
      │
      │  2. Every 10s: GET /sync
      ▼
Cloudflare Worker (free, 300+ edge cities)
      │
      │  Returns: { videoId, url, seekPosition, serverTimeMs }
      ▼
Player snaps to seekPosition, loads video URL if changed
      │
      │  3. Video bytes streamed directly
      ▼
MP4/M3U8 Source (Internet Archive, Cloudflare R2, etc.)
```

**Key insight:** The Worker never stores state. It computes the current
playback position purely from `Date.now()` divided by total playlist
duration. This means it scales to millions of viewers with zero extra cost
and never needs a database.

---

## 🚀 Deployment Guide

### Step 1 — Deploy the Cloudflare Worker

1. Create a free account at **cloudflare.com**
2. Go to **Workers & Pages → Create → Worker**
3. Name it `linear-tv-sync`
4. Paste the contents of `worker/index.js` into the editor
5. Click **Deploy**
6. Your Worker URL will be: `https://linear-tv-sync.YOUR-SUBDOMAIN.workers.dev`
7. Test it: visit `https://linear-tv-sync.YOUR-SUBDOMAIN.workers.dev/sync`

**Free tier:** 100,000 requests/day  
With 10 viewers syncing every 10 seconds = ~86,400 req/day (just under limit)  
With 20+ viewers: change `SYNC_INTERVAL_MS` to `30000` in `docs/index.html`

---

### Step 2 — Edit Your Playlist

Open `worker/index.js` and edit the `PLAYLIST` array:

```js
const PLAYLIST = [
  {
    id: "video-1",              // unique ID (any string)
    title: "My First Show",     // shown in the player UI
    url: "https://...",         // direct MP4 or M3U8 URL
    type: "mp4",                // "mp4" or "hls"
    duration: 3600,             // EXACT duration in seconds (critical!)
  },
  // Add more...
];
```

**Getting the exact duration of a video:**
```bash
ffprobe -v quiet -print_format json -show_format video.mp4 | grep duration
```

Redeploy the Worker after editing.

---

### Step 3 — Update the Player Config

Open `docs/index.html` and change `WORKER_URL`:

```js
const CONFIG = {
  WORKER_URL: "https://linear-tv-sync.YOUR-SUBDOMAIN.workers.dev",
  // ...
};
```

---

### Step 4 — Deploy Player to GitHub Pages

1. Push this project to a GitHub repository
2. Go to **Settings → Pages**
3. Set source to: **Deploy from branch → main → /docs folder**
4. Your channel is live at: `https://YOUR-USERNAME.github.io/YOUR-REPO/`

Or use a custom domain (also free with GitHub Pages).

---

## 🎬 Free Video Hosting Options

### 1. Internet Archive (archive.org) ★ RECOMMENDED
- **Truly unlimited** storage and bandwidth — they serve petabytes/day
- **Never hits limits** — they exist specifically to serve media freely
- **Global**: Served from their global infrastructure
- Upload at: https://archive.org/upload
- Get direct MP4 links like: `https://archive.org/download/ITEM_ID/filename.mp4`
- Works in all countries (except some with blanket archive.org blocks)

```js
{ url: "https://archive.org/download/BigBuckBunny/big_buck_bunny_480p_h264.mp4", type: "mp4", ... }
```

### 2. Cloudflare R2 + Workers (for custom content)
- 10 GB storage free, 1M Class A ops/month
- Pair with a Worker to serve with proper CORS headers
- True unlimited egress (no bandwidth costs ever)

### 3. GitHub LFS (for small video files)
- 1 GB free storage, 1 GB/month bandwidth
- Not suitable for long-form video

### 4. Your own HLS stream (M3U8)
- Any HLS CDN or self-hosted stream works
- Set `type: "hls"` in the playlist

---

## 📊 Free Tier Math (will never exceed limits)

### Cloudflare Workers
- **Limit:** 100,000 req/day
- **Per viewer at 10s sync:** 8,640 req/day
- **Max viewers at 10s interval:** 11 concurrent
- **Max viewers at 30s interval:** 34 concurrent
- **Max viewers at 60s interval:** 69 concurrent

**For larger audiences:** Use a caching proxy in front of the Worker
(Cloudflare KV caches the sync response for 1 second — this multiplies
capacity by the number of viewers per second, giving virtually unlimited scale).

### GitHub Pages
- **Limit:** 100 GB/month bandwidth, soft limit
- **Our usage:** Serving a ~100 KB HTML file = 1 million page loads/month
- No video bytes pass through GitHub Pages

### Internet Archive
- **Limit:** None (it's a public library — no rate limits for direct playback)

---

## 🔧 Advanced: KV Caching for Scale

To support 1000+ concurrent viewers without hitting Worker limits,
add Cloudflare KV caching to the Worker. The sync response only changes
once per second, so caching it for 1 second means 1000 viewers =
86,400 req/day instead of 86,400,000.

```js
// In worker/index.js, add to wrangler.toml:
// [[kv_namespaces]]
// binding = "CACHE"
// id = "YOUR_KV_ID"

// Then in the /sync handler:
const cached = await CACHE.get("sync");
if (cached) return new Response(cached, { headers: { ...CORS_HEADERS, "Cache-Control": "no-store" }});
const result = JSON.stringify(sync);
await CACHE.put("sync", result, { expirationTtl: 1 });
```

---

## 🛡️ Security Notes

- The Worker URL is public — this is intentional and fine
- No authentication needed (it's a public TV channel)
- The sync endpoint only returns read-only playback info
- Viewers cannot manipulate what plays or when

---

## 📁 Project Structure

```
linear-tv/
├── docs/
│   └── index.html          ← Player page (deploy to GitHub Pages)
├── worker/
│   ├── index.js            ← Cloudflare Worker (sync API + playlist)
│   └── wrangler.toml       ← Worker config
└── README.md
```
