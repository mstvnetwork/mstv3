document.addEventListener('DOMContentLoaded', function() {
    const videoPlayer = document.getElementById('video-player');
    const playlistContainer = document.getElementById('playlist');
    const nextBroadcastTimeElement = document.getElementById('next-broadcast-time');

    // Fetch the playlist JSON data
    fetch('playlist.json')
        .then(response => response.json())
        .then(data => {
            const playlist = data.playlist;
            let currentIndex = 0;

            // Render playlist items
            playlist.forEach(item => {
                const listItem = document.createElement('li');
                listItem.textContent = item.title;
                listItem.dataset.index = item.id;
                playlistContainer.appendChild(listItem);
            });

            // Function to update the next broadcast time
            function updateNextBroadcastTime() {
                const now = new Date();
                const nextBroadcast = playlist.find(item => {
                    const broadcastTime = new Date(item.start_time);
                    return broadcastTime > now;
                });

                if (nextBroadcast) {
                    const nextTime = new Date(nextBroadcast.start_time).toLocaleString();
                    nextBroadcastTimeElement.textContent = nextTime;
                    currentIndex = playlist.indexOf(nextBroadcast);
                    videoPlayer.src = `https://www.youtube.com/embed/${new URL(nextBroadcast.url).searchParams.get('v')}`;
                } else {
                    nextBroadcastTimeElement.textContent = 'No upcoming broadcasts';
                }
            }

            // Call updateNextBroadcastTime every 30 seconds
            setInterval(updateNextBroadcastTime, 30000);
            updateNextBroadcastTime(); // initial call to set the time

            // Playlist click event
            playlistContainer.addEventListener('click', (e) => {
                const index = e.target.dataset.index;
                if (index) {
                    const selectedItem = playlist.find(item => item.id == index);
                    videoPlayer.src = `https://www.youtube.com/embed/${new URL(selectedItem.url).searchParams.get('v')}`;
                }
            });
        })
        .catch(error => console.error('Error fetching the playlist:', error));
});
