const statusBanner = document.getElementById("statusBanner");
const assetForm = document.getElementById("assetForm");
const saveButton = document.getElementById("saveButton");
const resetButton = document.getElementById("resetButton");
const refreshButton = document.getElementById("refreshButton");
const recentList = document.getElementById("recentList");

function setStatus(message, state = "idle") {
  statusBanner.textContent = message;
  statusBanner.dataset.state = state;
}

function setBusy(isBusy) {
  saveButton.disabled = isBusy;
  resetButton.disabled = isBusy;
  refreshButton.disabled = isBusy;
}

function getFormPayload() {
  const formData = new FormData(assetForm);
  return {
    title: String(formData.get("title") || "").trim(),
    promptText: String(formData.get("promptText") || "").trim(),
    tags: String(formData.get("tags") || "").trim(),
    notes: String(formData.get("notes") || "").trim(),
    favorite: String(formData.get("favorite") || "false") === "true"
  };
}

function renderRecentEntries(entries) {
  recentList.innerHTML = "";

  if (!entries.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "目前還沒有資料，先新增第一筆。";
    recentList.append(empty);
    return;
  }

  const fragment = document.createDocumentFragment();

  entries.forEach((entry) => {
    const card = document.createElement("article");
    card.className = "recent-card";

    const head = document.createElement("div");
    head.className = "recent-head";

    const title = document.createElement("h3");
    title.className = "recent-title";
    title.textContent = entry.title || "未命名資料";

    const meta = document.createElement("span");
    meta.className = "recent-meta";
    meta.textContent = `${entry.createdAt || "未知時間"}${entry.tags ? ` ｜ ${entry.tags}` : ""}`;

    head.append(title, meta);

    const prompt = document.createElement("p");
    prompt.className = "recent-prompt";
    prompt.textContent = entry.promptText || "沒有 prompt 內容";

    card.append(head, prompt);

    if (entry.notes) {
      const notes = document.createElement("p");
      notes.className = "recent-notes";
      notes.textContent = `備註：${entry.notes}`;
      card.append(notes);
    }

    fragment.append(card);
  });

  recentList.append(fragment);
}

function sendMessage(type, payload = {}) {
  return chrome.runtime.sendMessage({ type, payload });
}

async function refreshRecentEntries() {
  setStatus("正在讀取最近資料。", "loading");

  const response = await sendMessage("lpav:listRecentEntries");
  if (!response?.ok) {
    throw new Error(response?.error || "讀取最近資料失敗。");
  }

  renderRecentEntries(response.entries);
  setStatus("已更新最近 5 筆資料。", "success");
}

assetForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = getFormPayload();

  if (!payload.title || !payload.promptText) {
    setStatus("標題與 Prompt 內容都必填。", "error");
    return;
  }

  setBusy(true);
  setStatus("正在寫入 Google Sheet。", "loading");

  try {
    const response = await sendMessage("lpav:saveTextEntry", payload);
    if (!response?.ok) {
      throw new Error(response?.error || "寫入失敗。");
    }

    assetForm.reset();
    await refreshRecentEntries();
    setStatus(`已寫入 ${response.sheetName} 分頁，第 ${response.rowNumber} 列。`, "success");
  } catch (error) {
    setStatus(error.message || "寫入失敗。", "error");
  } finally {
    setBusy(false);
  }
});

resetButton.addEventListener("click", () => {
  assetForm.reset();
  setStatus("表單已清空。", "idle");
});

refreshButton.addEventListener("click", async () => {
  setBusy(true);
  try {
    await refreshRecentEntries();
  } catch (error) {
    setStatus(error.message || "讀取最近資料失敗。", "error");
  } finally {
    setBusy(false);
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  setBusy(true);
  try {
    await refreshRecentEntries();
  } catch (error) {
    setStatus(error.message || "初始化失敗。", "error");
  } finally {
    setBusy(false);
  }
});
