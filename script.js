let player;
let channels = [];

async function loadChannels() {
  const res = await fetch('channels.json');
  channels = await res.json();

  const now = new Date();
  const secondsToday = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const currentSlot = Math.floor(secondsToday / 50);

  const videoIndex = currentSlot % channels.length;
  const currentVideo = channels[videoIndex];
  const elapsedInSlot = secondsToday % 50;

  initPlayer(currentVideo.url, elapsedInSlot);
}

function initPlayer(videoUrl, startSeconds) {
  const overlay = document.getElementById("overlay");
  overlay.addEventListener("click", () => {
    overlay.style.display = "none";

    if (videoUrl.includes("youtube.com")) {
      const videoId = new URL(videoUrl).searchParams.get("v");

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
          onReady: (e) => e.target.playVideo()
        }
      });
    } else if (videoUrl.endsWith(".m3u8")) {
      loadHLS(videoUrl);
    }
  });
}

function loadHLS(streamUrl) {
  const container = document.getElementById("video-player");
  const video = document.createElement("video");
  video.src = streamUrl;
  video.controls = false;
  video.autoplay = true;
  video.muted = true;
  video.style.width = "100%";
  video.style.height = "100%";
  container.innerHTML = '';
  container.appendChild(video);
}

window.onYouTubeIframeAPIReady = loadChannels;
