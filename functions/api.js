export async function onRequest(context) {
  const url = new URL(context.request.url);
  const user = url.searchParams.get("user");

  if (!user) {
    return new Response(JSON.stringify({ error: "Missing ?user=" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const api = await fetch(
    `https://templeosrs.com/api/player_stats.php?player=${encodeURIComponent(user)}`
  );

  const text = await api.text();

  return new Response(text, {
    status: api.status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json"
    }
  });
}
