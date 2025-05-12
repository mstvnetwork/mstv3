export default async (request) => {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return new Response("Missing 'url' query parameter", { status: 400 });
  }

  try {
    return Response.redirect(url, 302); // Temporary redirect
  } catch (error) {
    return new Response("Invalid URL or redirect error", { status: 500 });
  }
};
