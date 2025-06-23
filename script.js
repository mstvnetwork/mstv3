// script.js (local time fallback)

const playlist = [
  { title: "Morning Chill Out", start: "10:55", duration: 120, url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" },
  { title: "Afternoon Encore", start: "14:25", duration: 15, url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" }
];

function parseTime(str) {
  const [h, m] = str.split(':').map(Number);
  return h * 60 + m;
}

function formatTime(mins) {
  const h = String(Math.floor(mins / 60)).padStart(2, '0');
  const m = String(mins % 60).padStart(2, '0');
  return `${h}:${m}`;
}

function getCurrentLocalTime() {
  return new Date(); // use device/browser time
}

function loadStream(url) {
  const video = document.getElementById('video');
  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(url);
    hls.attachMedia(video);
  } else {
    video.src = url;
  }
}

function updateScheduleUI() {
  const list = document.getElementById('schedule-list');
  if (!list) return;
  list.innerHTML = '';
  playlist.forEach(p => {
    list.innerHTML += `
      <div class="schedule-item">
        <span class="schedule-time">${p.start}</span>
        <span class="schedule-title">${p.title}</span>
        <span class="schedule-duration">${p.duration}min</span>
      </div>`;
  });
}

function updatePlayer() {
  const now = getCurrentLocalTime();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const seconds = now.getSeconds();

  document.getElementById('current-time').textContent = now.toTimeString().split(' ')[0];

  const current = playlist.find(p => {
    const start = parseTime(p.start);
    const end = start + p.duration;
    return currentMins >= start && currentMins < end;
  });

  if (current) {
    const startMins = parseTime(current.start);
    const elapsed = (currentMins - startMins) * 60 + seconds;
    const remaining = current.duration * 60 - elapsed;

    document.getElementById('program-name').textContent = current.title;
    document.getElementById('program-time').textContent = `${current.start} - ${formatTime(startMins + current.duration)}`;
    document.getElementById('progress').textContent = `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`;
    document.getElementById('remaining').textContent = `${Math.floor(remaining / 60)}m ${remaining % 60}s`;
    document.getElementById('loading').textContent = `Now Playing: ${current.title}`;
    loadStream(current.url);
  } else {
    document.getElementById('program-name').textContent = '--';
    document.getElementById('program-time').textContent = '--';
    document.getElementById('progress').textContent = '--';
    document.getElementById('remaining').textContent = '--';
    document.getElementById('loading').textContent = `Off Air`;
  }
}

updateScheduleUI();
updatePlayer();
setInterval(updatePlayer, 30000);
