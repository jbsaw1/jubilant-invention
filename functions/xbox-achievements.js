export async function onRequest({ env }) {
  const { XBOX_REFRESH_TOKEN, XBOX_CLIENT_ID } = env;

  // 1) Refresh MSA token
  const tokenRes = await fetch("https://login.live.com/oauth20_token.srf", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: XBOX_CLIENT_ID,
      grant_type: "refresh_token",
      refresh_token: XBOX_REFRESH_TOKEN,
      redirect_uri: "https://localhost"
    })
  });

  const tokenJson = await tokenRes.json();
  if (!tokenJson.access_token) return new Response(JSON.stringify(tokenJson), { status: 500 });

  const accessToken = tokenJson.access_token;

  // 2) XBL auth
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
  if (!xblJson.Token) return new Response(JSON.stringify(xblJson), { status: 500 });

  const xblToken = xblJson.Token;
  const uhs = xblJson.DisplayClaims.xui[0].uhs;
  const xuid = xblJson.DisplayClaims.xui[0].xid;

  // 3) XSTS auth
  const xstsRes = await fetch("https://xsts.auth.xboxlive.com/xsts/authorize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      RelyingParty: "http://xboxlive.com",
      TokenType: "JWT",
      Properties: {
        SandboxId: "RETAIL",
        UserTokens: [xblToken]
      }
    })
  });

  const xstsJson = await xstsRes.json();
  if (!xstsJson.Token) return new Response(JSON.stringify(xstsJson), { status: 500 });

  const xstsToken = xstsJson.Token;
  const authHeader = `XBL3.0 x=${uhs};${xstsToken}`;

  // 4) Fetch achievements using XUID
  const achRes = await fetch(
    `https://achievements.xboxlive.com/users/xuid(${xuid})/achievements?maxItems=200`,
    {
      headers: {
        "x-xbl-contract-version": "2",
        "Authorization": authHeader
      }
    }
  );

  const achJson = await achRes.json();
  achJson._workerVersion = "v8-achievements-xuid";

  return new Response(JSON.stringify(achJson), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
