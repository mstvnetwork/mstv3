<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>24h Live Broadcast</title>
<style>
  body, html {
    margin: 0; padding: 0; height: 100%;
    background: black;
    overflow: hidden;
  }
  #video-player {
    width: 100vw;
    height: 100vh;
    background: black;
  }
  /* Scrolling text at bottom */
  #scrolling-text {
    position: absolute;
    bottom: 0;
    width: 100vw;
    background: red;
    color: white;
    font-weight: bold;
    padding: 5px 10px;
    overflow: hidden;
    white-space: nowrap;
    box-sizing: border-box;
  }
  #scrolling-text span {
    display: inline-block;
    padding-left: 100%;
    animation: scroll-left 15s linear infinite;
  }
  @keyframes scroll-left {
    0% { transform: translateX(0); }
    100% { transform: translateX(-100%); }
  }
</style>
</head>
<body>

<div id="video-player"></div>
<div id="scrolling-text"><span>Welcome to MSTV Network — Your 24h Live Broadcast Channel</span></div>

<script src="https://www.youtube.com/iframe_api"></script>
<script src="script.js"></script>

</body>
</html>
