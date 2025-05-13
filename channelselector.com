<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Select a Channel</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      text-align: center;
      background: #111;
      color: #fff;
      padding: 20px;
    }

    h2 {
      margin-bottom: 20px;
    }

    .logo-container {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 20px;
    }

    .logo {
      cursor: pointer;
      border: 2px solid #444;
      border-radius: 10px;
      padding: 10px;
      background: #222;
      transition: transform 0.2s;
    }

    .logo:hover {
      transform: scale(1.1);
      border-color: orange;
    }

    .logo img {
      width: 100px;
      height: auto;
    }

    .logo span {
      display: block;
      margin-top: 5px;
      color: #ccc;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <h2 id="category-title">Select a Channel</h2>
  <div class="logo-container" id="logos"></div>

  <script>
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category') || '';

    document.getElementById('category-title').textContent =
      'Select a Channel from ' + category.charAt(0).toUpperCase() + category.slice(1);

    const channelData = {
      music: [
        { name: 'MTV', url: 'https://www.youtube.com/embed/ScMzIvxBSi4' },
        { name: 'VH1', url: 'https://www.youtube.com/embed/ktvTqknDobU' }
      ],
      bollywood: [
        { name: 'Zee Music', url: 'https://www.youtube.com/embed/60ItHLz5WEA' },
        { name: 'Sony Music India', url: 'https://www.youtube.com/embed/UceaB4D0jpo' }
      ],
      livesports: [
        { name: 'Sports Stream 1', url: 'https://www.youtube.com/embed/dpw9EHDh2bM' },
        { name: 'Sports Stream 2', url: 'https://www.youtube.com/embed/tgbNymZ7vqY' }
      ],
      news: [
        { name: 'CNN Live', url: 'https://www.youtube.com/embed/UZb2NOHPA2A' },
        { name: 'BBC World', url: 'https://www.youtube.com/embed/HMUDVMiITOU' }
      ],
      movies: [
        { name: 'Movie Channel 1', url: 'https://www.youtube.com/embed/nfWlot6h_JM' },
        { name: 'Movie Channel 2', url: 'https://www.youtube.com/embed/LsoLEjrDogU' }
      ]
    };

    const selectedChannels = channelData[category] || [];
    const logoContainer = document.getElementById('logos');

    selectedChannels.forEach(channel => {
      const div = document.createElement('div');
      div.className = 'logo';
      div.innerHTML = `
        <img src="https://via.placeholder.com/100x60.png?text=${encodeURIComponent(channel.name)}" alt="${channel.name}" />
        <span>${channel.name}</span>
      `;
      div.onclick = () => {
        window.opener.postMessage(channel.url, window.location.origin);
        window.close();
      };
      logoContainer.appendChild(div);
    });

    if (selectedChannels.length === 0) {
      logoContainer.innerHTML = '<p>No channels found for this category.</p>';
    }
  </script>
</body>
</html>
