let player;
const playlist = [
  { videoId: 'dQw4w9WgXcQ', duration: 213, title: 'Show 1: Music Video' },
  { videoId: 'LXb3EKWsInQ', duration: 180, title: 'Show 2: Nature Documentary' },
  { videoId: 'ysz5S6PUM-U', duration: 300, title: 'Show 3: Tech Talk' }
];

const totalDuration = playlist.reduce((sum, item) => sum + item.duration, 0);
const channelStart = 0; // Adjust if you want a fixed channel start timestamp

function getCurrentPlaylistState() {
  const now = new Date();
  const utcSeconds = Math.floor(now.getTime() / 1000);
  const elapsed = (utcSeconds - channelStart) % totalDuration;

  let accumulated = 0;
  for (let i = 0; i < playlist.length; i++) {
    if (elapsed < accumulated + playlist[i].duration) {
      return { index: i, offset: elapsed - accumulated };
    }
    accumulated += playlist[i].duration;
  }
  return { index: 0, offset: 0 };
}

function onYouTubeIframeAPIReady() {
  const state = getCurrentPlaylistState();

  player = new YT.Player('player', {
    height: '100%',
    width: '100%',
    videoId: playlist[state.index].videoId,
    playerVars: {
      controls: 0,
      disablekb: 1,
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
      fs: 0,
      iv_load_policy: 3,
      autoplay: 0,
      mute: 1,
    },
    events: {
      onReady: (event) => {
        event.target.mute();

        // Cue the video with offset, but do not play yet
        event.target.cueVideoById({
          videoId: playlist[state.index].videoId,
          startSeconds: state.offset
        });
      },

      onStateChange: (event) => {
        if (event.data === YT.PlayerState.CUED) {
          // Play video once cued
          player.playVideo();
        } else if (event.data === YT.PlayerState.ENDED) {
          playNextVideo();
        } else if (event.data === YT.PlayerState.UNSTARTED) {
          // In rare cases video might be unstarted, try cue again with delay
          setTimeout(() => {
            const s = getCurrentPlaylistState();
            player.cueVideoById({
              videoId: playlist[s.index].videoId,
              startSeconds: s.offset
            });
          }, 1000);
        }
      }
    }
  });
}

function playNextVideo() {
  const currentId = player.getVideoData().video_id;
  let currentIndex = playlist.findIndex(item => item.videoId === currentId);
  let nextIndex = (currentIndex + 1) % playlist.length;
  player.loadVideoById(playlist[nextIndex].videoId, 0);
}

document.getElementById('unmute-btn').addEventListener('click', () => {
  if (player.isMuted()) {
    player.unMute();
    document.getElementById('unmute-btn').textContent = '🔈';
  } else {
    player.mute();
    document.getElementById('unmute-btn').textContent = '🔇';
  }
});

function generateProgramGuide() {
  const programList = document.getElementById('program-list');
  programList.innerHTML = '';

  let currentTime = 0;
  playlist.forEach(item => {
    const startMin = Math.floor(currentTime / 60);
    const endMin = Math.floor((currentTime + item.duration) / 60);

    const startStr = `${String(Math.floor(startMin / 60)).padStart(2, '0')}:${String(startMin % 60).padStart(2, '0')}`;
    const endStr = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;

    const li = document.createElement('li');
    li.textContent = `${startStr} - ${endStr}: ${item.title}`;
    programList.appendChild(li);

    currentTime += item.duration;
  });
}

generateProgramGuide();
