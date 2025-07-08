let playlist = [];
let currentVideo = null;
let player;
let currentVideoIndex = 0;
const STORAGE_KEY = "mstv_last_play_time";

async function loadPlaylist() {
  const res = await fetch("playlist.json");
  playlist = await res.json();
  selectCurrentVideo();
}

// Select video based on time
function selectCurrentVideo() {
  const now = new Date();
  const melbourneOffset = 10 * 60; // Melbourne UTC+10
  const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes() + melbourneOffset;

  const loopMinutes = currentMinutes % totalDuration(playlist);
  let elapsed = 0;

  for (let i = 0; i < playlist.length; i++) {
    const item = playlist[i];
    if (loopMinutes >= elapsed && loopMinutes < elapsed + item.duration) {
      currentVideo = item;
      currentVideoIndex = i;
      currentVideo.startOffset = loopMinutes - elapsed;
      break;
    }
    elapsed += item.duration;
  }

  updateNowPlaying();
  if (typeof YT !== "undefined" && YT.Player) {
    loadYouTubePlayer();
  }
}

function totalDuration(list) {
  return list.reduce((sum, item) => sum + item.duration, 0);
}

function updateNowPlaying() {
  const title = document.getElementById("nowPlaying");
  title.textContent = currentVideo ? `Now Playing: ${currentVideo.title}` : "Off Air";
}

function generateGuide() {
  const guide = document.getElementById("tvGuide");
  let clock = 0;
  let html = "";

  playlist.forEach(item => {
    const hrs = String(Math.floor(clock / 60)).padStart(2, "0");
    const mins = String(clock % 60).padStart(2, "0");
    html += `<span class="guide-item">${hrs}:${mins} - ${item.title}</span>`;
    clock += item.duration;
  });

  guide.innerHTML = html;
}

function loadYouTubePlayer() {
  if (!currentVideo) return;
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  const resumeTime = saved.video === currentVideo.url ? saved.time : currentVideo.startOffset * 60;

  if (player) {
    player.loadVideoById({
      videoId: extractVideoId(currentVideo.url),
      startSeconds: resumeTime || 0
    });
  } else {
    player = new YT.Player("ytPlayer", {
      videoId: extractVideoId(currentVideo.url),
      playerVars: {
        autoplay: 1,
        mute: 1,
        start: resumeTime || 0
      },
      events: {
        onReady: () => {},
        onStateChange: (event) => {
          if (event.data === YT.PlayerState.PLAYING) {
            startSavingProgress();
          }
        }
      }
    });
  }
}

// Save video + time every 5 sec
function startSavingProgress() {
  setInterval(() => {
    if (player && typeof player.getCurrentTime === "function") {
      const time = Math.floor(player.getCurrentTime());
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        video: currentVideo.url,
        time
      }));
    }
  }, 5000);
}

// Extract video ID from embed URL
function extractVideoId(url) {
  const parts = url.split("/embed/");
  return parts[1]?.split("?")[0];
}

// Called by YouTube API when ready
window.onYouTubeIframeAPIReady = function () {
  selectCurrentVideo();
};

loadPlaylist();
generateGuide();
setInterval(selectCurrentVideo, 60000); // Check every minute
