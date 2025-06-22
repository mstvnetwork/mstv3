const schedule = [
  {
    title: "Late Night YouTube Show",
    start: "2025-06-23T00:00:00+10:00", // 12:00 AM
    duration: 600, // 10 minutes
    type: "youtube",
    videoId: "dQw4w9WgXcQ" // Sample video – replace with your own
  },
  {
    title: "Test HLS Stream",
    start: "2025-06-23T00:10:00+10:00", // Starts after first one ends
    duration: 600, // 10 minutes
    type: "m3u8",
    url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
  }
];
