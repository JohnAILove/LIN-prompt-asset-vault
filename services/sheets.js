import { LPAV_CONFIG } from "./config.local.js";
import { getAccessToken } from "./googleAuth.js";
import { buildEntryId, extractRowNumber, isoNow, trimMultilineText } from "./helpers.js";

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

async function sheetsRequest(path, options = {}) {
  const accessToken = await getAccessToken();
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${LPAV_CONFIG.spreadsheet.spreadsheetId}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=utf-8",
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Sheet API 失敗：${errorText}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function ensureSheetExists(sheetName) {
  const metadata = await sheetsRequest("?fields=sheets.properties.title");
  const exists = metadata.sheets?.some((sheet) => sheet.properties?.title === sheetName);

  if (exists) {
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

async function ensureTextSheetReady() {
  const sheetName = LPAV_CONFIG.spreadsheet.textSheetName;
  await ensureSheetExists(sheetName);
  await ensureHeaderRow(sheetName);
  return sheetName;
}

function buildTextRow(payload) {
  return [
    buildEntryId(),
    isoNow(),
    "text",
    trimMultilineText(payload.title),
    trimMultilineText(payload.promptText),
    trimMultilineText(payload.tags),
    trimMultilineText(payload.notes),
    "",
    "",
    "text/plain",
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

export async function saveTextEntry(payload) {
  const sheetName = await ensureTextSheetReady();
  const encodedRange = encodeURIComponent(`${sheetName}!A:M`);
  const result = await sheetsRequest(`/values/${encodedRange}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
    method: "POST",
    body: JSON.stringify({
      majorDimension: "ROWS",
      values: [buildTextRow(payload)]
    })
  });

  const updatedRange = result.updates?.updatedRange || "";
  return {
    sheetName,
    rowNumber: extractRowNumber(updatedRange) || "未知"
  };
}

export async function listRecentEntries(limit = 5) {
  const sheetName = await ensureTextSheetReady();
  const encodedRange = encodeURIComponent(`${sheetName}!A2:M`);
  const result = await sheetsRequest(`/values/${encodedRange}`);
  const rows = result.values || [];

  return rows
    .slice(Math.max(rows.length - limit, 0))
    .reverse()
    .map(mapRowToEntry);
}
