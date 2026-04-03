import { listRecentEntries, prepareDraftEntry, saveEntry } from "./services/sheets.js";

const ASSET_TYPE_LABEL = {
  video: "影片",
  image: "圖片",
  text: "文字"
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  void handleMessage(message)
    .then((result) => sendResponse({ ok: true, ...result }))
    .catch((error) => {
      console.error("LPAV 背景訊息處理失敗", error);
      sendResponse({ ok: false, error: error.message || "背景處理失敗" });
    });

  return true;
});

function downloadFile(options) {
  return new Promise((resolve, reject) => {
    chrome.downloads.download(options, (downloadId) => {
      const lastError = chrome.runtime.lastError;
      if (lastError) {
        reject(new Error(lastError.message || "建立下載資料夾失敗"));
        return;
      }

      resolve(downloadId);
    });
  });
}

async function createDownloadFolder(entryId, assetType) {
  const normalizedEntryId = String(entryId || "").trim().toUpperCase();
  if (!normalizedEntryId) {
    throw new Error("目前沒有可用編號，請先等待編號生成。");
  }

  const label = ASSET_TYPE_LABEL[assetType] || "資產";
  const fileName = `${normalizedEntryId}/LPAV-${normalizedEntryId}.txt`;
  const fileBody = [
    `LPAV 編號：${normalizedEntryId}`,
    `資產類型：${label}`,
    "這個資料夾是由 LPAV 建立，用來放這筆資產的本機素材、參考圖和輸出檔。"
  ].join("\n");
  const downloadUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(fileBody)}`;
  const downloadId = await downloadFile({
    url: downloadUrl,
    filename: fileName,
    conflictAction: "overwrite",
    saveAs: false
  });

  return {
    downloadId,
    relativePath: fileName
  };
}

async function handleMessage(message) {
  if (!message?.type) {
    throw new Error("缺少訊息類型。");
  }

  switch (message.type) {
    case "lpav:prepareDraft":
      return prepareDraftEntry(message.payload.assetType);
    case "lpav:saveEntry":
      return saveEntry(message.payload.assetType, message.payload.formData);
    case "lpav:listRecentEntries":
      return { entries: await listRecentEntries(message.payload.assetType, 5) };
    case "lpav:createDownloadFolder":
      return createDownloadFolder(message.payload.entryId, message.payload.assetType);
    default:
      throw new Error(`不支援的訊息類型：${message.type}`);
  }
}
