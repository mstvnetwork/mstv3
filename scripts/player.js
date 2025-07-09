let player;
let videoPlaylist = [
    'VIDEO_ID_1', // Replace with actual YouTube video IDs
    'VIDEO_ID_2',
    'VIDEO_ID_3',
    // ... more video IDs
];
let currentVideoIndex = 0;
let lastKnownTime = 0;

function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '100%',
        width: '100%',
        videoId: videoPlaylist[currentVideoIndex],
        playerVars: {
            'autoplay': 1,
            'controls': 0, // Disable default controls
            'disablekb': 1, // Disable keyboard controls
            'fs': 0, // Disable fullscreen button
            'iv_load_policy': 3, // Disable annotations
            'modestbranding': 1, // Hide YouTube logo on control bar
            'rel': 0, // Do not show related videos at the end
            'showinfo': 0, // Hide video title and uploader info
            'enablejsapi': 1, // Enable JavaScript API control
            'widget_referrer': window.location.href // Helps with autoplay on some browsers
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    // If there's a last known time, seek to it
    if (lastKnownTime > 0) {
        event.target.seekTo(lastKnownTime, true);
    }
    event.target.playVideo();
    // Initially mute the video to allow autoplay on page load
    event.target.mute();
}

function onPlayerStateChange(event) {
    // When a video ends, play the next one
    if (event.data === YT.PlayerState.ENDED) {
        currentVideoIndex = (currentVideoIndex + 1) % videoPlaylist.length;
        player.loadVideoById(videoPlaylist[currentVideoIndex]);
    }
    // Update last known time for time sync
    if (event.data === YT.PlayerState.PLAYING || event.data === YT.PlayerState.PAUSED) {
        lastKnownTime = player.getCurrentTime();
    }
}

// Save current time before unload
window.addEventListener('beforeunload', () => {
    if (player && typeof player.getCurrentTime === 'function') {
        localStorage.setItem('lastKnownVideoIndex', currentVideoIndex);
        localStorage.setItem('lastKnownVideoTime', player.getCurrentTime());
    }
});

// Load last known time on page load
window.addEventListener('load', () => {
    const savedIndex = localStorage.getItem('lastKnownVideoIndex');
    const savedTime = localStorage.getItem('lastKnownVideoTime');
    if (savedIndex !== null && savedTime !== null) {
        currentVideoIndex = parseInt(savedIndex);
        lastKnownTime = parseFloat(savedTime);
    }
});

// Handle unmute button
document.getElementById('unmuteButton').addEventListener('click', () => {
    if (player.isMuted()) {
        player.unMute();
        document.getElementById('unmuteButton').textContent = '🔊';
    } else {
        player.mute();
        document.getElementById('unmuteButton').textContent = '🔇';
    }
});
