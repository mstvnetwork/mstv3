const { DateTime } = luxon;
const timezone = 'Asia/Kolkata';
const container = document.getElementById('video-container');
const status = document.getElementById('now-playing');

async function loadPlaylist() {
  try {
    const res = await fetch('playlist.json');
    const schedule = await res.json();
    const now = DateTime.now().setZone(timezone);

    console.log("Current IST Time:", now.toFormat("yyyy-MM-dd HH:mm:ss"));

    const current = schedule.find(item => {
      const start = DateTime.fromISO(item.start).setZone(timezone);
      const end = DateTime.fromISO(item.end).setZone(timezone);

      console.log(`Checking: ${item.title} | ${start.toFormat("HH:mm")} - ${end.toFormat("HH:mm")}`);
      return now >= start && now <= end;
    });

    if (!current) {
      container.innerHTML = `<p>No program currently scheduled<br>Time now: ${now.toFormat("HH:mm:ss")} IST</p>`;
      status.textContent = "";
      return;
    }

    status.textContent = `Now Playing: ${current.title}`;
    playStream(current);

  } catch (err) {
    console.error("Error loading playlist:", err);
    container.innerHTML = "<p>Error loading playlist. Check console for details.</p>";
  }
}

function playStream(item) {
  const isYouTube = item.url.includes("youtube.com") || item.url.includes("youtu.be");
  container.innerHTML = '';

  if (isYouTube) {
    container.innerHTML = `
      <iframe width="100%" height="360" 
        src="${item.url.replace("watch?v=", "embed/")}?autoplay=1" 
        frameborder="0" allow="autoplay; encrypted-media" allowfullscreen>
      </iframe>`;
  } else {
    const video = document.createElement('video');
    video.controls = true;
    video.autoplay = true;
    video.width = 640;
    video.height = 360;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(item.url);
      hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = item.url;
    }

    container.appendChild(video);
  }
}

loadPlaylist();
setInterval(loadPlaylist, 60000);
