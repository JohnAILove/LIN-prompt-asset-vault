import { LPAV_CONFIG } from "./config.local.js";
import { getAccessToken } from "./googleAuth.js";
import { buildEntryId, extractRowNumber, isoNow, trimMultilineText } from "./helpers.js";

const ASSET_TYPE_META = {
  video: {
    sheetName: LPAV_CONFIG.spreadsheet.sheetNames.video,
    label: "影片",
    mimeType: "video/mp4"
  },
  image: {
    sheetName: LPAV_CONFIG.spreadsheet.sheetNames.image,
    label: "圖片",
    mimeType: "image/png"
  },
  text: {
    sheetName: LPAV_CONFIG.spreadsheet.sheetNames.text,
    label: "文字",
    mimeType: "text/plain"
  }
};

const SHEET_HEADERS = [
  "編號",
  "建立時間",
  "資產類型",
  "標題",
  "提示詞內容",
  "標籤",
  "備註",
  "雲端檔案ID",
  "雲端檢視連結",
  "檔案類型",
  "是否公開",
  "是否收藏",
  "狀態"
];

const ENTRY_ID_RETRY_LIMIT = 20;
const RETRY_DELAYS_MS = [800, 1600];
const readySheets = new Set();
let knownSheetTitles = null;

function getAssetMeta(assetType) {
  const meta = ASSET_TYPE_META[assetType];
  if (!meta) {
    throw new Error(`不支援的資產類型：${assetType}`);
  }

  return meta;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sheetsRequest(path, options = {}, attempt = 0) {
  const accessToken = await getAccessToken();
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${LPAV_CONFIG.spreadsheet.spreadsheetId}${path}`,
    {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=utf-8",
        ...(options.headers || {})
      }
    }
  );

  if (!response.ok) {
    if ((response.status === 429 || response.status >= 500) && attempt < RETRY_DELAYS_MS.length) {
      await sleep(RETRY_DELAYS_MS[attempt]);
      return sheetsRequest(path, options, attempt + 1);
    }

    const errorText = await response.text();
    if (response.status === 429) {
      throw new Error("Google Sheet 讀取太頻繁，請等幾秒再試。");
    }

    throw new Error(`Google Sheet API 錯誤：${errorText}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function loadSheetTitles(force = false) {
  if (knownSheetTitles && !force) {
    return knownSheetTitles;
  }

  const metadata = await sheetsRequest("?fields=sheets.properties.title");
  knownSheetTitles = new Set(
    (metadata.sheets || [])
      .map((sheet) => sheet.properties?.title)
      .filter(Boolean)
  );

  return knownSheetTitles;
}

async function ensureSheetExists(sheetName) {
  const titles = await loadSheetTitles();
  if (titles.has(sheetName)) {
    return;
  }

  await sheetsRequest(":batchUpdate", {
    method: "POST",
    body: JSON.stringify({
      requests: [
        {
          addSheet: {
            properties: {
              title: sheetName
            }
          }
        }
      ]
    })
  });

  titles.add(sheetName);
}

async function ensureHeaderRow(sheetName) {
  const encodedRange = encodeURIComponent(`${sheetName}!A1:M1`);
  const result = await sheetsRequest(`/values/${encodedRange}`);
  const currentHeader = result.values?.[0] || [];
  const isExpectedHeader = SHEET_HEADERS.every((header, index) => currentHeader[index] === header);

  if (isExpectedHeader) {
    return;
  }

  await sheetsRequest(`/values/${encodedRange}?valueInputOption=RAW`, {
    method: "PUT",
    body: JSON.stringify({
      range: `${sheetName}!A1:M1`,
      majorDimension: "ROWS",
      values: [SHEET_HEADERS]
    })
  });
}

async function ensureSheetReady(assetType) {
  const { sheetName } = getAssetMeta(assetType);
  if (readySheets.has(sheetName)) {
    return sheetName;
  }

  await ensureSheetExists(sheetName);
  await ensureHeaderRow(sheetName);
  readySheets.add(sheetName);
  return sheetName;
}

async function listExistingIdsForSheet(sheetName) {
  const encodedRange = encodeURIComponent(`${sheetName}!A2:A`);
  const result = await sheetsRequest(`/values/${encodedRange}`);
  const rows = result.values || [];

  return rows
    .map((row) => String(row[0] || "").trim().toUpperCase())
    .filter(Boolean);
}

async function buildUniqueEntryId(preferredId = "") {
  await Promise.all(Object.keys(ASSET_TYPE_META).map((assetType) => ensureSheetReady(assetType)));
  const sheetNames = Object.values(ASSET_TYPE_META).map((meta) => meta.sheetName);
  const existingIdGroups = await Promise.all(sheetNames.map((sheetName) => listExistingIdsForSheet(sheetName)));
  const existingIds = new Set(existingIdGroups.flat());
  const normalizedPreferredId = String(preferredId || "").trim().toUpperCase();

  if (normalizedPreferredId && !existingIds.has(normalizedPreferredId)) {
    return normalizedPreferredId;
  }

  for (let attempt = 0; attempt < ENTRY_ID_RETRY_LIMIT; attempt += 1) {
    const candidate = buildEntryId();
    if (!existingIds.has(candidate)) {
      return candidate;
    }
  }

  throw new Error("編號重複次數過多，請再試一次。");
}

async function buildEntryRow(assetType, payload, preferredId = "") {
  const meta = getAssetMeta(assetType);
  const entryId = await buildUniqueEntryId(preferredId);

  return [
    entryId,
    isoNow(),
    meta.label,
    trimMultilineText(payload.title),
    trimMultilineText(payload.promptText),
    trimMultilineText(payload.tags),
    trimMultilineText(payload.notes),
    "",
    "",
    meta.mimeType,
    "false",
    String(Boolean(payload.favorite)),
    "active"
  ];
}

function mapRowToEntry(row) {
  return {
    id: row[0] || "",
    createdAt: row[1] || "",
    assetType: row[2] || "",
    title: row[3] || "",
    promptText: row[4] || "",
    tags: row[5] || "",
    notes: row[6] || "",
    favorite: row[11] || "false",
    status: row[12] || ""
  };
}

export async function prepareDraftEntry(assetType) {
  await ensureSheetReady(assetType);
  return {
    entryId: buildEntryId()
  };
}

export async function saveEntry(assetType, payload) {
  const sheetName = await ensureSheetReady(assetType);
  const row = await buildEntryRow(assetType, payload, payload.entryId);
  const encodedRange = encodeURIComponent(`${sheetName}!A:M`);
  const result = await sheetsRequest(
    `/values/${encodedRange}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      body: JSON.stringify({
        majorDimension: "ROWS",
        values: [row]
      })
    }
  );

  const updatedRange = result.updates?.updatedRange || "";
  return {
    sheetName,
    rowNumber: extractRowNumber(updatedRange) || "未知",
    entryId: row[0]
  };
}

export async function listRecentEntries(assetType, limit = 5) {
  const sheetName = await ensureSheetReady(assetType);
  const encodedRange = encodeURIComponent(`${sheetName}!A2:M`);
  const result = await sheetsRequest(`/values/${encodedRange}`);
  const rows = result.values || [];

  return rows
    .slice(Math.max(rows.length - limit, 0))
    .reverse()
    .map(mapRowToEntry);
}
