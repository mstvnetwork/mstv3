let playlist = [];
let currentVideo = null;
let currentVideoIndex = 0;
let player = null;
const STORAGE_KEY = "mstv_last_play_time";

// Load the playlist JSON
async function loadPlaylist() {
  try {
    const res = await fetch("playlist.json");
    playlist = await res.json();
    generateGuide();
    selectCurrentVideo();
  } catch (err) {
    console.error("Failed to load playlist.json", err);
  }
}

// Total duration in minutes
function totalDuration(list) {
  return list.reduce((sum, item) => sum + item.duration, 0);
}

function selectCurrentVideo() {
  const now = new Date();
  const melOffset = 10 * 60; // Melbourne UTC+10
  const minutesNow = now.getUTCHours() * 60 + now.getUTCMinutes() + melOffset;
  const timeInDay = minutesNow % totalDuration(playlist);

  let elapsed = 0;

  for (let i = 0; i < playlist.length; i++) {
    const item = playlist[i];
    if (timeInDay >= elapsed && timeInDay < elapsed + item.duration) {
      currentVideo = item;
      currentVideoIndex = i;
      currentVideo.startOffset = (timeInDay - elapsed) * 60;
      break;
    }
    elapsed += item.duration;
  }

  updateNowPlaying();
  if (typeof YT !== "undefined" && YT.Player) {
    loadYouTubePlayer();
  }
}

function updateNowPlaying() {
  const title = document.getElementById("nowPlaying");
  title.textContent = currentVideo
    ? `Now Playing: ${currentVideo.title}`
    : "Off Air";
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
  const savedTime =
    saved.video === currentVideo.url ? saved.time : currentVideo.startOffset;

  const videoId = extractVideoId(currentVideo.url);

  if (player) {
    player.loadVideoById({
      videoId: videoId,
      startSeconds: savedTime || 0
    });
  } else {
    player = new YT.Player("ytPlayer", {
      videoId: videoId,
      playerVars: {
        autoplay: 1,
        mute: 1,
        controls: 0,
        modestbranding: 1,
        disablekb: 1,
        fs: 0,
        rel: 0,
        iv_load_policy: 3,
        start: savedTime || 0
      },
      events: {
        onReady: () => {},
        onStateChange: (event) => {
          if (event.data === YT.PlayerState.PLAYING) {
            player.unMute();
            player.setVolume(100);
            savePlaybackTime();
            document.getElementById("unmuteOverlay").classList.add("hidden");
          }
        }
      }
    });
  }
}

// Save playback time
function savePlaybackTime() {
  setInterval(() => {
    if (player && typeof player.getCurrentTime === "function") {
      const time = Math.floor(player.getCurrentTime());
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          video: currentVideo.url,
          time
        })
      );
    }
  }, 5000);
}

function extractVideoId(url) {
  const match = url.match(/\/embed\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : "";
}

// Unmute overlay for mobile
document.getElementById("unmuteOverlay").addEventListener("click", () => {
  try {
    player.unMute();
    player.setVolume(100);
    document.getElementById("unmuteOverlay").classList.add("hidden");
  } catch (e) {}
});

// YouTube API ready
window.onYouTubeIframeAPIReady = function () {
  if (playlist.length > 0) {
    selectCurrentVideo();
  } else {
    loadPlaylist();
  }
};

loadPlaylist();
setInterval(selectCurrentVideo, 60000);
