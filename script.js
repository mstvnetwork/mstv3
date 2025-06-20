async function loadPlaylist() {
  const res = await fetch('playlist.json');
  const schedule = await res.json();
  const now = DateTime.now().setZone('Asia/Kolkata'); // IST

  console.log("Current IST Time:", now.toFormat("yyyy-MM-dd HH:mm:ss"));

  const current = schedule.find(item => {
    const start = DateTime.fromISO(item.start).setZone('Asia/Kolkata');
    const end = DateTime.fromISO(item.end).setZone('Asia/Kolkata');
    console.log(`Checking: ${item.title} | ${start.toFormat("HH:mm")} - ${end.toFormat("HH:mm")}`);

    return now >= start && now <= end;
  });

  if (!current) {
    container.innerHTML = `<p>No program currently scheduled<br>Time now: ${now.toFormat("HH:mm:ss")} IST</p>`;
    status.textContent = "";
    return;
  }

  status.textContent = `Now Playing: ${current.title}`;
  playStream(current);
}
