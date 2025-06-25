let player;
function onYouTubeIframeAPIReady() {
  const overlay = document.getElementById("overlay");
  overlay.style.display = "flex";
  overlay.addEventListener("click", () => {
    overlay.style.display = "none";
    player = new YT.Player('video-player', {
      videoId: 'dQw4w9WgXcQ', // Rick Astley :)
      playerVars: {
        autoplay: 1,
        controls: 0,
        mute: 1,
        modestbranding: 1,
        fs: 0
      },
      events: {
        onReady: (e) => e.target.playVideo()
      }
    });
  });
}
