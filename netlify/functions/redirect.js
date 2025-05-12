export default async (event) => {
  const url = event.queryStringParameters?.url;
  const referer = event.headers.referer || "";

  // Your site domain (edit if you use custom domain later)
  const allowedReferer = "https://sunny-sawine-a9011f.netlify.app";

  // Block if no referer or wrong referer
  if (!url || !referer.startsWith(allowedReferer)) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: "Access denied." }),
    };
  }

  // Allow redirection
  return {
    statusCode: 302,
    headers: {
      Location: url,
      "Cache-Control": "no-store",
    },
  };
};
