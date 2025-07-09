let player;
let playlist = [];
let currentIndex = 0;
let startTimeOffset = 0;

function loadPlaylist() {
  fetch('playlist.json')
    .then(res => res.json())
    .then(data => {
      playlist = data;
      generateTVGuide();
      syncPlayback();
    });
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

  const videoId = getVideoId(playlist[currentIndex].url);
  createPlayer(videoId, startTimeOffset);
  updateNowPlaying();
}

function createPlayer(videoId, startSeconds) {
  if (player) player.destroy();
  player = new YT.Player('ytPlayer', {
    videoId: videoId,
    playerVars: {
      autoplay: 1,
      controls: 0,
      disablekb: 1,
      modestbranding: 1,
      rel: 0,
      start: startSeconds
    },
    events: {
      onReady: (e) => {
        e.target.mute(); // autoplay policy workaround
        document.getElementById("click-blocker").onclick = () => {
          e.target.unMute();
          document.getElementById("click-blocker").style.display = "none";
        };
      },
      onStateChange: (e) => {
        if (e.data === YT.PlayerState.ENDED) {
          currentIndex = (currentIndex + 1) % playlist.length;
          createPlayer(getVideoId(playlist[currentIndex].url), 0);
          updateNowPlaying();
        }
      }
    }
  });
}

function getVideoId(url) {
  const match = url.match(/(?:embed\\/|watch\\?v=|youtu.be\\/)([\\w-]{11})/);
  return match ? match[1] : null;
}

function updateNowPlaying() {
  const nowTitle = playlist[currentIndex]?.title || "Unknown";
  document.getElementById("nowPlaying").innerText = "Now Playing: " + nowTitle;
}

function generateTVGuide() {
  const guide = document.getElementById("tvGuide");
  guide.innerHTML = "";
  let timeCursor = new Date();
  for (let i = 0; i < playlist.length; i++) {
    const entry = playlist[i];
    const start = new Date(timeCursor);
    const end = new Date(start.getTime() + entry.duration * 60000);
    guide.innerHTML += `<span class="guide-item">${formatTime(start)} - ${entry.title}</span>`;
    timeCursor = end;
  }
}

function formatTime(date) {
  return date.toTimeString().slice(0, 5);
}

window.onYouTubeIframeAPIReady = loadPlaylist;
