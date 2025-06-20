const playlistUrl = 'playlist.json';
const hlsPlayer = document.getElementById('hlsPlayer');
const ytContainer = document.getElementById('ytPlayer');
const nowPlaying = document.getElementById('nowPlaying');
const tvGuideList = document.getElementById('tvGuideList');

let currentVideoIndex = -1;
let ytPlayer;

function fetchPlaylist() {
  fetch(playlistUrl)
    .then(res => res.json())
    .then(data => {
      const melTime = luxon.DateTime.now().setZone('Australia/Melbourne');
      const currentItem = data.find((item, i) => {
        const start = luxon.DateTime.fromISO(item.start);
        const end = luxon.DateTime.fromISO(item.end);
        if (melTime >= start && melTime <= end) {
          currentVideoIndex = i;
          return true;
        }
        return false;
      });

      buildTVGuide(data);

      if (currentItem) {
        playVideo(currentItem);
      } else {
        nowPlaying.innerText = "Now Playing: Off Air";
      }
    });
}

function buildTVGuide(data) {
  tvGuideList.innerHTML = '';
  const melTime = luxon.DateTime.now().setZone('Australia/Melbourne');

  data.forEach((item, i) => {
    const li = document.createElement('li');
    li.textContent = `${formatTime(item.start)} - ${item.title}`;
    if (i === currentVideoIndex) li.classList.add('active');
    tvGuideList.appendChild(li);
  });

  function formatTime(iso) {
    return luxon.DateTime.fromISO(iso).toFormat('HH:mm');
  }
}

function playVideo(item) {
  nowPlaying.innerText = `Now Playing: ${item.title}`;
  const start = luxon.DateTime.fromISO(item.start);
  const melNow = luxon.DateTime.now().setZone('Australia/Melbourne');
  const seekTo = Math.floor(melNow.diff(start, 'seconds').seconds);

  if (item.url.includes('youtube.com') || item.url.includes('youtu.be')) {
    playYouTube(item.url, seekTo);
  } else {
    playHLS(item.url, seekTo);
  }
}

function playHLS(url, seekTo) {
  ytContainer.style.display = 'none';
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
  hlsPlayer.pause();
  hlsPlayer.style.display = 'none';
  ytContainer.style.display = 'block';
  const videoId = new URL(url).searchParams.get('v');

  window.onYouTubeIframeAPIReady = () => {
    ytPlayer = new YT.Player('ytPlayer', {
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
  };
}

fetchPlaylist();
