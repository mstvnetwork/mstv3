let player;
let playlist = [];
let currentIndex = 0;
let startTimeOffset = 0;

function getVideoId(url) {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  return match ? match[1] : null;
}

function formatTime(date) {
  return date.toTimeString().slice(0, 5);
}

function generateTVGuide() {
  const guide = document.getElementById("tvGuide");
  guide.innerHTML = "";
  let timeCursor = new Date();
  for (let item of playlist) {
    const start = new Date(timeCursor);
    const end = new Date(start.getTime() + item.duration * 60000);
    guide.innerHTML += `<span class="guide-item">${formatTime(start)} - ${item.title}</span>`;
    timeCursor = end;
  }
}

function updateNowPlaying() {
  const nowTitle = playlist[currentIndex]?.title || "Unknown";
  document.getElementById("nowPlaying").innerText = "Now Playing: " + nowTitle;
}

function syncPlayback() {
  const now = new Date();
  const secondsToday = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  let accumulated = 0;

  for (let i = 0; i < playlist.length; i++) {
    const duration = playlist[i].duration * 60;
    if (accumulated + duration > secondsToday % 86400) {
      currentIndex = i;
      startTimeOffset = (secondsToday % 86400) - accumulated;
      break;
    }
    accumulated += duration;
  }

  updateNowPlaying();
}

function startPlayer() {
  const videoId = getVideoId(playlist[currentIndex].url);
  if (!videoId) return alert("Invalid video URL");

  if (player) player.destroy();

  player = new YT.Player("ytPlayer", {
    videoId,
    playerVars: {
      autoplay: 1,
      start: startTimeOffset,
      controls: 0,
      modestbranding: 1,
      rel: 0,
      disablekb: 1,
      playsinline: 1
    },
    events: {
      onReady: (e) => {
        e.target.unMute();
        document.getElementById("overlay").style.display = "none";
      },
      onStateChange: (e) => {
        if (e.data === YT.PlayerState.ENDED) {
          currentIndex = (currentIndex + 1) % playlist.length;
          updateNowPlaying();
          startPlayer();
        }
      }
    }
  });
}

function loadPlaylist() {
  fetch("playlist.json")
    .then(res => res.json())
    .then(data => {
      playlist = data;
      generateTVGuide();
      syncPlayback();
    });
}

// Wait until API + page is ready
window.onYouTubeIframeAPIReady = () => {
  loadPlaylist();
  document.getElementById("overlay").addEventListener("click", () => {
    syncPlayback();
    startPlayer();
  });
};
