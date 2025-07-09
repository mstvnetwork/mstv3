let player;
let currentVideoIndex = 0;
let videoPlaylist = [
    // Replace with your YouTube video IDs or full URLs
    'dQw4w9WgXcQ', // Example: Rick Astley - Never Gonna Give You Up
    'eE9tVPRJ_e4', // Example: Another video ID
    's_xQ_4t5n94', // Example: Yet another video
    // You can add many more video IDs here
];

const overlay = document.getElementById('overlay');
const playerContainer = document.getElementById('player-container');

// Function to save current state
function savePlayerState() {
    if (player && player.getCurrentTime) {
        localStorage.setItem('lastVideoIndex', currentVideoIndex);
        localStorage.setItem('lastVideoTime', player.getCurrentTime());
        console.log('State saved:', { index: currentVideoIndex, time: player.getCurrentTime() });
    }
}

// Function to load last saved state
function loadPlayerState() {
    const lastVideoIndex = localStorage.getItem('lastVideoIndex');
    const lastVideoTime = localStorage.getItem('lastVideoTime');

    if (lastVideoIndex !== null && lastVideoTime !== null) {
        currentVideoIndex = parseInt(lastVideoIndex, 10);
        console.log('State loaded:', { index: currentVideoIndex, time: parseFloat(lastVideoTime) });
        return {
            index: currentVideoIndex,
            time: parseFloat(lastVideoTime)
        };
    }
    return null;
}

// This function is called by the YouTube IFrame Player API when it's ready
function onYouTubeIframeAPIReady() {
    const savedState = loadPlayerState();
    let initialVideoId = videoPlaylist[0];
    let initialStartTime = 0;

    if (savedState) {
        initialVideoId = videoPlaylist[savedState.index];
        initialStartTime = savedState.time;
    }

    player = new YT.Player('player', {
        height: '100%',
        width: '100%',
        videoId: initialVideoId,
        playerVars: {
            controls: 0,         // Hide player controls
            disablekb: 1,        // Disable keyboard controls
            fs: 0,               // Disable fullscreen button
            iv_load_policy: 3,   // Hide video annotations
            modestbranding: 1,   // Hide YouTube logo
            rel: 0,              // Do not show related videos
            showinfo: 0,         // Hide video title and uploader info
            start: initialStartTime, // Set initial start time
            autoplay: 0,         // Don't autoplay initially, wait for user click
            mute: 1              // Start muted
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
        }
    });
}

function onPlayerReady(event) {
    console.log('Player ready!');
    const savedState = loadPlayerState();

    // Check if the user has clicked the overlay before
    if (localStorage.getItem('hasClickedOverlay') === 'true') {
        overlay.classList.add('hidden'); // Keep it hidden if already clicked
        // Attempt to play and unmute only if it was previously clicked
        player.unMute(); // Unmute immediately if user has interacted before
        event.target.playVideo(); // Auto-play if previously clicked
    } else {
        overlay.classList.remove('hidden'); // Ensure overlay is visible if no previous interaction
        // If it's the first time or not clicked, ensure video is muted and not playing until interaction
        player.mute();
        player.pauseVideo();
    }

    // Continuously save the current time
    setInterval(savePlayerState, 5000); // Save every 5 seconds
}

function onPlayerStateChange(event) {
    console.log('Player state changed:', event.data);
    if (event.data === YT.PlayerState.ENDED) {
        // Video has ended, play the next one
        currentVideoIndex = (currentVideoIndex + 1) % videoPlaylist.length;
        player.loadVideoById(videoPlaylist[currentVideoIndex], 0); // Load next video from start
        player.unMute(); // Ensure next video plays unmuted if previously unmuted
        savePlayerState(); // Save state after video change
    }
    // No specific actions for PLAYING or PAUSED states as overlay is handled by click.
}

function onPlayerError(event) {
    console.error('YouTube Player Error:', event.data);
    // You might want to implement error handling here, e.g., skip to next video
    currentVideoIndex = (currentVideoIndex + 1) % videoPlaylist.length;
    player.loadVideoById(videoPlaylist[currentVideoIndex], 0);
    savePlayerState();
}

// Handle overlay click
playerContainer.addEventListener('click', () => {
    // Only act if the overlay is currently visible (meaning it hasn't been clicked yet)
    // or if the 'hasClickedOverlay' flag is not set in localStorage.
    if (overlay.classList.contains('visible') || localStorage.getItem('hasClickedOverlay') !== 'true') {
        overlay.classList.add('hidden'); // Hide the overlay
        localStorage.setItem('hasClickedOverlay', 'true'); // Mark that the user has clicked
        if (player.isMuted()) {
            player.unMute(); // Unmute the video
        }
        player.playVideo(); // Start playing the video
    }
});

// Logic to show overlay on page reload if not previously clicked
window.addEventListener('load', () => {
    if (localStorage.getItem('hasClickedOverlay') !== 'true') {
        overlay.classList.remove('hidden'); // Ensure overlay is visible
    } else {
        overlay.classList.add('hidden'); // Keep overlay hidden if already clicked
    }
});
