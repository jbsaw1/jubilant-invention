export async function onRequest({ env }) {
  const res = await fetch("https://xbl.io/api/v2/achievements", {
    headers: {
      "X-Authorization": env.XBL_API_KEY
    }
  });

  const data = await res.json();

  return new Response(JSON.stringify({
    achievements: data.achievements,
    _source: "openxbl"
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
