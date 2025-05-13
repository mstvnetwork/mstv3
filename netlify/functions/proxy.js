export async function handler(event, context) {
  const REAL_STREAM_URL = "https://desiplaylive.akamaized.net/ptnr-yupptv/v1/manifest/611d79b11b77e2f571934fd80ca1413453772ac7/vglive-sk-660691/4cf68f50-0c5e-47a6-96e3-b78797a2b6fe/1.m3u8?url=https%3A%2F%2Fdesiplaylive.akamaized.net%2Fptnr-yupptv%2Fv1%2Fmanifest%2F611d79b11b77e2f571934fd80ca1413453772ac7%2Fvglive-sk-660691%2F4cf68f50-0c5e-47a6-96e3-b78797a2b6fe%2F1.m3u8"; // replace this

  const response = await fetch(REAL_STREAM_URL);
  const stream = await response.text();

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/vnd.apple.mpegurl",
      "Access-Control-Allow-Origin": "*",
    },
    body: stream,
  };
}
