import { listRecentEntries, saveTextEntry } from "./services/sheets.js";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  void handleMessage(message)
    .then((result) => sendResponse({ ok: true, ...result }))
    .catch((error) => {
      console.error("LPAV 背景服務錯誤", error);
      sendResponse({ ok: false, error: error.message || "背景服務處理失敗。" });
    });

  return true;
});

async function handleMessage(message) {
  if (!message?.type) {
    throw new Error("缺少訊息類型。");
  }

  switch (message.type) {
    case "lpav:saveTextEntry":
      return saveTextEntry(message.payload);
    case "lpav:listRecentEntries":
      return { entries: await listRecentEntries(5) };
    default:
      throw new Error(`不支援的訊息類型：${message.type}`);
  }
}
