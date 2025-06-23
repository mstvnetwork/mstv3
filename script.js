// Helper to parse "HH:MM" to minutes from midnight
function parseTime(str) {
  const [h, m] = str.split(':').map(Number);
  return h * 60 + m;
}

// Format minutes from midnight back to "HH:MM"
function formatTime(mins) {
  const h = String(Math.floor(mins / 60)).padStart(2, '0');
  const m = String(mins % 60).padStart(2, '0');
  return `${h}:${m}`;
}

// Extract YouTube video ID from URL
function extractYouTubeID(url) {
  const regExp = /^.*(?:youtu.be\/|v\/|embed\/|watch\?v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[1].length === 11) ? match[1] : null;
}

// Load stream in player container, either iframe for YouTube or video + hls.js for .m3u8
function loadStream(url) {
  const container = document.getElementById('video-container');
  container.innerHTML = ''; // clear previous player

  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const videoId = extractYouTubeID(url);
    if (!videoId) {
      container.innerHTML = 'Invalid YouTube URL';
      return;
    }
    const iframe = document.createElement('iframe');
    iframe.width = "100%";
    iframe.height = "360";
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=1`;
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    container.appendChild(iframe);

  } else if (Hls.isSupported() && url.endsWith('.m3u8')) {
    const video = document.createElement('video');
    video.id = 'video';
    video.controls = true;
    video.autoplay = true;
    video.muted = true;
    video.style.width = '100%';
    container.appendChild(video);

    const hls = new Hls();

    hls.on(Hls.Events.ERROR, function(event, data) {
      console.error('HLS error:', data);
    });

    hls.loadSource(url);
    hls.attachMedia(video);

  } else {
    container.innerHTML = 'Unsupported video format or URL';
  }
}

// Update the schedule list UI
function updateScheduleUI() {
  const list = document.getElementById('schedule-list');
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

// Update the main player and info based on current time
function updatePlayer() {
  const now = new Date();
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
    document.getElementById('video-container').innerHTML = ''; // clear player
  }
}

updateScheduleUI();
updatePlayer();
setInterval(updatePlayer, 30000);
