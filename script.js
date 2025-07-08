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

// Calculate total duration of playlist
function totalDuration(list) {
  return list.reduce((sum, item) => sum + item.duration, 0);
}

// Find which video should be playing now based on Melbourne time
function selectCurrentVideo() {
  const now = new Date();
  const melbourneOffset = 10 * 60; // UTC+10 in minutes
  const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes() + melbourneOffset;
  const timeInDay = currentMinutes % totalDuration(playlist);

  let elapsed = 0;

  for (let i = 0; i < playlist.length; i++) {
    const item = playlist[i];
    if (timeInDay >= elapsed && timeInDay < elapsed + item.duration) {
      currentVideo = item;
      currentVideoIndex = i;
      currentVideo.startOffset = (timeInDay - elapsed) * 60; // in seconds
      break;
    }
    elapsed += item.duration;
  }

  updateNowPlaying();
  if (typeof YT !== "undefined" && YT.Player) {
    loadYouTubePlayer();
  }
}

// Update the "Now Playing" text
function updateNowPlaying() {
  const title = document.getElementById("nowPlaying");
  title.textContent = currentVideo
    ? `Now Playing: ${currentVideo.title}`
    : "Off Air";
}

// Show scrolling TV guide
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

// Create/load/resume YouTube player
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
      height: "390",
      width: "640",
      videoId: videoId,
      playerVars: {
        autoplay: 1,
        mute: 1,
        start: savedTime || 0
      },
      events: {
        onReady: () => {},
        onStateChange: event => {
          if (event.data === YT.PlayerState.PLAYING) {
            savePlaybackTime();
          }
        }
      }
    });
  }
}

// Save progress every 5 seconds
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

// Extract YouTube video ID from embed URL
function extractVideoId(url) {
  const match = url.match(/\/embed\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : "";
}

// Triggered by YouTube API once it's loaded
window.onYouTubeIframeAPIReady = function () {
  if (playlist.length > 0) {
    selectCurrentVideo();
  } else {
    loadPlaylist();
  }
};

loadPlaylist();
setInterval(selectCurrentVideo, 60000); // refresh every 60s
