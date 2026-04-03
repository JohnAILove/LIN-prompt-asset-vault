import { LPAV_CONFIG } from "./config.local.js";
import { base64UrlEncode, pemToArrayBuffer } from "./helpers.js";

let tokenCache = {
  accessToken: null,
  expiresAt: 0
};

async function importPrivateKey() {
  return crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(LPAV_CONFIG.googleServiceAccount.privateKey),
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256"
    },
    false,
    ["sign"]
  );
}

async function signJwt(unsignedToken) {
  const privateKey = await importPrivateKey();
  const signatureBuffer = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(unsignedToken)
  );

  return base64UrlEncode(new Uint8Array(signatureBuffer));
}

async function buildSignedAssertion() {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "RS256",
    typ: "JWT"
  };
  const payload = {
    iss: LPAV_CONFIG.googleServiceAccount.clientEmail,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: LPAV_CONFIG.googleServiceAccount.tokenUri,
    exp: now + 3600,
    iat: now
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const signature = await signJwt(unsignedToken);
  return `${unsignedToken}.${signature}`;
}

export async function getAccessToken() {
  const now = Date.now();
  if (tokenCache.accessToken && tokenCache.expiresAt > now + 60_000) {
    return tokenCache.accessToken;
  }

  const assertion = await buildSignedAssertion();
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion
  });

  const response = await fetch(LPAV_CONFIG.googleServiceAccount.tokenUri, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Token 取得失敗：${errorText}`);
  }

  const data = await response.json();
  tokenCache = {
    accessToken: data.access_token,
    expiresAt: now + Number(data.expires_in || 3600) * 1000
  };

  return tokenCache.accessToken;
}
