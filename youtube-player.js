let player;

function loadYouTubePlayer(videoId, isLive, offset = 0) {
  document.getElementById("youtube-player").style.display = "block";
  document.getElementById("hls-player").style.display = "none";

  if (typeof YT === "undefined") {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);

    window.onYouTubeIframeAPIReady = function () {
      createPlayer(videoId, isLive, offset);
    };
  } else {
    createPlayer(videoId, isLive, offset);
  }
}

function createPlayer(videoId, isLive, offset) {
  player = new YT.Player("youtube-player", {
    height: "360",
    width: "640",
    videoId,
    playerVars: {
      autoplay: 1,
      controls: 1,
      mute: 0,         // <– try mute:1 if autoplay fails
      start: isLive ? undefined : offset,
    },
    events: {
      onReady: function (event) {
        event.target.playVideo();
      }
    }
  });
}
