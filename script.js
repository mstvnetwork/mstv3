let player;
let currentVideoIndex = 0;
let videoPlaylist = [
    // Replace with your YouTube video IDs or full URLs
    'dQw4w9WgXcQ', // Example: Rick Astley - Never Gonna Give Up
    'eE9tVPRJ_e4', // Example: Another video ID
    's_xQ_4t5n94', // Example: Yet another video
    // You can add many more video IDs here
];

const overlay = document.getElementById('overlay');
const unmuteButton = document.getElementById('unmute-button');
const playerContainer = document.getElementById('player-container');

// Function to save current state
function savePlayerState() {
    if (player && player.getCurrentTime) {
        localStorage.setItem('lastVideoIndex', currentVideoIndex);
        localStorage.setItem('lastVideoTime', player.getCurrentTime());
        // Save mute state
        localStorage.setItem('isMuted', player.isMuted() ? 'true' : 'false');
        console.log('State saved:', { index: currentVideoIndex, time: player.getCurrentTime(), muted: player.isMuted() });
    }
}

// Function to load last saved state
function loadPlayerState() {
    const lastVideoIndex = localStorage.getItem('lastVideoIndex');
    const lastVideoTime = localStorage.getItem('lastVideoTime');
    const isMuted = localStorage.getItem('isMuted');

    if (lastVideoIndex !== null && lastVideoTime !== null) {
        currentVideoIndex = parseInt(lastVideoIndex, 10);
        console.log('State loaded:', { index: currentVideoIndex, time: parseFloat(lastVideoTime), muted: isMuted === 'true' });
        return {
            index: currentVideoIndex,
            time: parseFloat(lastVideoTime),
            muted: isMuted === 'true'
        };
    }
    return null;
}

// This function is called by the YouTube IFrame Player API when it's ready
function onYouTubeIframeAPIReady() {
    const savedState = loadPlayerState();
    let initialVideoId = videoPlaylist[0];
    let initialStartTime = 0;
    let initialMuteState = true; // Start muted by default

    if (savedState) {
        initialVideoId = videoPlaylist[savedState.index];
        initialStartTime = savedState.time;
        initialMuteState = savedState.muted; // Use saved mute state
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
            mute: initialMuteState ? 1 : 0 // Set mute state based on loaded state or default
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

    // Decide if overlay should be visible
    if (localStorage.getItem('hasClickedOverlay') !== 'true') {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
        // Auto-play if previously clicked and not muted (or was muted but now should play)
        if (player.isMuted() && savedState && !savedState.muted) {
            // Player was previously unmuted, but loaded muted due to browser policy.
            // We'll wait for the unmute button click, so don't auto-unmute here.
        } else {
            event.target.playVideo();
        }
    }

    // Decide if unmute button should be visible
    if (player.isMuted()) {
        unmuteButton.classList.remove('hidden');
    } else {
        unmuteButton.classList.add('hidden');
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
        savePlayerState(); // Save state after video change
        // Ensure unmute button reappears if the new video starts muted (which it will by default)
        if (player.isMuted()) {
            unmuteButton.classList.remove('hidden');
        }
    } else if (event.data === YT.PlayerState.PLAYING) {
        // When playing, ensure overlay is hidden
        overlay.classList.add('hidden');
        // If it's playing and not muted, hide the unmute button
        if (!player.isMuted()) {
            unmuteButton.classList.add('hidden');
        }
    } else if (event.data === YT.PlayerState.PAUSED) {
        // If the player somehow pauses (e.g., buffering, or if you introduce a pause feature),
        // you might want to show the unmute button if it's muted.
        if (player.isMuted()) {
            unmuteButton.classList.remove('hidden');
        }
    }
}

function onPlayerError(event) {
    console.error('YouTube Player Error:', event.data);
    // You might want to implement error handling here, e.g., skip to next video
    currentVideoIndex = (currentVideoIndex + 1) % videoPlaylist.length;
    player.loadVideoById(videoPlaylist[currentVideoIndex], 0);
    savePlayerState();
}

// Handle overlay click (initial play and unmute)
playerContainer.addEventListener('click', () => {
    if (overlay.classList.contains('visible') || localStorage.getItem('hasClickedOverlay') !== 'true') {
        overlay.classList.add('hidden');
        localStorage.setItem('hasClickedOverlay', 'true'); // Mark that the user has clicked
        if (player.isMuted()) {
            // If unmute button exists, it will handle unmuting.
            // If not, unmute here. For this setup, we rely on the unmute button directly for unmuting.
            // For the initial click, we want to play, but not necessarily unmute unless the button is clicked.
            // We ensure play here. Mute state will be handled by the button or initial load.
        }
        player.playVideo();
        // After initial click, if muted, the unmute button should be visible
        if (player.isMuted()) {
            unmuteButton.classList.remove('hidden');
        }
    }
});

// Handle unmute button click
unmuteButton.addEventListener('click', (event) => {
    event.stopPropagation(); // Prevent click from bubbling up to playerContainer
    if (player && player.isMuted()) {
        player.unMute();
        unmuteButton.classList.add('hidden'); // Hide button once unmuted
        savePlayerState(); // Save the unmuted state
    }
});


// Logic to show overlay and unmute button on page reload
window.addEventListener('load', () => {
    if (localStorage.getItem('hasClickedOverlay') !== 'true') {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
    }

    // Always show unmute button on load if the player starts muted
    // This state will be updated by onPlayerReady when player's actual mute state is known.
    const savedState = loadPlayerState();
    if (!savedState || savedState.muted) { // If no saved state or was previously muted
        unmuteButton.classList.remove('hidden');
    } else {
        unmuteButton.classList.add('hidden');
    }
});
