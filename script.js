let player;
let channels = [];

async function loadChannels() {
  try {
    const res = await fetch('https://raw.githubusercontent.com/mstvnetwork/mstv3/main/channels.json');
    if (!res.ok) {
      console.error('Failed to load channels.json from GitHub:', res.status);
      return;
    }
    channels = await res.json();

    const now = new Date();
    const secondsToday = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const currentSlot = Math.floor(secondsToday / 50);

    const videoIndex = currentSlot % channels.length;
    const currentVideo = channels[videoIndex];
    const elapsedInSlot = secondsToday % 50;

    initPlayer(currentVideo.url, elapsedInSlot);
  } catch (err) {
    console.error('Error loading channels:', err);
  }
}

function initPlayer(videoUrl, startSeconds) {
  const overlay = document.getElementById("overlay");

  // Remove any existing click handlers to avoid duplicates
  overlay.replaceWith(overlay.cloneNode(true));
  const newOverlay = document.getElementById("overlay");

  newOverlay.style.display = "flex";

  newOverlay.addEventListener("click", () => {
    console.log("Overlay clicked! Starting video:", videoUrl, "from", startSeconds);
    newOverlay.style.display = "none";

    if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
      let videoId = null;
      try {
        if(videoUrl.includes("v=")) {
          videoId = new URL(videoUrl).searchParams.get("v");
        } else {
          const parts = videoUrl.split("/");
          videoId = parts[parts.length - 1];
        }
      } catch {
        console.error("Invalid YouTube URL:", videoUrl);
        return;
      }
      if(!videoId) {
        console.error("YouTube videoId extraction failed:", videoUrl);
        return;
      }

      player = new YT.Player('video-player', {
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          start: startSeconds,
          fs: 0
        },
        events: {
          onReady: (e) => e.target.playVideo(),
          onStateChange: (e) => {
            // When video ends, reload channels to switch to next video
            if (e.data === YT.PlayerState.ENDED) {
              loadChannels();
            }
          }
        }
      });
    } else if (videoUrl.endsWith(".m3u8")) {
      loadHLS(videoUrl);
    } else {
      console.error("Unsupported video URL format:", videoUrl);
    }
  });
}

function loadHLS(streamUrl) {
  const container = document.getElementById("video-player");
  const video = document.createElement("video");
  video.src = streamUrl;
  video.controls = false;
  video.autoplay = true;
  video.muted = true; // Mute to allow autoplay in browsers
  video.style.width = "100%";
  video.style.height = "100%";
  container.innerHTML = '';
  container.appendChild(video);

  video.play().catch(e => console.error("HLS video play error:", e));

  // Restart next video after 50 seconds
  setTimeout(() => {
    loadChannels();
  }, 50000);
}

// Called by YouTube Iframe API when ready
window.onYouTubeIframeAPIReady = loadChannels;
