export async function onRequest({ env }) {
  try {
    // 1. Refresh token → access token
    const tokenRes = await fetch("https://login.live.com/oauth20_token.srf", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: env.XBOX_REFRESH_TOKEN,
        client_id: env.XBOX_CLIENT_ID,
        client_secret: env.XBOX_CLIENT_SECRET,
        scope: "XboxLive.signin XboxLive.offline_access"
      })
    });

    const tokenJson = await tokenRes.json();
    if (!tokenJson.access_token) {
      throw new Error("Failed to refresh access token: " + JSON.stringify(tokenJson));
    }

    const accessToken = tokenJson.access_token;

    // 2. XBL auth
    const xblRes = await fetch("https://user.auth.xboxlive.com/user/authenticate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        RelyingParty: "http://auth.xboxlive.com",
        TokenType: "JWT",
        Properties: {
          AuthMethod: "RPS",
          SiteName: "user.auth.xboxlive.com",
          RpsTicket: `d=${accessToken}`
        }
      })
    });

    const xblJson = await xblRes.json();
    if (!xblJson.DisplayClaims?.xui?.[0]?.xuid) {
      throw new Error("XBL auth failed: " + JSON.stringify(xblJson));
    }

    const uhs = xblJson.DisplayClaims.xui[0].uhs;
    const xuid = xblJson.DisplayClaims.xui[0].xuid;

    // 3. XSTS auth
    const xstsRes = await fetch("https://xsts.auth.xboxlive.com/xsts/authorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        RelyingParty: "http://xboxlive.com",
        TokenType: "JWT",
        Properties: {
          SandboxId: "RETAIL",
          UserTokens: [xblJson.Token]
        }
      })
    });

    const xstsJson = await xstsRes.json();
    if (!xstsJson.Token) {
      throw new Error("XSTS auth failed: " + JSON.stringify(xstsJson));
    }

    const authHeader = `XBL3.0 x=${uhs};${xstsJson.Token}`;

    // 4. Achievements fetch
    const achRes = await fetch(
      `https://achievements.xboxlive.com/users/xuid(${xuid})/achievements?maxItems=100`,
      {
        headers: {
          "x-xbl-contract-version": "2",
          "Authorization": authHeader
        }
      }
    );

    const achJson = await achRes.json();
    return new Response(JSON.stringify(achJson), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.toString() }), {
      headers: { "Content-Type": "application/json" }
    });
  }
}
