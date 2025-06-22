window.onload = function () {
  const now = Date.now();
  const currentProgram = schedule.find(program => {
    const start = new Date(program.start).getTime();
    const end = start + program.duration * 1000;
    return now >= start && now < end;
  });

  if (!currentProgram) {
    document.getElementById("now-playing").textContent = "Now Playing: Off Air";
    return;
  }

  const offset = Math.floor((now - new Date(currentProgram.start).getTime()) / 1000);
  document.getElementById("now-playing").textContent = "Now Playing: " + currentProgram.title;

  if (currentProgram.type === "m3u8") {
    const video = document.getElementById("hls-player");
    video.style.display = "block";
    document.getElementById("youtube-player").style.display = "none";

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(currentProgram.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, function () {
        video.currentTime = offset;
        video.play();
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = currentProgram.url;
      video.currentTime = offset;
      video.play();
    }
  } else if (currentProgram.type === "youtube" || currentProgram.type === "youtubeLive") {
    loadYouTubePlayer(currentProgram.videoId, currentProgram.type === "youtubeLive", offset);
  }
};
