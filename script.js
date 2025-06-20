const { DateTime } = luxon;
const timezone = 'Asia/Kolkata'; // Fixed timezone
const container = document.getElementById('video-container');
const status = document.getElementById('now-playing');

async function loadPlaylist() {
  const res = await fetch('playlist.json');
  const schedule = await res.json();
  const now = DateTime.now().setZone(timezone);

  const current = schedule.find(item => {
    const start = DateTime.fromISO(item.start).setZone(timezone);
    const end = DateTime.fromISO(item.end).setZone(timezone);
    return now >= start && now <= end;
  });

  if (!current) {
    container.innerHTML = `<p>No program currently scheduled</p>`;
    status.textContent = "";
    return;
  }

  status.textContent = `Now Playing: ${current.title}`;
  playStream(current);
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
    } else {
      video.src = item.url;
    }

    container.appendChild(video);
  }
}

loadPlaylist();
setInterval(loadPlaylist, 60000); // Check every 1 min
