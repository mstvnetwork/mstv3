let playlist = [];
let currentVideo = null;
let currentVideoIndex = 0;
let player = null;
const STORAGE_KEY = "mstv_last_play_time";

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

function totalDuration(list) {
  return list.reduce((sum, item) => sum + item.duration, 0);
}

function selectCurrentVideo() {
  const now = new Date();
  const melOffset = 10 * 60;
  let minutesNow = now.getUTCHours() * 60 + now.getUTCMinutes() + melOffset;
  minutesNow = minutesNow % totalDuration(playlist);

  let elapsed = 0;

  for (let i = 0; i < playlist.length; i++) {
    const item = playlist[i];
    if (minutesNow >= elapsed && minutesNow < elapsed + item.duration) {
      currentVideo = item;
      currentVideoIndex = i;
      currentVideo.startOffset = (minutesNow - elapsed) * 60;
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
        autoplay: 0,
        mute: 1,
        controls: 0,
        modestbranding: 1,
        disablekb: 1,
        fs: 0,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        origin: window.location.origin,
        start: savedTime || 0
      },
      events: {
        onReady: () => {},
        onStateChange: (event) => {
          if (event.data === YT.PlayerState.PLAYING) {
            savePlaybackTime(); // Only save; don't hide overlay
          }
          if (event.data === YT.PlayerState.ENDED) {
            currentVideoIndex = (currentVideoIndex + 1) % playlist.length;
            currentVideo = playlist[currentVideoIndex];
            updateNowPlaying();
            player.loadVideoById(currentVideo.url.split("embed/")[1], 0);
            document.getElementById("click-blocker").style.display = "block";
          }
        }
      }
    });
  }
}

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
  const match = url.match(/embed\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : "";
}

document.getElementById("click-blocker").addEventListener("click", () => {
  try {
    player.unMute();
    player.setVolume(100);
    player.playVideo();
    document.getElementById("click-blocker").style.display = "none";
  } catch (e) {
    console.warn("Unmute failed", e);
  }
});

window.onYouTubeIframeAPIReady = function () {
  if (playlist.length > 0) {
    selectCurrentVideo();
  } else {
    loadPlaylist();
  }
};

loadPlaylist();
setInterval(selectCurrentVideo, 60000);
