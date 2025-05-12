export default async (req, context) => {
  const urlMap = {
    fox: "https://fox-apple-live.akamaized.net/abcnews/master.m3u8",
    mtv: "https://pluto-live.plutotv.net/egress/chandler/pluto01/live/MTV/master.m3u8",
    abc: "https://abclive.akamaized.net/abcnews/master.m3u8",
    aljazeera: "https://live-hls-web-aje.getaj.net/AJE/index.m3u8",
    espn: "https://linearjitp-playback.astro.com.my/dash-wv/linear/2604/default.mpd",
    kal: "https://spt-sonykal-1-us.lg.wurl.tv/playlist.m3u8",
    aajtak: "https://feeds.intoday.in/aajtak/api/aajtakhd/master.m3u8"
  };

  const { searchParams } = new URL(req.url);
  const channel = searchParams.get("ch");

  if (channel && urlMap[channel]) {
    return Response.redirect(urlMap[channel], 302);
  }

  return new Response("Channel not found", {
    status: 404,
    headers: { "Content-Type": "text/plain" }
  });
};
