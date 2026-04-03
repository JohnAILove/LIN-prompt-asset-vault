import { listRecentEntries, prepareDraftEntry, saveEntry } from "./services/sheets.js";

const ASSET_TYPE_LABEL = {
  video: "影片",
  image: "圖片",
  text: "文字"
};

const YOUTUBE_HELPER_BASE_URL = "http://127.0.0.1:8765";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  void handleMessage(message)
    .then((result) => sendResponse({ ok: true, ...result }))
    .catch((error) => {
      console.error("LPAV 背景訊息處理失敗", error);
      sendResponse({ ok: false, error: error.message || "背景處理失敗" });
    });

  return true;
});

async function helperRequest(path, options = {}) {
  let response;

  try {
    response = await fetch(`${YOUTUBE_HELPER_BASE_URL}${path}`, options);
  } catch (error) {
    throw new Error("YouTube helper 未啟動，請先執行 scripts/start_youtube_helper.ps1。");
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : { ok: response.ok, error: await response.text() };

  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || "YouTube helper 執行失敗。");
  }

  return payload;
}

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

async function getYouTubeAuthStatus() {
  const payload = await helperRequest("/auth/status");
  return {
    authorized: Boolean(payload.authorized)
  };
}

async function startYouTubeAuth() {
  const payload = await helperRequest("/auth/start", {
    method: "POST"
  });

  return {
    authorized: Boolean(payload.authorized)
  };
}

async function uploadVideoToYouTube(payload) {
  const fileBytes = payload.fileBytes || [];
  const byteArray = fileBytes instanceof Uint8Array ? fileBytes : Uint8Array.from(fileBytes);
  const blob = new Blob([byteArray], { type: payload.mimeType || "video/mp4" });
  const formData = new FormData();

  formData.append("video", blob, payload.fileName || "upload.mp4");
  formData.append("title", payload.title || "LPAV Upload");
  formData.append("description", payload.description || "");
  formData.append("privacyStatus", payload.privacyStatus || "private");
  formData.append("tagsJson", JSON.stringify(payload.tags || []));

  const response = await helperRequest("/upload", {
    method: "POST",
    body: formData
  });

  return {
    videoId: response.videoId,
    youtubeUrl: response.youtubeUrl,
    privacyStatus: response.privacyStatus,
    title: response.title
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
    case "lpav:youtubeAuthStatus":
      return getYouTubeAuthStatus();
    case "lpav:youtubeAuthStart":
      return startYouTubeAuth();
    case "lpav:youtubeUpload":
      return uploadVideoToYouTube(message.payload);
    default:
      throw new Error(`不支援的訊息類型：${message.type}`);
  }
}
