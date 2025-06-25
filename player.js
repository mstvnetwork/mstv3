const CHANNELS_JSON = "https://raw.githubusercontent.com/yourusername/yourrepo/main/channels.json"; // Replace with your actual raw GitHub URL

const videoPlayer = document.getElementById("videoPlayer");
const nowPlaying = document.getElementById("nowPlaying");

fetch(CHANNELS_JSON)
  .then(res => res.json())
  .then(playlist => {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    
    const elapsedSeconds = Math.floor((now - startOfDay) / 1000);
    const slotDuration = 2 * 60; // 2 minutes per slot
    const currentIndex = Math.floor(elapsedSeconds / slotDuration) % playlist.length;
    const offsetInVideo = elapsedSeconds % slotDuration;

    const currentItem = playlist[currentIndex];
    nowPlaying.textContent = `Now Playing: ${currentItem.name}`;

    if (currentItem.type === "iframe") {
      const iframeUrl = currentItem.url.includes("?") 
        ? `${currentItem.url}&start=${offsetInVideo}` 
        : `${currentItem.url}?start=${offsetInVideo}`;
      videoPlayer.innerHTML = `<iframe width="100%" height="100%" src="${iframeUrl}" frameborder="0" allowfullscreen></iframe>`;
    } else if (currentItem.type === "hls") {
      const video = document.createElement("video");
      video.controls = true;
      video.autoplay = true;
      video.width = "100%";
      video.height = "100%";

      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(currentItem.url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.currentTime = offsetInVideo;
          video.play();
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = currentItem.url;
        video.currentTime = offsetInVideo;
        video.play();
      }

      videoPlayer.innerHTML = "";
      videoPlayer.appendChild(video);
    }
  })
  .catch(err => {
    nowPlaying.textContent = "Failed to load playlist.";
    console.error(err);
  });
