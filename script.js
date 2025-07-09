const DateTime = luxon.DateTime;
const guideList = document.getElementById("tv-guide");
const player = document.getElementById("player");
const unmuteIcon = document.getElementById("unmute-icon");

let schedule = [];

fetch("schedule.json")
  .then(res => res.json())
  .then(data => {
    schedule = data;
    updateGuide();
    loadCurrentVideo();
  });

function updateGuide() {
  schedule.forEach(show => {
    const li = document.createElement("li");
    li.textContent = `${show.start} - ${show.end}: ${show.title}`;
    guideList.appendChild(li);
  });
}

function loadCurrentVideo() {
  const now = DateTime.now().setZone("Australia/Melbourne");
  const minutesNow = now.hour * 60 + now.minute;

  for (let show of schedule) {
    const [sh, sm] = show.start.split(":").map(Number);
    const [eh, em] = show.end.split(":").map(Number);
    const showStart = sh * 60 + sm;
    const showEnd = eh * 60 + em;

    if (minutesNow >= showStart && minutesNow < showEnd) {
      const currentSeconds = (minutesNow - showStart) * 60 + now.second;
      const urlID = getYouTubeID(show.url);
      const autoplayURL = `https://www.youtube.com/embed/${urlID}?start=${currentSeconds}&autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&enablejsapi=1`;
      player.src = autoplayURL;
      break;
    }
  }
}

function getYouTubeID(url) {
  const regex = /(?:v=|\/embed\/|\.be\/)([^&?/]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Unmute logic
unmuteIcon.addEventListener("click", () => {
  player.contentWindow.postMessage('{"event":"command","func":"unMute","args":""}', "*");
  unmuteIcon.style.display = "none";
});
