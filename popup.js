const statusBanner = document.getElementById("statusBanner");
const heroCopy = document.getElementById("heroCopy");
const assetTypeTip = document.getElementById("assetTypeTip");
const composeTitle = document.getElementById("composeTitle");
const sheetTip = document.getElementById("sheetTip");
const titleLabel = document.getElementById("titleLabel");
const promptLabel = document.getElementById("promptLabel");
const tagsLabel = document.getElementById("tagsLabel");
const recentTitle = document.getElementById("recentTitle");
const recentTip = document.getElementById("recentTip");
const titleInput = document.getElementById("title");
const promptInput = document.getElementById("promptText");
const tagsInput = document.getElementById("tags");
const notesInput = document.getElementById("notes");
const assetForm = document.getElementById("assetForm");
const saveButton = document.getElementById("saveButton");
const resetButton = document.getElementById("resetButton");
const refreshButton = document.getElementById("refreshButton");
const recentList = document.getElementById("recentList");
const assetTypeButtons = Array.from(document.querySelectorAll("[data-asset-type]"));

const ASSET_META = {
  video: {
    label: "影片",
    heroCopy: "先把影片資產流程做順，讓概念、提示詞與備註先進對應分頁。",
    statusReady: "已就緒，預設準備寫入影片資產。",
    assetTypeTip: "預設先看影片分頁",
    composeTitle: "新增影片資產",
    sheetTip: "儲存到「影片」分頁",
    titleLabel: "標題",
    titlePlaceholder: "例如：藍色能量流動短片概念",
    promptLabel: "影片概念 / Prompt",
    promptPlaceholder: "把影片概念、鏡頭描述、節奏或生成提示貼進來",
    tagsPlaceholder: "轉場, 動態, 光感",
    notesPlaceholder: "補充畫面節奏、靈感來源、版本差異",
    recentTitle: "最近 5 筆影片"
  },
  image: {
    label: "圖片",
    heroCopy: "圖片分頁適合先收主視覺、構圖方向、材質語言和生成提示。",
    statusReady: "已就緒，準備寫入圖片資產。",
    assetTypeTip: "可切到圖片分頁整理靜態視覺",
    composeTitle: "新增圖片資產",
    sheetTip: "儲存到「圖片」分頁",
    titleLabel: "標題",
    titlePlaceholder: "例如：霧面金屬海報主視覺",
    promptLabel: "圖片概念 / Prompt",
    promptPlaceholder: "把構圖、風格、材質、生成提示貼進來",
    tagsPlaceholder: "材質, 排版, 構圖",
    notesPlaceholder: "補充配色方向、靈感來源、延伸做法",
    recentTitle: "最近 5 筆圖片"
  },
  text: {
    label: "文字",
    heroCopy: "文字分頁適合收關鍵提示詞、筆記片段與語意方向。",
    statusReady: "已就緒，準備寫入文字資產。",
    assetTypeTip: "可切到文字分頁整理 prompt",
    composeTitle: "新增文字資產",
    sheetTip: "儲存到「文字」分頁",
    titleLabel: "標題",
    titlePlaceholder: "例如：冷色金屬感主視覺提示詞",
    promptLabel: "文字內容 / Prompt",
    promptPlaceholder: "把你真正要存的提示詞貼進來",
    tagsPlaceholder: "排版, 材質, 視覺",
    notesPlaceholder: "補充靈感來源、版本差異、延伸方向",
    recentTitle: "最近 5 筆文字"
  }
};

const state = {
  assetType: "video"
};

function setStatus(message, status = "idle") {
  statusBanner.textContent = message;
  statusBanner.dataset.state = status;
}

function setBusy(isBusy) {
  saveButton.disabled = isBusy;
  resetButton.disabled = isBusy;
  refreshButton.disabled = isBusy;
  assetTypeButtons.forEach((button) => {
    button.disabled = isBusy;
  });
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

    const prompt = document.createElement("p");
    prompt.className = "recent-prompt";
    prompt.textContent = entry.promptText || "沒有內容";

    head.append(title, meta);
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
  return chrome.runtime.sendMessage({ type, payload }).catch((error) => {
    const message = String(error?.message || error || "");
    if (message.includes("Extension context invalidated")) {
      throw new Error("擴充功能剛更新，請重新打開這個視窗後再試一次。");
    }

    throw error;
  });
}

function applyAssetTypeUI(assetType) {
  const meta = ASSET_META[assetType];
  if (!meta) {
    return;
  }

  state.assetType = assetType;
  heroCopy.textContent = meta.heroCopy;
  assetTypeTip.textContent = meta.assetTypeTip;
  composeTitle.textContent = meta.composeTitle;
  sheetTip.textContent = meta.sheetTip;
  titleLabel.textContent = meta.titleLabel;
  promptLabel.textContent = meta.promptLabel;
  tagsLabel.textContent = "標籤";
  recentTitle.textContent = meta.recentTitle;
  recentTip.textContent = "從 Google Sheet 即時讀取目前分頁";
  titleInput.placeholder = meta.titlePlaceholder;
  promptInput.placeholder = meta.promptPlaceholder;
  tagsInput.placeholder = meta.tagsPlaceholder;
  notesInput.placeholder = meta.notesPlaceholder;

  assetTypeButtons.forEach((button) => {
    const isActive = button.dataset.assetType === assetType;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
}

async function refreshRecentEntries() {
  setStatus(`正在讀取${ASSET_META[state.assetType].label}最近資料。`, "loading");

  const response = await sendMessage("lpav:listRecentEntries", {
    assetType: state.assetType
  });

  if (!response?.ok) {
    throw new Error(response?.error || "讀取最近資料失敗。");
  }

  renderRecentEntries(response.entries || []);
  setStatus(`已更新最近 5 筆${ASSET_META[state.assetType].label}資料。`, "success");
}

assetTypeButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const nextType = button.dataset.assetType;
    if (!nextType || nextType === state.assetType) {
      return;
    }

    applyAssetTypeUI(nextType);
    setBusy(true);
    try {
      await refreshRecentEntries();
    } catch (error) {
      setStatus(error.message || "切換分頁後讀取失敗。", "error");
    } finally {
      setBusy(false);
    }
  });
});

assetForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = getFormPayload();

  if (!formData.title || !formData.promptText) {
    setStatus("標題與內容都必填。", "error");
    return;
  }

  setBusy(true);
  setStatus(`正在寫入${ASSET_META[state.assetType].label}資料。`, "loading");

  try {
    const response = await sendMessage("lpav:saveEntry", {
      assetType: state.assetType,
      formData
    });
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
  setStatus(ASSET_META[state.assetType].statusReady, "idle");
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
  applyAssetTypeUI(state.assetType);
  setStatus(ASSET_META[state.assetType].statusReady, "idle");
  setBusy(true);
  try {
    await refreshRecentEntries();
  } catch (error) {
    setStatus(error.message || "初始化失敗。", "error");
  } finally {
    setBusy(false);
  }
});
