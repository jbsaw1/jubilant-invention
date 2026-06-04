export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/xbox-profile") {
      return getProfile(env);
    }

    if (url.pathname === "/xbox-achievements") {
      return getAchievements(env);
    }

    if (url.pathname === "/xbox-recent-games") {
      return getRecentGames(env);
    }

    return new Response("Not found", { status: 404 });
  }
};

// -------------------------
// PROFILE
// -------------------------
async function getProfile(env) {
  const res = await fetch("https://xbl.io/api/v2/account", {
    headers: { "X-Authorization": env.XBL_API_KEY }
  });

  const data = await res.json();

  return json({ profile: data, _source: "openxbl" });
}

// -------------------------
// ACHIEVEMENTS
// -------------------------
async function getAchievements(env) {
  const res = await fetch("https://xbl.io/api/v2/achievements/player", {
    headers: { "X-Authorization": env.XBL_API_KEY }
  });

  const data = await res.json();

  return json({ achievements: data.achievements, _source: "openxbl" });
}


// -------------------------
// RECENT GAMES
// -------------------------
async function getRecentGames(env) {
  const res = await fetch("https://xbl.io/api/v2/activity/titlehistory", {
    headers: { "X-Authorization": env.XBL_API_KEY }
  });

  const data = await res.json();

  return json({ titles: data.titles, _source: "openxbl" });
}

// -------------------------
function json(obj) {
  return new Response(JSON.stringify(obj), {
    headers: { "Content-Type": "application/json" }
  });
}
