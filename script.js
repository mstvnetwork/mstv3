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
        // Also save if the player was unmuted before closing (for a more robust resume)
        localStorage.setItem('playerWasUnmuted', player.isMuted() ? 'false' : 'true');
        console.log('State saved:', { index: currentVideoIndex, time: player.getCurrentTime(), unmuted: !player.isMuted() });
    }
}

// Function to load last saved state
function loadPlayerState() {
    const lastVideoIndex = localStorage.getItem('lastVideoIndex');
    const lastVideoTime = localStorage.getItem('lastVideoTime');
    const playerWasUnmuted = localStorage.getItem('playerWasUnmuted');

    if (lastVideoIndex !== null && lastVideoTime !== null) {
        currentVideoIndex = parseInt(lastVideoIndex, 10);
        console.log('State loaded:', { index: currentVideoIndex, time: parseFloat(lastVideoTime), unmuted: playerWasUnmuted === 'true' });
        return {
            index: currentVideoIndex,
            time: parseFloat(lastVideoTime),
            wasUnmuted: playerWasUnmuted === 'true'
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
            autoplay: 0,         // IMPORTANT: Never autoplay directly here. Always wait for user interaction.
            mute: 1              // IMPORTANT: Always start muted to comply with browser policies.
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

    // Always ensure the overlay is shown initially unless it has been clicked before
    if (localStorage.getItem('hasClickedOverlay') !== 'true') {
        overlay.classList.remove('hidden'); // Show the overlay
        player.mute(); // Ensure video is muted
        player.pauseVideo(); // Ensure video is paused
    } else {
        // If already clicked, hide overlay
        overlay.classList.add('hidden');

        // Try to resume play and unmute based on saved state
        const savedState = loadPlayerState();
        if (savedState && savedState.wasUnmuted) {
            player.unMute();
        } else {
            player.mute(); // Ensure it stays muted if it was muted before
        }
        player.playVideo(); // Resume playing
    }

    // Continuously save the current time and mute state
    setInterval(savePlayerState, 5000); // Save every 5 seconds
}

function onPlayerStateChange(event) {
    console.log('Player state changed:', event.data);
    if (event.data === YT.PlayerState.ENDED) {
        // Video has ended, play the next one
        currentVideoIndex = (currentVideoIndex + 1) % videoPlaylist.length;
        player.loadVideoById(videoPlaylist[currentVideoIndex], 0); // Load next video from start
        // After loading next video, if the player was previously unmuted, try to unmute it again.
        // The browser might re-mute it, so the user might need to click again.
        if (localStorage.getItem('playerWasUnmuted') === 'true') {
             player.unMute();
        }
        savePlayerState(); // Save state after video change
    }
}

function onPlayerError(event) {
    console.error('YouTube Player Error:', event.data);
    // You might want to implement error handling here, e.g., skip to next video
    currentVideoIndex = (currentVideoIndex + 1) % videoPlaylist.length;
    player.loadVideoById(videoPlaylist[currentVideoIndex], 0);
    savePlayerState();
}

// Handle overlay click - THIS IS THE ONLY PLACE WE START PLAYING AND UNMUTING
playerContainer.addEventListener('click', () => {
    // Only act if the overlay is currently visible (meaning it hasn't been clicked yet)
    // or if the 'hasClickedOverlay' flag is not set in localStorage.
    if (localStorage.getItem('hasClickedOverlay') !== 'true') {
        overlay.classList.add('hidden'); // Hide the overlay
        localStorage.setItem('hasClickedOverlay', 'true'); // Mark that the user has clicked
        player.unMute(); // Unmute the video
        player.playVideo(); // Start playing the video
    }
    // If the overlay is already hidden (i.e., hasClickedOverlay is true),
    // this click handler won't do anything regarding the overlay.
    // It also won't re-mute/re-pause the video if the user clicks randomly after starting.
});

// Logic to show overlay on page load based on past interaction
window.addEventListener('load', () => {
    if (localStorage.getItem('hasClickedOverlay') !== 'true') {
        overlay.classList.remove('hidden'); // Ensure overlay is visible
    } else {
        overlay.classList.add('hidden'); // Keep overlay hidden if already clicked
    }
});
