export function base64UrlEncode(input) {
  const bytes = input instanceof Uint8Array ? input : new TextEncoder().encode(input);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function pemToArrayBuffer(pem) {
  const normalized = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "");

  const binary = atob(normalized);
  const buffer = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    buffer[index] = binary.charCodeAt(index);
  }

  return buffer.buffer;
}

export function isoNow() {
  return new Date().toISOString();
}

export function buildEntryId() {
  const timestamp = Date.now().toString(36);
  const random = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
  return `lpav-${timestamp}-${random}`;
}

export function extractRowNumber(updatedRange = "") {
  const match = updatedRange.match(/![A-Z]+(\d+):/);
  return match ? Number(match[1]) : null;
}

export function trimMultilineText(value = "") {
  return String(value).replace(/\r\n/g, "\n").trim();
}
