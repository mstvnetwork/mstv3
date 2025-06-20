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

      const melNow = luxon.DateTime.now().setZone('Australia/Melbourne');

      console.log("Melbourne now (Luxon):", melNow.toISO());
      console.log("Local time:", new Date().toLocaleString());
      console.log("UTC time:", new Date().toISOString());

      // Show Melbourne time on page (if #melNow element exists)
      const melNowBox = document.getElementById('melNow');
      if (melNowBox) melNowBox.textContent = melNow.toFormat('yyyy-LL-dd HH:mm:ss');

      let matchedIndex = -1;

      data.forEach((item, i) => {
        const start = luxon.DateTime.fromISO(item.start).setZone('Australia/Melbourne');
        const end = luxon.DateTime.fromISO(item.end).setZone('Australia/Melbourne');
        console.log(`${i}: Checking "${item.title}" from ${start.toISO()} to ${end.toISO()}`);

        if (melNow >= start && melNow <= end) {
          console.log(`✅ MATCH FOUND: ${item.title}`);
          matchedIndex = i;
        }
      });

      buildTVGuide(data);

      if (matchedIndex !== -1) {
        currentVideoIndex = matchedIndex;
        playVideo(data[matchedIndex]);
      } else {
        currentVideoIndex = -1;
        nowPlaying.innerText = "Now Playing: Off Air";
        stopPlayers();
      }

      // Check every 15 seconds for changes
      setInterval(checkForProgramChange, 15000);
    })
    .catch(err => {
      console.error("Error fetching playlist:", err);
      nowPlaying.innerText = "Error loading playlist";
    });
}

function checkForProgramChange() {
  if (currentPlaylist.length === 0) return;

  const melNow = luxon.DateTime.now().setZone('Australia/Melbourne');
  let newIndex = -1;

  currentPlaylist.forEach((item, i) => {
    const start = luxon.DateTime.fromISO(item.start).setZone('Australia/Melbourne');
    const end = luxon.DateTime.fromISO(item.end).setZone('Australia/Melbourne');

    if (melNow >= start && melNow <= end) {
      newIndex = i;
    }
  });

  if (newIndex !== currentVideoIndex) {
    if (newIndex === -1) {
      nowPlaying.innerText = "Now Playing: Off Air";
      stopPlayers();
    } else {
      currentVideoIndex = newIndex;
      playVideo(currentPlaylist[newIndex]);
    }
    buildTVGuide(currentPlaylist);
  } else {
    // Still same program, update guide highlight and Melbourne time display
    buildTVGuide(currentPlaylist);
    const melNowBox = document.getElementById('melNow');
    if (melNowBox) melNowBox.textContent = melNow.toFormat('yyyy-LL-dd HH:mm:ss');
  }
}

function buildTVGuide(data) {
  tvGuideList.innerHTML = '';
  const melNow = luxon.DateTime.now().setZone('Australia/Melbourne');

  data.forEach((item, i) => {
    const start = luxon.DateTime.fromISO(item.start).setZone('Australia/Melbourne');
    const time = start.toFormat('HH:mm');
    const li = document.createElement('li');
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
  if (!hlsPlayer) return;
  hlsPlayer.pause();
  hlsPlayer.style.display = 'none';
  ytContainer.innerHTML = '';
  ytContainer.style.display = 'none';
  if (ytPlayer) {
    ytPlayer.destroy();
    ytPlayer = null;
  }
}

function playHLS(url, seekTo) {
  stopPlayers();
  hlsPlayer.style.display = 'block';

  if (hlsPlayer.canPlayType('application/vnd.apple.mpegurl')) {
    hlsPlayer.src = url;
    hlsPlayer.currentTime = seekTo;
    hlsPlayer.play().catch(err => console.warn("HLS play error:", err));
  } else if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(url);
    hls.attachMedia(hlsPlayer);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      hlsPlayer.currentTime = seekTo;
      hlsPlayer.play().catch(err => console.warn("HLS play error:", err));
    });
  } else {
    nowPlaying.innerText = "HLS not supported on this device.";
  }
}

function playYouTube(url, seekTo) {
  stopPlayers();
  ytContainer.style.display = 'block';

  // Extract YouTube video ID from URL
  let videoId = null;
  try {
    const urlObj = new URL(url);
    if (urlObj.searchParams.has('v')) {
      videoId = urlObj.searchParams.get('v');
    } else {
      // Handle short YouTube URLs like youtu.be/ID
      videoId = urlObj.pathname.slice(1);
    }
  } catch {
    videoId = url;
  }

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

// Start
fetchPlaylist();
