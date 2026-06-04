export async function onRequest(context) {
  const { request, env } = context;

  // 1. Refresh token → get XSTS token + XUID
  const refreshToken = env.XBOX_REFRESH_TOKEN;

  const tokenRes = await fetch("https://login.live.com/oauth20_token.srf", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: env.XBOX_CLIENT_ID,
      client_secret: env.XBOX_CLIENT_SECRET,
      scope: "XboxLive.signin XboxLive.offline_access"
    })
  });

  const tokenJson = await tokenRes.json();
  const accessToken = tokenJson.access_token;

  // 2. Authenticate with Xbox Live
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
  const uhs = xblJson.DisplayClaims.xui[0].uhs;
  const xuid = xblJson.DisplayClaims.xui[0].xuid;

  // 3. Exchange for XSTS token
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
  const xstsToken = xstsJson.Token;

  // 4. Build Authorization header
  const authHeader = `XBL3.0 x=${uhs};${xstsToken}`;

  // 5. Fetch achievements (correct endpoint + correct contract version)
  const achievementsRes = await fetch(
    `https://achievements.xboxlive.com/users/xuid(${xuid})/achievements?maxItems=50`,
    {
      headers: {
        "x-xbl-contract-version": "2",
        "Authorization": authHeader
      }
    }
  );

  const achievementsJson = await achievementsRes.json();

  // 6. Return clean JSON to frontend
  return new Response(JSON.stringify(achievementsJson), {
    headers: { "Content-Type": "application/json" }
  });
}
