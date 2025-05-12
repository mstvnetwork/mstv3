exports.handler = async function(event, context) {
  const params = new URLSearchParams(event.queryStringParameters);
  const channel = params.get('ch');

  const channels = {
    mstv1: "https://player.twitch.tv/?channel=aiodigital&parent=mstvnet.netlify.app",
    desiplay: "https://desiplaylive.akamaized.net/ptnr-yupptv/v1/manifest/611d79b11b77e2f571934fd80ca1413453772ac7/vglive-sk-660691/4cf68f50-0c5e-47a6-96e3-b78797a2b6fe/1.m3u8",
    sonykal: "https://spt-sonykal-1-us.lg.wurl.tv/playlist.m3u8",
    hindinews: "https://feeds.intoday.in/aajtak/api/aajtakhd/master.m3u8",
    warnews: "https://vg-zeefta.akamaized.net/ptnr-yupptv/title-zeenews/v1/master/611d79b11b77e2f571934fd80ca1413453772ac7/8744f9fb-d696-4204-9795-5215ad930c39/main.m3u8?hdnts=st=1746610244~exp=1746613844~acl=!*/611d79b11b77e2f571934fd80ca1413453772ac7/8744f9fb-d696-4204-9795-5215ad930c39/*!yuppTVCom_61_-1_5446c7d23048499b_AU_101.119.102.10/payload/yuppTVCom_61_-1_5446c7d23048499b_AU_101.119.102.10/*~hmac=910cda5125d118c635f063d895701b07094a7f360d69b4392b4d3e769ba153ba",
    paknews1: "https://jk3lz82elw79-hls-live.5centscdn.com/newgeonews/07811dc6c422334ce36a09ff5cd6fe71.sdp/playlist.m3u8",
    paknews2: "https://www.youtube.com/embed/RqUZ2Fv9l8w?si=JossLSYsuorpY1y_",
    paknews3: "https://www.youtube.com/embed/00HnCKJcpsU?si=8jaWfqb5IdNf3cqF",
    indianewshd: "https://pl-indiatvnews.akamaized.net/out/v1/db79179b608641ceaa5a4d0dd0dca8da/index.m3u8",
    indiaspeed: "https://poclive-indiatvnews.akamaized.net/hlslive/Admin/px0219297/live/janya/master.m3u8",
    zee: "https://dreyfus.securitytactics.com/zeecinema.html",
    cbeebies: "https://dreyfus.securitytactics.com/ceebies.html",
    aapkiaadalat: "https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg01550-indiatv-indiatv-aapkiadalat-mi-xiaomi/playlist.m3u8"
  };

  if (channels[channel]) {
    return {
      statusCode: 302,
      headers: {
        Location: channels[channel]
      }
    };
  } else {
    return {
      statusCode: 400,
      body: "Invalid or missing channel parameter."
    };
  }
};
