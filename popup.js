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
const draftEntryId = document.getElementById("draftEntryId");
const createFolderButton = document.getElementById("createFolderButton");
const refreshDraftIdButton = document.getElementById("refreshDraftIdButton");
const assetForm = document.getElementById("assetForm");
const saveButton = document.getElementById("saveButton");
const resetButton = document.getElementById("resetButton");
const refreshButton = document.getElementById("refreshButton");
const recentList = document.getElementById("recentList");
const assetTypeButtons = Array.from(document.querySelectorAll("[data-asset-type]"));

const ASSET_META = {
  video: {
    label: "影片",
    heroCopy: "先為影片資產配好草稿編號，再開始整理提示詞、素材與備註。",
    statusReady: "影片草稿已就緒，可以開始整理這筆素材。",
    assetTypeTip: "預設先做影片分頁",
    composeTitle: "新增影片資產",
    sheetTip: "寫入 Google Sheet 的「影片」分頁",
    titleLabel: "標題",
    titlePlaceholder: "例如：藍色能量流動短片概念",
    promptLabel: "影片概念 / Prompt",
    promptPlaceholder: "直接貼上影片提示詞、分鏡描述或生成概念",
    tagsPlaceholder: "轉場, 動態, 光感",
    notesPlaceholder: "補充參考來源、鏡頭節奏、版本差異",
    recentTitle: "最近 5 筆影片"
  },
  image: {
    label: "圖片",
    heroCopy: "先為圖片資產配好草稿編號，再開始整理構圖、風格和版本備註。",
    statusReady: "圖片草稿已就緒，可以開始整理這筆素材。",
    assetTypeTip: "切到圖片分頁也會先配編號",
    composeTitle: "新增圖片資產",
    sheetTip: "寫入 Google Sheet 的「圖片」分頁",
    titleLabel: "標題",
    titlePlaceholder: "例如：冷色金屬感主視覺",
    promptLabel: "圖片概念 / Prompt",
    promptPlaceholder: "直接貼上圖片提示詞、風格描述或構圖說明",
    tagsPlaceholder: "排版, 材質, 視覺",
    notesPlaceholder: "補充靈感來源、構圖版本、延伸方向",
    recentTitle: "最近 5 筆圖片"
  },
  text: {
    label: "文字",
    heroCopy: "先為文字資產配好草稿編號，再開始整理 prompt、結構與補充筆記。",
    statusReady: "文字草稿已就緒，可以開始整理這筆素材。",
    assetTypeTip: "切到文字分頁也會先配編號",
    composeTitle: "新增文字資產",
    sheetTip: "寫入 Google Sheet 的「文字」分頁",
    titleLabel: "標題",
    titlePlaceholder: "例如：冷色金屬感主視覺提示詞",
    promptLabel: "Prompt 內容",
    promptPlaceholder: "直接貼上你要收藏的 prompt 或文字素材",
    tagsPlaceholder: "語氣, 視覺, 結構",
    notesPlaceholder: "補充使用情境、版本差異、延伸方向",
    recentTitle: "最近 5 筆文字"
  }
};

const state = {
  assetType: "video",
  draftIds: {}
};

function setStatus(message, status = "idle") {
  statusBanner.textContent = message;
  statusBanner.dataset.state = status;
}

function setBusy(isBusy) {
  saveButton.disabled = isBusy;
  resetButton.disabled = isBusy;
  refreshButton.disabled = isBusy;
  createFolderButton.disabled = isBusy;
  refreshDraftIdButton.disabled = isBusy;

  assetTypeButtons.forEach((button) => {
    button.disabled = isBusy;
  });
}

function getFormPayload() {
  const formData = new FormData(assetForm);
  return {
    entryId: state.draftIds[state.assetType] || "",
    title: String(formData.get("title") || "").trim(),
    promptText: String(formData.get("promptText") || "").trim(),
    tags: String(formData.get("tags") || "").trim(),
    notes: String(formData.get("notes") || "").trim(),
    favorite: String(formData.get("favorite") || "false") === "true"
  };
}

function setDraftEntryId(entryId = "") {
  state.draftIds[state.assetType] = entryId;
  draftEntryId.textContent = entryId || "準備中";
}

function renderRecentEntries(entries) {
  recentList.innerHTML = "";

  if (!entries.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "目前還沒有資料，先存第一筆看看。";
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
    title.textContent = entry.id || entry.title || "未命名資料";

    const meta = document.createElement("span");
    meta.className = "recent-meta";
    meta.textContent = [entry.title, entry.createdAt, entry.tags].filter(Boolean).join(" ｜ ");

    const prompt = document.createElement("p");
    prompt.className = "recent-prompt";
    prompt.textContent = entry.promptText || "沒有提示詞內容";

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
  recentTip.textContent = "會即時從試算表抓目前分頁";
  titleInput.placeholder = meta.titlePlaceholder;
  promptInput.placeholder = meta.promptPlaceholder;
  tagsInput.placeholder = meta.tagsPlaceholder;
  notesInput.placeholder = meta.notesPlaceholder;
  createFolderButton.textContent = "建立資料夾";
  refreshDraftIdButton.textContent = "換編號";
  draftEntryId.textContent = state.draftIds[assetType] || "準備中";

  assetTypeButtons.forEach((button) => {
    const isActive = button.dataset.assetType === assetType;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
}

async function ensureDraftEntryId(force = false) {
  if (!force && state.draftIds[state.assetType]) {
    draftEntryId.textContent = state.draftIds[state.assetType];
    return state.draftIds[state.assetType];
  }

  draftEntryId.textContent = "準備中";
  const response = await sendMessage("lpav:prepareDraft", {
    assetType: state.assetType
  });

  if (!response?.ok || !response.entryId) {
    throw new Error(response?.error || "草稿編號建立失敗");
  }

  setDraftEntryId(response.entryId);
  return response.entryId;
}

async function refreshRecentEntries() {
  setStatus(`正在刷新最近 5 筆${ASSET_META[state.assetType].label}資料。`, "loading");

  const response = await sendMessage("lpav:listRecentEntries", {
    assetType: state.assetType
  });

  if (!response?.ok) {
    throw new Error(response?.error || "最近資料讀取失敗");
  }

  renderRecentEntries(response.entries || []);
}

async function hydrateCurrentAssetType(forceDraft = false) {
  await ensureDraftEntryId(forceDraft);
  await refreshRecentEntries();
  setStatus(`已準備 ${ASSET_META[state.assetType].label} 草稿編號 ${state.draftIds[state.assetType]}。`, "success");
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
      await hydrateCurrentAssetType();
    } catch (error) {
      setStatus(error.message || "分頁切換失敗", "error");
    } finally {
      setBusy(false);
    }
  });
});

assetForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = getFormPayload();

  if (!formData.title || !formData.promptText) {
    setStatus("標題和 Prompt 內容都要填。", "error");
    return;
  }

  if (!formData.entryId) {
    setStatus("目前編號還沒準備好，請稍後再試。", "error");
    return;
  }

  setBusy(true);
  setStatus(`正在寫入 ${ASSET_META[state.assetType].label} 資產。`, "loading");

  try {
    const response = await sendMessage("lpav:saveEntry", {
      assetType: state.assetType,
      formData
    });

    if (!response?.ok) {
      throw new Error(response?.error || "寫入失敗");
    }

    assetForm.reset();
    delete state.draftIds[state.assetType];
    await hydrateCurrentAssetType(true);
    setStatus(`已寫入 ${response.sheetName} 第 ${response.rowNumber} 列，編號 ${response.entryId}。`, "success");
  } catch (error) {
    setStatus(error.message || "寫入失敗", "error");
  } finally {
    setBusy(false);
  }
});

createFolderButton.addEventListener("click", async () => {
  setBusy(true);
  try {
    const entryId = await ensureDraftEntryId();
    const response = await sendMessage("lpav:createDownloadFolder", {
      assetType: state.assetType,
      entryId
    });

    if (!response?.ok) {
      throw new Error(response?.error || "建立下載資料夾失敗");
    }

    setStatus(`已在下載資料夾建立 ${entryId}。`, "success");
  } catch (error) {
    setStatus(error.message || "建立下載資料夾失敗", "error");
  } finally {
    setBusy(false);
  }
});

refreshDraftIdButton.addEventListener("click", async () => {
  setBusy(true);
  try {
    const nextId = await ensureDraftEntryId(true);
    setStatus(`已改成新的草稿編號 ${nextId}。`, "success");
  } catch (error) {
    setStatus(error.message || "換編號失敗", "error");
  } finally {
    setBusy(false);
  }
});

resetButton.addEventListener("click", () => {
  assetForm.reset();
  setStatus(`已清空表單，保留草稿編號 ${state.draftIds[state.assetType] || "未建立"}。`, "idle");
});

refreshButton.addEventListener("click", async () => {
  setBusy(true);
  try {
    await hydrateCurrentAssetType();
  } catch (error) {
    setStatus(error.message || "刷新失敗", "error");
  } finally {
    setBusy(false);
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  applyAssetTypeUI(state.assetType);
  setBusy(true);
  try {
    await hydrateCurrentAssetType();
  } catch (error) {
    setStatus(error.message || "初始化失敗", "error");
  } finally {
    setBusy(false);
  }
});
