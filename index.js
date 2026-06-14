/**
 * LINEAR TV SYNC WORKER
 * Deploy to Cloudflare Workers (free tier: 100,000 req/day)
 * 
 * This worker is the single source of truth for:
 *  - Current server UTC time (ms)
 *  - Which video is playing
 *  - Exact seek position within that video
 * 
 * Clients CANNOT manipulate playback - everything is calculated
 * server-side from wall-clock time.
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

// ─── PLAYLIST ────────────────────────────────────────────────────────────────
// Edit this array to add/remove videos.
// Supported sources:
//   - Direct MP4 URL  (type: "mp4")
//   - HLS M3U8 URL    (type: "hls")
//   - Internet Archive item (type: "mp4", url: "https://archive.org/download/ITEM/file.mp4")
//
// duration: exact duration in SECONDS (be precise - this drives sync)
// title: shown in the player UI

const PLAYLIST = [
  {
    id: "video-1",
    title: "Big Buck Bunny",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    type: "mp4",
    duration: 596, // 9m 56s
  },
  {
    id: "video-2",
    title: "Elephant Dream",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    type: "mp4",
    duration: 653, // 10m 53s
  },
  {
    id: "video-3",
    title: "For Bigger Blazes",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    type: "mp4",
    duration: 15,
  },
  // Add more videos here. The channel loops forever.
  // For M3U8 streams:
  // {
  //   id: "live-stream-1",
  //   title: "My HLS Stream",
  //   url: "https://example.com/stream.m3u8",
  //   type: "hls",
  //   duration: 3600, // treat as 1 hour block then loop
  // },
];

// ─── EPOCH ───────────────────────────────────────────────────────────────────
// The channel "started" at this Unix timestamp in milliseconds.
// Setting it to 0 means the channel plays from the start of the playlist
// at exactly midnight UTC on Jan 1, 1970, then loops forever.
// You can set it to any past timestamp - the math will still work.
const CHANNEL_EPOCH_MS = 0;

// ─── CORE SYNC LOGIC ─────────────────────────────────────────────────────────
function computeSync(nowMs) {
  const totalDuration = PLAYLIST.reduce((sum, v) => sum + v.duration, 0);
  if (totalDuration === 0) return null;

  // How many seconds since channel epoch
  const elapsed = (nowMs - CHANNEL_EPOCH_MS) / 1000;

  // Position within the looping playlist (in seconds)
  const positionInLoop = ((elapsed % totalDuration) + totalDuration) % totalDuration;

  // Find which video is currently playing
  let accumulated = 0;
  let currentIndex = 0;
  let seekPosition = 0;

  for (let i = 0; i < PLAYLIST.length; i++) {
    if (positionInLoop < accumulated + PLAYLIST[i].duration) {
      currentIndex = i;
      seekPosition = positionInLoop - accumulated;
      break;
    }
    accumulated += PLAYLIST[i].duration;
  }

  const video = PLAYLIST[currentIndex];

  return {
    serverTimeMs: nowMs,
    currentIndex,
    videoId: video.id,
    title: video.title,
    url: video.url,
    type: video.type,
    duration: video.duration,
    seekPosition: Math.floor(seekPosition * 1000) / 1000, // ms precision
    remainingSeconds: video.duration - seekPosition,
    nextIndex: (currentIndex + 1) % PLAYLIST.length,
    nextVideo: PLAYLIST[(currentIndex + 1) % PLAYLIST.length],
    playlistLength: PLAYLIST.length,
    totalLoopDuration: totalDuration,
  };
}

// ─── REQUEST HANDLER ─────────────────────────────────────────────────────────
export default {
  async fetch(request) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // GET /sync  →  current playback state
    if (url.pathname === "/sync" || url.pathname === "/") {
      const nowMs = Date.now();
      const sync = computeSync(nowMs);

      if (!sync) {
        return new Response(
          JSON.stringify({ error: "Playlist is empty" }),
          { status: 500, headers: CORS_HEADERS }
        );
      }

      return new Response(JSON.stringify(sync), {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          // Cache for max 1 second - keeps free tier usage low
          "Cache-Control": "no-store",
        },
      });
    }

    // GET /playlist  →  full playlist metadata (no sync info)
    if (url.pathname === "/playlist") {
      return new Response(
        JSON.stringify({ playlist: PLAYLIST, count: PLAYLIST.length }),
        { status: 200, headers: CORS_HEADERS }
      );
    }

    // GET /health
    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({ ok: true, time: Date.now() }),
        { status: 200, headers: CORS_HEADERS }
      );
    }

    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: CORS_HEADERS }
    );
  },
};
