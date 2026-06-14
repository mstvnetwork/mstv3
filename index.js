/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  LINEAR TV — SINGLE-FILE CLOUDFLARE WORKER                  ║
 * ║  Serves both the player HTML AND the sync API               ║
 * ║  Zero CORS issues • Zero configuration • Deploy and done    ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * ROUTES:
 *   GET /          → Full TV player HTML page
 *   GET /sync      → JSON: current video + seek position for all viewers
 *   GET /playlist  → JSON: full playlist metadata
 *   GET /health    → JSON: { ok: true }
 *
 * HOW TO DEPLOY:
 *   1. Go to dash.cloudflare.com → Workers & Pages → Create → Worker
 *   2. Paste this entire file
 *   3. Click Deploy
 *   4. Visit your-worker.your-subdomain.workers.dev — channel is LIVE!
 *
 * HOW TO EDIT PLAYLIST:
 *   Edit the PLAYLIST array below, then redeploy.
 */

// ═══════════════════════════════════════════════════════════════════════════
//  PLAYLIST  ←  EDIT THIS
// ═══════════════════════════════════════════════════════════════════════════
//
//  id:       Any unique string
//  title:    Shown in the player UI schedule sidebar
//  url:      Direct MP4 URL or M3U8/HLS URL
//  type:     "mp4" or "hls"
//  duration: EXACT duration in seconds (critical for sync accuracy!)
//
//  To get exact duration: ffprobe -v quiet -print_format json -show_format video.mp4
//  Or open in VLC → Tools → Media Information → Duration
//
//  FREE VIDEO HOSTING RECOMMENDATION:
//  Upload your MP4s to https://archive.org/upload (Internet Archive)
//  Get the direct link: https://archive.org/download/YOUR_ITEM/filename.mp4
//  It's truly unlimited, free forever, global CDN, no rate limits.

const PLAYLIST = [
  {
    id: "vid-bbb",
    title: "Big Buck Bunny",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    type: "mp4",
    duration: 596,
  },
  {
    id: "vid-ed",
    title: "Elephant Dream",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    type: "mp4",
    duration: 653,
  },
  {
    id: "vid-fbb",
    title: "For Bigger Blazes",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    type: "mp4",
    duration: 15,
  },
  {
    id: "vid-fbe",
    title: "For Bigger Escapes",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    type: "mp4",
    duration: 15,
  },
  // ── ADD YOUR VIDEOS BELOW ──────────────────────────────────────────────
  // {
  //   id: "my-show-ep1",
  //   title: "My Show — Episode 1",
  //   url: "https://archive.org/download/MY_ITEM/episode1.mp4",
  //   type: "mp4",
  //   duration: 1800,   // 30 minutes = 1800 seconds
  // },
  // {
  //   id: "hls-stream",
  //   title: "Live HLS Stream",
  //   url: "https://example.com/stream.m3u8",
  //   type: "hls",
  //   duration: 3600,
  // },
];

// ═══════════════════════════════════════════════════════════════════════════
//  CHANNEL EPOCH
//  The "start time" of the channel as a Unix timestamp in milliseconds.
//  0 = channel has been running since Jan 1, 1970 UTC (always in the past).
//  Change this if you want the playlist to start fresh from a specific date.
// ═══════════════════════════════════════════════════════════════════════════
const CHANNEL_EPOCH_MS = 0;

// ═══════════════════════════════════════════════════════════════════════════
//  SYNC LOGIC
// ═══════════════════════════════════════════════════════════════════════════
function computeSync(nowMs) {
  const totalDuration = PLAYLIST.reduce((s, v) => s + v.duration, 0);
  if (!totalDuration) return null;

  const elapsed = (nowMs - CHANNEL_EPOCH_MS) / 1000;
  const posInLoop = ((elapsed % totalDuration) + totalDuration) % totalDuration;

  let acc = 0;
  let idx = 0;
  let seekPos = 0;

  for (let i = 0; i < PLAYLIST.length; i++) {
    if (posInLoop < acc + PLAYLIST[i].duration) {
      idx = i;
      seekPos = posInLoop - acc;
      break;
    }
    acc += PLAYLIST[i].duration;
  }

  const vid = PLAYLIST[idx];
  return {
    serverTimeMs: nowMs,
    currentIndex: idx,
    videoId: vid.id,
    title: vid.title,
    url: vid.url,
    type: vid.type,
    duration: vid.duration,
    seekPosition: Math.round(seekPos * 1000) / 1000,
    remainingSeconds: Math.round((vid.duration - seekPos) * 10) / 10,
    nextIndex: (idx + 1) % PLAYLIST.length,
    nextVideo: PLAYLIST[(idx + 1) % PLAYLIST.length],
    playlistLength: PLAYLIST.length,
    totalLoopDuration: totalDuration,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  PLAYER HTML  (self-contained, references same origin for /sync)
// ═══════════════════════════════════════════════════════════════════════════
const PLAYER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>LinearTV — Live Channel</title>
<link href="https://cdnjs.cloudflare.com/ajax/libs/video.js/8.10.0/video-js.min.css" rel="stylesheet"/>
<script src="https://cdnjs.cloudflare.com/ajax/libs/video.js/8.10.0/video.min.js"><\/script>
<style>
:root{
  --bg:#0a0a0f;--surface:#13131a;--surface2:#1c1c28;--border:#2a2a3d;
  --accent:#e8384f;--text:#f0f0f5;--text-sub:#7a7a96;--text-dim:#44445a;
  --green:#22c55e;--mono:'JetBrains Mono','Fira Mono','Courier New',monospace;
  --sans:'Inter','Segoe UI',system-ui,sans-serif;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text);font-family:var(--sans);min-height:100vh;display:flex;flex-direction:column;overflow-x:hidden}

/* HEADER */
header{background:var(--surface);border-bottom:1px solid var(--border);padding:0 24px;height:56px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100}
.logo{display:flex;align-items:center;gap:10px;font-weight:700;font-size:16px;letter-spacing:.08em;text-transform:uppercase}
.logo-icon{width:28px;height:28px;background:var(--accent);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:13px}
.live-badge{display:flex;align-items:center;gap:6px;background:rgba(232,56,79,.15);border:1px solid rgba(232,56,79,.4);border-radius:20px;padding:4px 12px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--accent)}
.live-dot{width:7px;height:7px;background:var(--accent);border-radius:50%;animation:pulse 1.4s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.7)}}
.utc-clock{font-family:var(--mono);font-size:12px;color:var(--text-sub);letter-spacing:.05em}
.header-right{display:flex;align-items:center;gap:16px}

/* LAYOUT */
main{display:grid;grid-template-columns:1fr 320px;flex:1;min-height:0}
@media(max-width:860px){main{grid-template-columns:1fr}.sidebar{display:none}}

/* PLAYER */
.player-section{background:#000;display:flex;flex-direction:column;border-right:1px solid var(--border)}
.video-wrapper{position:relative;width:100%;aspect-ratio:16/9;background:#000;overflow:hidden}
.video-js{width:100%!important;height:100%!important;position:absolute!important;top:0;left:0}

/* SEEK LOCK — CSS layer */
.video-js .vjs-progress-control{pointer-events:none!important;cursor:default!important}
.video-js .vjs-progress-holder{cursor:default!important}
.video-js .vjs-play-progress::before{display:none!important}
.video-js .vjs-skip-forward-button,.video-js .vjs-skip-backward-button{display:none!important}
.video-js .vjs-play-progress{background:var(--accent)!important}
.video-js .vjs-load-progress{background:rgba(232,56,79,.2)!important}
.video-js .vjs-slider{background:rgba(255,255,255,.1)!important}
.video-js .vjs-big-play-button{background:rgba(232,56,79,.85)!important;border:none!important;border-radius:50%!important;width:68px!important;height:68px!important;line-height:68px!important;left:50%!important;top:50%!important;transform:translate(-50%,-50%)!important;margin:0!important}
.video-js .vjs-control-bar{background:linear-gradient(transparent,rgba(0,0,0,.85))!important;height:44px!important}

/* NOW PLAYING */
.now-playing{padding:14px 18px;background:var(--surface);border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:12px}
.now-playing-left{display:flex;align-items:center;gap:10px;min-width:0}
.channel-chip{background:var(--accent);color:#fff;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:3px 8px;border-radius:3px;white-space:nowrap;flex-shrink:0}
.now-playing-title{font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.now-playing-sub{font-size:11px;color:var(--text-sub);margin-top:2px}
.sync-indicator{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--green);font-family:var(--mono);white-space:nowrap;flex-shrink:0}
.sync-dot{width:6px;height:6px;border-radius:50%;background:var(--green)}
.sync-dot.syncing{background:#f59e0b!important;animation:pulse .8s infinite}
.sync-dot.error{background:var(--accent)!important}
.channel-progress{height:3px;background:var(--border)}
.channel-progress-fill{height:100%;background:var(--accent);transition:width 1s linear}

/* SIDEBAR */
.sidebar{background:var(--surface);display:flex;flex-direction:column;overflow:hidden}
.sidebar-header{padding:14px 18px 10px;border-bottom:1px solid var(--border)}
.sidebar-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:var(--text-sub)}
.playlist-scroll{overflow-y:auto;flex:1}
.playlist-scroll::-webkit-scrollbar{width:4px}
.playlist-scroll::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
.playlist-item{padding:13px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;user-select:none;cursor:default}
.playlist-item.active{background:rgba(232,56,79,.08);border-left:3px solid var(--accent);padding-left:15px}
.playlist-item:not(.active){opacity:.5}
.item-index{font-family:var(--mono);font-size:11px;color:var(--text-dim);width:22px;text-align:right;flex-shrink:0}
.item-active-icon{width:8px;height:8px;background:var(--accent);border-radius:50%;flex-shrink:0;animation:pulse 1.4s infinite}
.item-type{font-size:9px;font-weight:700;text-transform:uppercase;padding:2px 5px;border-radius:2px;flex-shrink:0}
.item-type.hls{background:rgba(99,102,241,.2);color:#818cf8}
.item-type.mp4{background:rgba(34,197,94,.15);color:#4ade80}
.item-info{min-width:0;flex:1}
.item-title{font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.item-dur{font-size:11px;font-family:var(--mono);color:var(--text-sub);margin-top:2px}

/* STATUS */
.status-panel{padding:12px 18px;border-top:1px solid var(--border);background:var(--surface2);font-family:var(--mono);font-size:11px;color:var(--text-sub);display:flex;flex-direction:column;gap:5px}
.status-row{display:flex;justify-content:space-between}
.status-val{color:var(--text)}

/* LOADING */
#loading-overlay{position:absolute;inset:0;background:#000;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:18px;z-index:50;transition:opacity .4s}
#loading-overlay.hidden{opacity:0;pointer-events:none}
.spinner{width:40px;height:40px;border:3px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin .9s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.loading-text{font-size:13px;color:var(--text-sub)}

/* SEEK TOAST */
#seek-toast{position:fixed;bottom:80px;left:50%;transform:translateX(-50%) translateY(20px);background:rgba(232,56,79,.95);color:#fff;padding:10px 20px;border-radius:6px;font-size:13px;font-weight:600;opacity:0;transition:opacity .2s,transform .2s;pointer-events:none;z-index:200;white-space:nowrap}
#seek-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}

/* UNMUTE BANNER */
#unmute-banner{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,.8);border:1px solid var(--border);border-radius:8px;padding:14px 22px;text-align:center;font-size:14px;cursor:pointer;z-index:40;display:none;flex-direction:column;gap:6px;align-items:center}
#unmute-banner.show{display:flex}
#unmute-banner span{font-size:24px}

footer{text-align:center;padding:10px;font-size:11px;color:var(--text-dim);border-top:1px solid var(--border);background:var(--surface)}
</style>
</head>
<body>

<header>
  <div class="logo">
    <div class="logo-icon">📺</div>
    <span>LinearTV</span>
  </div>
  <div class="header-right">
    <div class="utc-clock" id="utc-clock">--:--:-- UTC</div>
    <div class="live-badge"><div class="live-dot"></div>Live</div>
  </div>
</header>

<main>
  <div class="player-section">
    <div class="video-wrapper">
      <div id="loading-overlay">
        <div class="spinner"></div>
        <div class="loading-text" id="loading-text">Syncing to channel…</div>
      </div>
      <div id="unmute-banner">
        <span>🔇</span>
        Click to unmute
      </div>
      <video id="tv-player" class="video-js vjs-default-skin" playsinline></video>
    </div>
    <div class="channel-progress"><div class="channel-progress-fill" id="ch-progress"></div></div>
    <div class="now-playing">
      <div class="now-playing-left">
        <div class="channel-chip">On Air</div>
        <div>
          <div class="now-playing-title" id="np-title">Connecting…</div>
          <div class="now-playing-sub" id="np-sub"></div>
        </div>
      </div>
      <div class="sync-indicator">
        <div class="sync-dot syncing" id="sync-dot"></div>
        <span id="sync-label">Syncing</span>
      </div>
    </div>
  </div>

  <aside class="sidebar">
    <div class="sidebar-header"><div class="sidebar-title">Schedule</div></div>
    <div class="playlist-scroll"><div id="playlist-container"></div></div>
    <div class="status-panel">
      <div class="status-row"><span>Server time</span><span class="status-val" id="st-time">—</span></div>
      <div class="status-row"><span>Drift</span><span class="status-val" id="st-drift">—</span></div>
      <div class="status-row"><span>Next in</span><span class="status-val" id="st-next">—</span></div>
      <div class="status-row"><span>Seek blocks</span><span class="status-val" id="st-seeks">0</span></div>
      <div class="status-row"><span>RTT</span><span class="status-val" id="st-rtt">—</span></div>
    </div>
  </aside>
</main>

<div id="seek-toast">⛔ Live channel — seeking disabled</div>
<footer>LinearTV · Synchronized worldwide · All viewers watch the same moment</footer>

<script>
// ── CONFIG ────────────────────────────────────────────────────────────────
// WORKER_URL is automatically set to the same origin as this page.
// If you host the HTML separately, replace with your Worker URL.
const WORKER_URL = window.location.origin;
const SYNC_MS        = 10000;   // re-sync interval (ms). Raise to 30000 for 30+ viewers
const MAX_DRIFT_S    = 2.0;     // max seconds of drift before forcing correction
const NET_COMP_MS    = 400;     // subtract this from seek to compensate for load time

// ── STATE ─────────────────────────────────────────────────────────────────
const S = {
  player:null, curId:null, syncData:null, lastSyncMs:0,
  seeks:0, playlist:[], allowSeek:false, _toast:null
};

// ── UTILS ─────────────────────────────────────────────────────────────────
const fmtDur = s => {
  if(!isFinite(s)||s<0) return '—';
  const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=Math.floor(s%60);
  if(h>0) return h+'h '+m+'m';
  if(m>0) return m+'m '+sec+'s';
  return sec+'s';
};

const setSyncStatus = st => {
  const dot=document.getElementById('sync-dot'), lbl=document.getElementById('sync-label');
  dot.className='sync-dot';
  if(st==='synced'){dot.style.background='var(--green)';lbl.textContent='Synced'}
  else if(st==='syncing'){dot.classList.add('syncing');dot.style.background='';lbl.textContent='Syncing…'}
  else{dot.classList.add('error');dot.style.background='';lbl.textContent='Error'}
};

const showToast = () => {
  S.seeks++;
  document.getElementById('st-seeks').textContent=S.seeks;
  const t=document.getElementById('seek-toast');
  t.classList.add('show');
  clearTimeout(S._toast);
  S._toast=setTimeout(()=>t.classList.remove('show'),2500);
};

// ── CLOCK ─────────────────────────────────────────────────────────────────
setInterval(()=>{
  const n=new Date();
  document.getElementById('utc-clock').textContent=
    String(n.getUTCHours()).padStart(2,'0')+':'+
    String(n.getUTCMinutes()).padStart(2,'0')+':'+
    String(n.getUTCSeconds()).padStart(2,'0')+' UTC';
},1000);

// ── PLAYLIST SIDEBAR ──────────────────────────────────────────────────────
const renderPlaylist=(list,activeIdx)=>{
  const c=document.getElementById('playlist-container');
  c.innerHTML='';
  list.forEach((item,i)=>{
    const active=i===activeIdx;
    const el=document.createElement('div');
    el.className='playlist-item'+(active?' active':'');
    el.innerHTML=(active
      ? '<div class="item-active-icon"></div>'
      : '<div class="item-index">'+(i+1)+'</div>'
    )+'<div class="item-info"><div class="item-title">'+item.title+'</div>'+
      '<div class="item-dur">'+fmtDur(item.duration)+'</div></div>'+
      '<div class="item-type '+item.type+'">'+item.type.toUpperCase()+'</div>';
    c.appendChild(el);
  });
};

// ── PLAYER INIT ───────────────────────────────────────────────────────────
const initPlayer = () => new Promise(resolve => {
  const p = videojs('tv-player',{
    controls:true, autoplay:true, muted:true, preload:'auto',
    fill:true, playbackRates:[],
    controlBar:{
      children:['playToggle','volumePanel','currentTimeDisplay',
                 'timeDivider','durationDisplay','progressControl','fullscreenToggle'],
      volumePanel:{inline:true}
    },
    userActions:{hotkeys:false}
  });

  // ── SEEK LOCK — JS layer ──────────────────────────────────────────────
  p.on('seeking',()=>{
    if(!S.allowSeek){
      const correct = computeSeekPos();
      S.allowSeek=true;
      p.currentTime(correct);
      S.allowSeek=false;
      showToast();
    }
  });

  // Block keyboard arrow keys
  p.el().addEventListener('keydown', e=>{
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
      e.preventDefault(); e.stopPropagation(); showToast();
    }
  },true);

  // Unmute on click
  const banner = document.getElementById('unmute-banner');
  p.on('play',()=>{
    if(p.muted()) banner.classList.add('show');
  });
  banner.addEventListener('click',()=>{
    p.muted(false); p.volume(0.8); banner.classList.remove('show');
  });
  p.on('volumechange',()=>{
    if(!p.muted()) banner.classList.remove('show');
  });

  p.ready(()=>resolve(p));
});

// ── CURRENT SEEK POSITION (interpolated between syncs) ───────────────────
const computeSeekPos = () => {
  if(!S.syncData) return 0;
  const elapsed = (Date.now() - S.lastSyncMs) / 1000;
  return S.syncData.seekPosition + elapsed;
};

// ── LOAD VIDEO ────────────────────────────────────────────────────────────
const loadVideo = sync => {
  const seekPos = Math.max(0, sync.seekPosition - NET_COMP_MS/1000);
  console.log('[TV] Loading:', sync.title, 'at', seekPos.toFixed(1)+'s');

  S.curId = sync.videoId;
  const src = sync.type === 'hls'
    ? {src:sync.url, type:'application/x-mpegURL'}
    : {src:sync.url, type:'video/mp4'};

  S.allowSeek=true;
  S.player.src(src);
  S.player.ready(()=>{
    S.player.currentTime(seekPos);
    S.allowSeek=false;
    S.player.play().catch(()=>{
      // Autoplay blocked — show unmute banner instead
      document.getElementById('unmute-banner').classList.add('show');
    });
  });

  // Hide loading once playing
  S.player.one('playing',()=>{
    document.getElementById('loading-overlay').classList.add('hidden');
  });

  document.getElementById('np-title').textContent = sync.title;
  document.getElementById('np-sub').textContent =
    sync.type.toUpperCase()+' · '+fmtDur(sync.duration);
};

// ── SYNC TICK ─────────────────────────────────────────────────────────────
const syncTick = async () => {
  setSyncStatus('syncing');
  try {
    const t0 = Date.now();
    const res = await fetch(WORKER_URL+'/sync?_='+t0);
    if(!res.ok) throw new Error('HTTP '+res.status);
    const data = await res.json();
    const rtt  = Date.now() - t0;

    // Compensate for network RTT
    data.seekPosition += (rtt / 2 / 1000);
    S.syncData   = data;
    S.lastSyncMs = Date.now();

    // Fetch playlist once
    if(!S.playlist.length){
      try{
        const pr = await fetch(WORKER_URL+'/playlist');
        const pd = await pr.json();
        S.playlist = pd.playlist||[];
      }catch{}
    }
    const displayList = S.playlist.length ? S.playlist
      : [{title:data.title,url:data.url,type:data.type,duration:data.duration}];
    renderPlaylist(displayList, data.currentIndex);

    // Load new video or correct drift
    if(S.curId !== data.videoId){
      loadVideo(data);
    } else {
      const playerPos = S.player.currentTime();
      const drift     = Math.abs(playerPos - data.seekPosition);
      document.getElementById('st-drift').textContent =
        drift < 0.1 ? '<0.1s' : drift.toFixed(2)+'s';
      if(drift > MAX_DRIFT_S){
        console.log('[TV] Correcting drift:', drift.toFixed(2)+'s');
        S.allowSeek=true;
        S.player.currentTime(data.seekPosition);
        S.allowSeek=false;
      }
      document.getElementById('loading-overlay').classList.add('hidden');
    }

    // Update status
    const d=new Date(data.serverTimeMs);
    document.getElementById('st-time').textContent=
      String(d.getUTCHours()).padStart(2,'0')+':'+
      String(d.getUTCMinutes()).padStart(2,'0')+' UTC';
    document.getElementById('st-next').textContent=fmtDur(data.remainingSeconds);
    document.getElementById('st-rtt').textContent=rtt+'ms';

    setSyncStatus('synced');
  }catch(err){
    console.error('[TV] Sync error:', err);
    setSyncStatus('error');
    document.getElementById('loading-text').textContent='Sync error — retrying…';
  }
};

// ── PROGRESS INTERPOLATION ────────────────────────────────────────────────
setInterval(()=>{
  if(!S.syncData) return;
  const pos = computeSeekPos();
  const pct = Math.min((pos/S.syncData.duration)*100, 100);
  document.getElementById('ch-progress').style.width=pct+'%';
  const rem = S.syncData.duration - pos;
  if(rem>0) document.getElementById('st-next').textContent=fmtDur(rem);
},1000);

// ── BOOT ──────────────────────────────────────────────────────────────────
(async()=>{
  S.player = await initPlayer();
  S.player.on('ended', syncTick);
  await syncTick();
  setInterval(syncTick, SYNC_MS);
})();
<\/script>
</body>
</html>`;

// ═══════════════════════════════════════════════════════════════════════════
//  REQUEST ROUTER
// ═══════════════════════════════════════════════════════════════════════════
const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Cache-Control": "no-store",
};

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: JSON_HEADERS });
    }

    // ── GET / → serve the player HTML ──────────────────────────────────
    if (url.pathname === "/" || url.pathname === "") {
      return new Response(PLAYER_HTML, {
        headers: {
          "Content-Type": "text/html;charset=UTF-8",
          "Cache-Control": "no-cache",
        },
      });
    }

    // ── GET /sync → current playback state ─────────────────────────────
    if (url.pathname === "/sync") {
      const sync = computeSync(Date.now());
      if (!sync) return new Response(JSON.stringify({ error: "Empty playlist" }), { status: 500, headers: JSON_HEADERS });
      return new Response(JSON.stringify(sync), { status: 200, headers: JSON_HEADERS });
    }

    // ── GET /playlist → full playlist ──────────────────────────────────
    if (url.pathname === "/playlist") {
      return new Response(JSON.stringify({ playlist: PLAYLIST, count: PLAYLIST.length }), { status: 200, headers: JSON_HEADERS });
    }

    // ── GET /health ─────────────────────────────────────────────────────
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ ok: true, time: Date.now() }), { status: 200, headers: JSON_HEADERS });
    }

    return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: JSON_HEADERS });
  },
};
