export async function onRequest({ env }) {
  const {
    XBOX_REFRESH_TOKEN,
    XBOX_CLIENT_ID,
    XBOX_TENANT_ID
  } = env;

  //
  // 1) Refresh Microsoft access token
  //
  const tokenRes = await fetch(
    `https://login.microsoftonline.com/${XBOX_TENANT_ID}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: XBOX_CLIENT_ID,
        grant_type: "refresh_token",
        refresh_token: XBOX_REFRESH_TOKEN,
        scope: "XboxLive.signin XboxLive.offline_access"
      })
    }
  );

  const tokenJson = await tokenRes.json();
  const accessToken = tokenJson.access_token;

  //
  // 2) Exchange Microsoft token → Xbox Live token (XBL)
  //
  const xblRes = await fetch("https://user.auth.xboxlive.com/user/authenticate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
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
  const xblToken = xblJson.Token;
  const uhs = xblJson.DisplayClaims.xui[0].uhs;

  //
  // 3) Exchange XBL token → XSTS token
  //
  const xstsRes = await fetch("https://xsts.auth.xboxlive.com/xsts/authorize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
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
  const xstsToken = xstsJson.Token;

  const authHeader = `XBL3.0 x=${uhs};${xstsToken}`;

  //
  // 4) Fetch your Xbox profile
  //
  const profileRes = await fetch(
    "https://profile.xboxlive.com/users/me/profile/settings?settings=Gamertag,Gamerscore,GameDisplayPicRaw,AccountTier,TenureLevel",
    {
      headers: {
        "x-xbl-contract-version": "2",
        "Authorization": authHeader
      }
    }
  );

  const profileJson = await profileRes.json();

  //
  // 5) Return JSON to your frontend
  //
  return new Response(JSON.stringify(profileJson), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
