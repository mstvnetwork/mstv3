const playlistUrl = 'playlist.json';
const hlsPlayer = document.getElementById('hlsPlayer');
const ytContainer = document.getElementById('ytPlayer');
const nowPlaying = document.getElementById('nowPlaying');
const tvGuideList = document.getElementById('tvGuideList');

let currentVideoIndex = -1;
let currentPlaylist = [];
let ytPlayer;

function fetchPlaylist() {
  fetch(playlistUrl)
    .then(res => res.json())
    .then(data => {
      currentPlaylist = data;
      updateNow();
      setInterval(checkForProgramChange, 15000); // check every 15s
    });
}

function updateNow() {
  const melNow = luxon.DateTime.now().setZone('Australia/Melbourne');

  // Debug: Show current Melbourne time
  const melNowBox = document.getElementById('melNow');
  if (melNowBox) {
    melNowBox.textContent = melNow.toFormat('HH:mm:ss');
  }

  const currentItem = currentPlaylist.find((item, i) => {
    const start = luxon.DateTime.fromISO(item.start).setZone('Australia/Melbourne');
    const end = luxon.DateTime.fromISO(item.end).setZone('Australia/Melbourne');
    if (melNow >= start && melNow <= end) {
      currentVideoIndex = i;
      return true;
    }
    return false;
  });

  buildTVGuide(currentPlaylist);

  if (currentItem) {
    playVideo(currentItem);
  } else {
    nowPlaying.innerText = "Now Playing: Off Air";
    stopPlayers();
  }
}

function checkForProgramChange() {
  const melNow = luxon.DateTime.now().setZone('Australia/Melbourne');

  const newIndex = currentPlaylist.findIndex((item) => {
    const start = luxon.DateTime.fromISO(item.start).setZone('Australia/Melbourne');
    const end = luxon.DateTime.fromISO(item.end).setZone('Australia/Melbourne');
    return melNow >= start && melNow <= end;
  });

  if (newIndex !== currentVideoIndex) {
    currentVideoIndex = newIndex;
    if (newIndex === -1) {
      nowPlaying.innerText = "Now Playing: Off Air";
      stopPlayers();
    } else {
      playVideo(currentPlaylist[newIndex]);
      buildTVGuide(currentPlaylist);
    }
  } else {
    // still same item, just refresh clock and guide highlight
    buildTVGuide(currentPlaylist);
    const melNowBox = document.getElementById('melNow');
    if (melNowBox) {
      melNowBox.textContent = melNow.toFormat('HH:mm:ss');
    }
  }
}

function buildTVGuide(data) {
  tvGuideList.innerHTML = '';
  const melNow = luxon.DateTime.now().setZone('Australia/Melbourne');

  data.forEach((item, i) => {
    const li = document.createElement('li');
    const start = luxon.DateTime.fromISO(item.start).setZone('Australia/Melbourne');
    const time = start.toFormat('HH:mm');
    li.textContent = `${time} - ${item.title}`;
    if (i === currentVideoIndex) {
      li.classList.add('active');
    }
    tvGuideList.appendChild(li);
  });
}

function playVideo(item) {
  nowPlaying.innerText = `Now Playing: ${item.title}`;

  const start = luxon.DateTime.fromISO(item.start).setZone('Australia/Melbourne');
  const melNow = luxon.DateTime.now().setZone('Australia/Melbourne');
  const seekTo = Math.floor(melNow.diff(start, 'seconds').seconds);

  if (item.url.includes('youtube.com') || item.url.includes('youtu.be')) {
    playYouTube(item.url, seekTo);
  } else {
    playHLS(item.url, seekTo);
  }
}

function stopPlayers() {
  hlsPlayer.pause();
  hlsPlayer.style.display = 'none';
  ytContainer.innerHTML = '';
  ytContainer.style.display = 'none';
}

function playHLS(url, seekTo) {
  stopPlayers();
  hlsPlayer.style.display = 'block';

  if (hlsPlayer.canPlayType('application/vnd.apple.mpegurl')) {
    hlsPlayer.src = url;
    hlsPlayer.currentTime = seekTo;
    hlsPlayer.play();
  } else if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(url);
    hls.attachMedia(hlsPlayer);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      hlsPlayer.currentTime = seekTo;
      hlsPlayer.play();
    });
  } else {
    nowPlaying.innerText = "HLS not supported on this device.";
  }
}

function playYouTube(url, seekTo) {
  stopPlayers();
  ytContainer.style.display = 'block';

  const videoId = new URL(url).searchParams.get('v');
  ytPlayer = new YT.Player('ytPlayer', {
    height: '100%',
    width: '100%',
    videoId: videoId,
    playerVars: {
      autoplay: 1,
      mute: 1,
      start: seekTo,
      controls: 1,
      modestbranding: 1,
      rel: 0,
      playsinline: 1
    },
    events: {
      onReady: e => e.target.playVideo()
    }
  });
}

// Load once at start
fetchPlaylist();
