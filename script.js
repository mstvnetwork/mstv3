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
    // If there was a saved state, ensure the video starts playing
    const savedState = loadPlayerState();
    if (savedState) {
        // Player is ready, but it might not be fully loaded with the correct video and time yet.
        // The playVideo call is handled by the initial click.
        // We ensure the overlay is visible if it's the first load.
        if (localStorage.getItem('hasClickedOverlay') !== 'true') {
             overlay.classList.remove('hidden');
        } else {
             overlay.classList.add('hidden'); // Keep it hidden if already clicked
             event.target.playVideo(); // Auto-play if previously clicked
        }
    } else {
        overlay.classList.remove('hidden'); // Ensure overlay is visible if no saved state
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
        savePlayerState(); // Save state after video change
    } else if (event.data === YT.PlayerState.PLAYING) {
        // When playing, ensure overlay is hidden and player is unmuted if applicable
        overlay.classList.add('hidden');
        // We'll handle unmuting on initial click
    }
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
    if (overlay.classList.contains('visible') || localStorage.getItem('hasClickedOverlay') !== 'true') {
        overlay.classList.add('hidden');
        localStorage.setItem('hasClickedOverlay', 'true'); // Mark that the user has clicked
        if (player.isMuted()) {
            player.unMute();
        }
        player.playVideo();
    }
});

// Logic to show overlay on page reload if not previously clicked
window.addEventListener('load', () => {
    if (localStorage.getItem('hasClickedOverlay') !== 'true') {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
    }
});
