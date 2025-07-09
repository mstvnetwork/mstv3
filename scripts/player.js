let player;
let playlist = [];
let currentIndex = 0;
let videoStartOffset = 0;

// Load playlist
async function loadSchedule() {
  const response = await fetch("schedule.json");
  playlist = await response.json();
  syncToCurrentTime();
}

// Sync based on current timestamp
function syncToCurrentTime() {
  const now = Math.floor(Date.now() / 1000); // seconds
  const totalDuration = playlist.reduce((sum, item) => sum + item.duration, 0);
  const loopTime = now % totalDuration;

  let elapsed = 0;
  for (let i = 0; i < playlist.length; i++) {
    if (elapsed + playlist[i].duration > loopTime) {
      currentIndex = i;
      videoStartOffset = loopTime - elapsed;
      break;
    }
    elapsed += playlist[i].duration;
  }
}

// YouTube API callback
function onYouTubeIframeAPIReady() {
  loadSchedule().then(() => {
    const current = playlist[currentIndex];
    player = new YT.Player("player", {
      videoId: current.videoId,
      playerVars: {
        autoplay: 1,
        controls: 0,
        start: videoStartOffset,
        modestbranding: 1,
        rel: 0,
        disablekb: 1,
        fs: 0
      },
      events: {
        onReady: (event) => {
          event.target.mute();
          document.getElementById("muteOverlay").style.display = "block";
          document.getElementById("now-playing").textContent = `Now Playing: ${current.title}`;
          renderTVGuide();
        },
        onStateChange: (event) => {
          if (event.data === YT.PlayerState.ENDED) {
            location.reload(); // Load next video based on time
          }
        }
      }
    });
  });
}

// Unmute when tapped
function unmuteVideo() {
  if (player) {
    player.unMute();
    document.getElementById("muteOverlay").style.display = "none";
  }
}

// Build TV guide
function renderTVGuide() {
  const guide = document.getElementById("tv-guide");
  guide.innerHTML = playlist.map(item => `<span style="margin-right:15px;">${item.title}</span>`).join("");
}
