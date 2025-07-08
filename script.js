async function loadSchedule() {
  const res = await fetch("playlist.json");
  const playlist = await res.json();

  const now = new Date();
  const melbourneOffset = 10 * 60; // Melbourne UTC+10
  const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes() + melbourneOffset;
  const timeInDay = currentMinutes % totalDuration(playlist);

  let elapsed = 0;
  let currentItem = null;
  let startMinute = 0;

  for (const item of playlist) {
    if (timeInDay >= elapsed && timeInDay < elapsed + item.duration) {
      currentItem = item;
      startMinute = elapsed;
      break;
    }
    elapsed += item.duration;
  }

  const player = document.getElementById("ytPlayer");
  const title = document.getElementById("nowPlaying");

  if (currentItem) {
    player.src = currentItem.url + "?autoplay=1&mute=1";
    title.textContent = `Now Playing: ${currentItem.title}`;
  } else {
    player.src = "";
    title.textContent = "Off Air";
  }

  generateGuide(playlist);
}

function totalDuration(list) {
  return list.reduce((sum, item) => sum + item.duration, 0);
}

function generateGuide(playlist) {
  const guide = document.getElementById("tvGuide");
  let clock = 0;
  let content = "";

  playlist.forEach(item => {
    let hrs = Math.floor(clock / 60);
    let mins = clock % 60;
    let label = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    content += `<span class="guide-item">${label} - ${item.title}</span>`;
    clock += item.duration;
  });

  guide.innerHTML = content;
}

loadSchedule();
setInterval(loadSchedule, 60000); // update every 1 minute
