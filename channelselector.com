<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Select a Channel</title>
    <style>
        body {
            font-family: sans-serif;
            text-align: center;
            padding: 20px;
        }
        .logo {
            display: inline-block;
            margin: 10px;
            cursor: pointer;
        }
        .logo img {
            width: 100px;
            height: auto;
            border: 2px solid #333;
            border-radius: 8px;
        }
    </style>
</head>
<body>
    <h2>Select a Channel</h2>
    <div id="logos"></div>

    <script>
    const category = new URLSearchParams(window.location.search).get('category');

    const channelData = {
        music: [
            { name: "MTV", url: "https://www.youtube.com/embed/VIDEO_ID1" },
            { name: "VH1", url: "https://www.youtube.com/embed/VIDEO_ID2" }
        ],
        bollywood: [
            { name: "Zee Music", url: "https://www.youtube.com/embed/VIDEO_ID3" }
        ],
        // Add other categories similarly...
    };

    const logosDiv = document.getElementById('logos');
    (channelData[category] || []).forEach(channel => {
        const div = document.createElement('div');
        div.className = 'logo';
        div.innerHTML = `<img src="https://via.placeholder.com/100x60?text=${encodeURIComponent(channel.name)}" alt="${channel.name}">`;
        div.onclick = () => {
            window.opener.postMessage(channel.url, window.location.origin);
            window.close();
        };
        logosDiv.appendChild(div);
    });
    </script>
</body>
</html>
