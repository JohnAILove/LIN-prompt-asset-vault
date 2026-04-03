(() => {
  const ROOT_ID = "lpav-floating-root";
  const STORAGE_KEY = "lpavFloatingTop";
  const DEFAULT_TOP = 180;
  const SAFE_MARGIN = 20;
  const RIGHT_OFFSET = 2;
  const BADGE_IMAGE_URL = chrome.runtime.getURL("assets/badge-lightning.png");

  const ASSET_META = {
    video: {
      label: "影片",
      composeTitle: "新增影片資產",
      sheetTip: "寫入 Google Sheet 的「影片」分頁",
      statusReady: "影片草稿已就緒，可以開始整理這筆素材。",
      titlePlaceholder: "例如：藍色能量流動短片概念",
      promptLabel: "影片概念 / Prompt",
      promptPlaceholder: "直接貼上影片提示詞、分鏡描述或生成概念",
      tagsPlaceholder: "轉場, 動態, 光感",
      notesPlaceholder: "補充參考來源、鏡頭節奏、版本差異",
      recentTitle: "最近 5 筆影片"
    },
    image: {
      label: "圖片",
      composeTitle: "新增圖片資產",
      sheetTip: "寫入 Google Sheet 的「圖片」分頁",
      statusReady: "圖片草稿已就緒，可以開始整理這筆素材。",
      titlePlaceholder: "例如：冷色金屬感主視覺",
      promptLabel: "圖片概念 / Prompt",
      promptPlaceholder: "直接貼上圖片提示詞、風格描述或構圖說明",
      tagsPlaceholder: "排版, 材質, 視覺",
      notesPlaceholder: "補充靈感來源、構圖版本、延伸方向",
      recentTitle: "最近 5 筆圖片"
    },
    text: {
      label: "文字",
      composeTitle: "新增文字資產",
      sheetTip: "寫入 Google Sheet 的「文字」分頁",
      statusReady: "文字草稿已就緒，可以開始整理這筆素材。",
      titlePlaceholder: "例如：冷色金屬感主視覺提示詞",
      promptLabel: "Prompt 內容",
      promptPlaceholder: "直接貼上你要收藏的 prompt 或文字素材",
      tagsPlaceholder: "語氣, 視覺, 結構",
      notesPlaceholder: "補充使用情境、版本差異、延伸方向",
      recentTitle: "最近 5 筆文字"
    }
  };

  if (window.top !== window.self) {
    return;
  }

  if (document.getElementById(ROOT_ID)) {
    return;
  }

  const host = document.createElement("div");
  host.id = ROOT_ID;
  host.style.position = "fixed";
  host.style.right = `${RIGHT_OFFSET}px`;
  host.style.top = `${DEFAULT_TOP}px`;
  host.style.zIndex = "2147483647";
  host.style.pointerEvents = "auto";

  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <style>
      :host {
        all: initial;
      }

      .lpav-dock {
        position: relative;
        font-family: "Noto Sans TC", "Microsoft JhengHei", sans-serif;
      }

      .lpav-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
        padding: 4px;
        border: none;
        border-radius: 14px;
        background: linear-gradient(180deg, rgba(11, 15, 21, 0.98), rgba(19, 24, 32, 0.98));
        box-shadow: 0 18px 34px rgba(0, 0, 0, 0.42);
        cursor: grab;
        user-select: none;
        -webkit-user-select: none;
        overflow: hidden;
        transition: transform 140ms ease, box-shadow 140ms ease;
      }

      .lpav-badge:active {
        cursor: grabbing;
      }

      .lpav-badge:hover {
        transform: translateX(-2px);
        box-shadow: 0 22px 42px rgba(0, 0, 0, 0.5);
      }

      .lpav-badge-image {
        display: block;
        width: 100%;
        height: 100%;
        border-radius: 10px;
        background-image: url("${BADGE_IMAGE_URL}");
        background-repeat: no-repeat;
        background-position: center;
        background-size: contain;
        pointer-events: none;
      }

      .lpav-badge-glow {
        position: absolute;
        inset: 4px;
        border-radius: 10px;
        box-shadow: 0 6px 12px rgba(34, 193, 255, 0.06);
        pointer-events: none;
      }

      .lpav-panel {
        position: absolute;
        top: -8px;
        right: calc(100% + 14px);
        width: min(360px, calc(100vw - 72px));
        max-height: min(78vh, 760px);
        overflow: auto;
        border: 1px solid rgba(120, 138, 168, 0.14);
        border-radius: 22px;
        background:
          radial-gradient(circle at top left, rgba(34, 193, 255, 0.14), transparent 32%),
          radial-gradient(circle at bottom right, rgba(95, 48, 255, 0.14), transparent 28%),
          linear-gradient(160deg, rgba(8, 11, 17, 0.98), rgba(14, 18, 26, 0.98));
        box-shadow: 0 24px 56px rgba(0, 0, 0, 0.48);
        color: #f5f7fb;
        backdrop-filter: blur(14px);
      }

      .lpav-panel[hidden] {
        display: none;
      }

      .lpav-head {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 10px;
        padding: 12px 14px 0;
      }

      .lpav-head-copy {
        flex: 1;
        min-height: 36px;
        display: flex;
        align-items: center;
        cursor: grab;
        user-select: none;
        -webkit-user-select: none;
      }

      .lpav-head-copy:active {
        cursor: grabbing;
      }

      .lpav-drag-pill {
        width: 68px;
        height: 6px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.12);
      }

      .lpav-close {
        width: 36px;
        height: 36px;
        border: none;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.08);
        color: #f5f7fb;
        font-size: 20px;
        cursor: pointer;
      }

      .lpav-body {
        display: grid;
        gap: 14px;
        padding: 14px 16px 16px;
      }

      .lpav-status {
        border-radius: 14px;
        padding: 10px 12px;
        background: rgba(255, 255, 255, 0.06);
        color: #f5f7fb;
        font-size: 13px;
        line-height: 1.5;
      }

      .lpav-status[data-state="loading"] {
        background: rgba(34, 193, 255, 0.14);
        color: #7ad7ff;
      }

      .lpav-status[data-state="success"] {
        background: rgba(54, 211, 153, 0.12);
        color: #36d399;
      }

      .lpav-status[data-state="error"] {
        background: rgba(255, 107, 129, 0.12);
        color: #ff6b81;
      }

      .lpav-card {
        display: grid;
        gap: 12px;
        padding: 14px;
        border: 1px solid rgba(120, 138, 168, 0.12);
        border-radius: 18px;
        background: rgba(17, 22, 30, 0.88);
      }

      .lpav-card-head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
      }

      .lpav-card-head h3 {
        margin: 0;
        font-size: 15px;
      }

      .lpav-tip {
        color: #9da8bb;
        font-size: 11px;
      }

      .lpav-tab-row {
        display: grid;
        gap: 10px;
        grid-template-columns: repeat(3, 1fr);
      }

      .lpav-tab {
        min-height: 40px;
        border: none;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.08);
        color: #9da8bb;
        font-weight: 700;
        cursor: pointer;
      }

      .lpav-tab[data-active="true"] {
        background: linear-gradient(135deg, #0d5e88 0%, #1bb6ff 100%);
        color: #f5fbff;
        box-shadow: 0 12px 24px rgba(27, 182, 255, 0.18);
      }

      .lpav-tab[disabled] {
        opacity: 0.72;
        cursor: wait;
      }

      .lpav-form {
        display: grid;
        gap: 12px;
      }

      .lpav-draft-row {
        display: grid;
        gap: 10px;
        grid-template-columns: minmax(0, 1fr) 132px;
        align-items: stretch;
      }

      .lpav-draft-actions {
        display: grid;
        gap: 10px;
        grid-template-rows: repeat(2, minmax(0, 1fr));
      }

      .lpav-draft-box {
        display: grid;
        gap: 4px;
        padding: 12px 14px;
        border: 1px solid rgba(120, 138, 168, 0.18);
        border-radius: 14px;
        background: rgba(10, 14, 20, 0.96);
      }

      .lpav-draft-label {
        color: #9da8bb;
        font-size: 12px;
      }

      .lpav-draft-id {
        font-size: 18px;
        line-height: 1.15;
        font-weight: 800;
        letter-spacing: 0.04em;
        color: #7ad7ff;
        white-space: nowrap;
        word-break: keep-all;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .lpav-field {
        display: grid;
        gap: 7px;
      }

      .lpav-grid {
        display: grid;
        gap: 10px;
        grid-template-columns: 1fr 110px;
      }

      .lpav-label {
        font-size: 13px;
        font-weight: 700;
      }

      .lpav-input,
      .lpav-textarea,
      .lpav-select,
      .lpav-button {
        font: inherit;
      }

      .lpav-input,
      .lpav-textarea,
      .lpav-select {
        width: 100%;
        border: 1px solid rgba(120, 138, 168, 0.18);
        border-radius: 14px;
        padding: 11px 12px;
        background: rgba(10, 14, 20, 0.96);
        color: #f5f7fb;
      }

      .lpav-input:focus,
      .lpav-textarea:focus,
      .lpav-select:focus {
        outline: none;
        border-color: #22c1ff;
        box-shadow: 0 0 0 3px rgba(34, 193, 255, 0.16);
      }

      .lpav-textarea {
        resize: vertical;
        min-height: 92px;
      }

      .lpav-action-row {
        display: grid;
        gap: 10px;
        grid-template-columns: 1.4fr 1fr 1fr;
      }

      .lpav-button {
        min-height: 42px;
        border: none;
        border-radius: 14px;
        cursor: pointer;
      }

      .lpav-button[disabled] {
        opacity: 0.72;
        cursor: wait;
      }

      .lpav-button-primary {
        background: linear-gradient(135deg, #0d5e88 0%, #1bb6ff 100%);
        color: #f5fbff;
        font-weight: 800;
        box-shadow: 0 12px 24px rgba(27, 182, 255, 0.22);
      }

      .lpav-button-ghost {
        background: rgba(255, 255, 255, 0.08);
        color: #f5f7fb;
      }

      #lpavCreateFolderButton {
        padding: 0 12px;
        font-size: 13px;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      #lpavRefreshDraftIdButton {
        padding: 0 12px;
        font-size: 13px;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .lpav-recent-list {
        display: grid;
        gap: 10px;
      }

      .lpav-empty,
      .lpav-recent-item {
        border-radius: 15px;
        border: 1px solid rgba(120, 138, 168, 0.1);
        background: rgba(9, 13, 19, 0.9);
        padding: 12px;
      }

      .lpav-empty {
        margin: 0;
        color: #9da8bb;
        font-size: 13px;
      }

      .lpav-recent-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 6px;
      }

      .lpav-recent-title {
        margin: 0;
        font-size: 14px;
        font-weight: 800;
      }

      .lpav-recent-meta {
        color: #9da8bb;
        font-size: 11px;
      }

      .lpav-recent-prompt,
      .lpav-recent-notes {
        margin: 0;
        color: #f5f7fb;
        font-size: 12px;
        line-height: 1.55;
        white-space: pre-wrap;
        word-break: break-word;
      }

      .lpav-recent-notes {
        margin-top: 8px;
        color: #9da8bb;
      }

      .lpav-youtube-panel {
        display: grid;
        gap: 12px;
      }

      .lpav-youtube-result {
        margin: 0;
        color: #9da8bb;
        font-size: 12px;
        line-height: 1.5;
        white-space: pre-wrap;
        word-break: break-word;
      }
    </style>
    <div class="lpav-dock">
      <button id="lpavBadge" class="lpav-badge" type="button" aria-label="LPAV 懸浮入口" aria-expanded="false" aria-controls="lpavPanel">
        <span class="lpav-badge-image" aria-hidden="true"></span>
        <span class="lpav-badge-glow"></span>
      </button>

      <section id="lpavPanel" class="lpav-panel" hidden>
        <header class="lpav-head">
          <div id="lpavDragHandle" class="lpav-head-copy" title="拖曳移動位置">
            <span class="lpav-drag-pill" aria-hidden="true"></span>
          </div>
          <button id="lpavCloseButton" class="lpav-close" type="button" aria-label="關閉">×</button>
        </header>

        <div class="lpav-body">
          <div id="lpavStatus" class="lpav-status" data-state="idle">影片草稿已就緒，可以開始整理這筆素材。</div>

          <section class="lpav-card">
            <div class="lpav-tab-row" role="tablist" aria-label="資產類型">
              <button class="lpav-tab" data-asset-type="video" data-active="true" aria-selected="true" type="button">影片</button>
              <button class="lpav-tab" data-asset-type="image" data-active="false" aria-selected="false" type="button">圖片</button>
              <button class="lpav-tab" data-asset-type="text" data-active="false" aria-selected="false" type="button">文字</button>
            </div>

            <div class="lpav-card-head">
              <h3 id="lpavComposeTitle">新增影片資產</h3>
              <span id="lpavSheetTip" class="lpav-tip">寫入 Google Sheet 的「影片」分頁</span>
            </div>

            <form id="lpavForm" class="lpav-form">
              <div class="lpav-draft-row">
                <div class="lpav-draft-box">
                  <span class="lpav-draft-label">目前編號</span>
                  <strong id="lpavDraftEntryId" class="lpav-draft-id">準備中</strong>
                </div>
                <div class="lpav-draft-actions">
                  <button id="lpavCreateFolderButton" class="lpav-button lpav-button-ghost" type="button">建立資料夾</button>
                  <button id="lpavRefreshDraftIdButton" class="lpav-button lpav-button-ghost" type="button">換編號</button>
                </div>
              </div>

              <label class="lpav-field">
                <span class="lpav-label">標題</span>
                <input id="lpavTitle" class="lpav-input" name="title" type="text" maxlength="120" placeholder="例如：藍色能量流動短片概念" required>
              </label>

              <label class="lpav-field">
                <span id="lpavPromptLabel" class="lpav-label">影片概念 / Prompt</span>
                <textarea id="lpavPromptText" class="lpav-textarea" name="promptText" placeholder="直接貼上影片提示詞、分鏡描述或生成概念" required></textarea>
              </label>

              <div class="lpav-grid">
                <label class="lpav-field">
                  <span class="lpav-label">標籤</span>
                  <input id="lpavTags" class="lpav-input" name="tags" type="text" maxlength="160" placeholder="轉場, 動態, 光感">
                </label>

                <label class="lpav-field">
                  <span class="lpav-label">收藏</span>
                  <select id="lpavFavorite" class="lpav-select" name="favorite">
                    <option value="false">一般</option>
                    <option value="true">精選</option>
                  </select>
                </label>
              </div>

              <label class="lpav-field">
                <span class="lpav-label">備註</span>
                <textarea id="lpavNotes" class="lpav-textarea" name="notes" placeholder="補充參考來源、鏡頭節奏、版本差異"></textarea>
              </label>

              <section id="lpavYouTubePanel" class="lpav-card" hidden>
                <div class="lpav-card-head">
                  <h3>YouTube 上傳</h3>
                  <span id="lpavYouTubeAuthBadge" class="lpav-tip">尚未授權</span>
                </div>

                <div class="lpav-youtube-panel">
                  <label class="lpav-field">
                    <span class="lpav-label">影片檔案</span>
                    <input id="lpavYouTubeVideoFile" class="lpav-input" type="file" accept="video/*">
                  </label>

                  <div class="lpav-grid">
                    <label class="lpav-field">
                      <span class="lpav-label">隱私設定</span>
                      <select id="lpavYouTubePrivacyStatus" class="lpav-select">
                        <option value="private">私人</option>
                        <option value="unlisted">非公開</option>
                        <option value="public">公開</option>
                      </select>
                    </label>

                    <label class="lpav-field">
                      <span class="lpav-label">授權</span>
                      <button id="lpavYouTubeAuthButton" class="lpav-button lpav-button-ghost" type="button">連接 YouTube</button>
                    </label>
                  </div>

                  <button id="lpavYouTubeUploadButton" class="lpav-button lpav-button-primary" type="button">上傳到 YouTube</button>
                  <p id="lpavYouTubeResult" class="lpav-youtube-result">尚未上傳影片。</p>
                </div>
              </section>

              <div class="lpav-action-row">
                <button id="lpavSaveButton" class="lpav-button lpav-button-primary" type="submit">寫入 Sheet</button>
                <button id="lpavResetButton" class="lpav-button lpav-button-ghost" type="button">清空</button>
                <button id="lpavRefreshButton" class="lpav-button lpav-button-ghost" type="button">刷新</button>
              </div>
            </form>
          </section>

          <section class="lpav-card">
            <div class="lpav-card-head">
              <h3 id="lpavRecentTitle">最近 5 筆影片</h3>
              <span class="lpav-tip">會即時從試算表抓目前分頁</span>
            </div>

            <div id="lpavRecentList" class="lpav-recent-list" aria-live="polite">
              <p class="lpav-empty">目前還沒有資料，先存第一筆看看。</p>
            </div>
          </section>

        </div>
      </section>
    </div>
  `;

  document.documentElement.append(host);

  const badge = shadow.getElementById("lpavBadge");
  const panel = shadow.getElementById("lpavPanel");
  const dragHandle = shadow.getElementById("lpavDragHandle");
  const closeButton = shadow.getElementById("lpavCloseButton");
  const statusEl = shadow.getElementById("lpavStatus");
  const composeTitle = shadow.getElementById("lpavComposeTitle");
  const sheetTip = shadow.getElementById("lpavSheetTip");
  const promptLabel = shadow.getElementById("lpavPromptLabel");
  const recentTitle = shadow.getElementById("lpavRecentTitle");
  const form = shadow.getElementById("lpavForm");
  const titleInput = shadow.getElementById("lpavTitle");
  const promptInput = shadow.getElementById("lpavPromptText");
  const tagsInput = shadow.getElementById("lpavTags");
  const notesInput = shadow.getElementById("lpavNotes");
  const draftEntryId = shadow.getElementById("lpavDraftEntryId");
  const createFolderButton = shadow.getElementById("lpavCreateFolderButton");
  const refreshDraftIdButton = shadow.getElementById("lpavRefreshDraftIdButton");
  const saveButton = shadow.getElementById("lpavSaveButton");
  const resetButton = shadow.getElementById("lpavResetButton");
  const refreshButton = shadow.getElementById("lpavRefreshButton");
  const recentList = shadow.getElementById("lpavRecentList");
  const youtubePanel = shadow.getElementById("lpavYouTubePanel");
  const youtubeAuthBadge = shadow.getElementById("lpavYouTubeAuthBadge");
  const youtubeVideoFile = shadow.getElementById("lpavYouTubeVideoFile");
  const youtubePrivacyStatus = shadow.getElementById("lpavYouTubePrivacyStatus");
  const youtubeAuthButton = shadow.getElementById("lpavYouTubeAuthButton");
  const youtubeUploadButton = shadow.getElementById("lpavYouTubeUploadButton");
  const youtubeResult = shadow.getElementById("lpavYouTubeResult");
  const tabButtons = Array.from(shadow.querySelectorAll("[data-asset-type]"));

  const state = {
    isOpen: false,
    top: DEFAULT_TOP,
    assetType: "video",
    draftIds: {}
  };

  function storageGet(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => resolve(result[key]));
    });
  }

  function storageSet(values) {
    return new Promise((resolve) => {
      chrome.storage.local.set(values, () => resolve());
    });
  }

  function clampTop(nextTop) {
    const badgeHeight = badge.getBoundingClientRect().height || 48;
    const maxTop = Math.max(SAFE_MARGIN, window.innerHeight - badgeHeight - SAFE_MARGIN);
    return Math.min(Math.max(nextTop, SAFE_MARGIN), maxTop);
  }

  async function persistTop() {
    await storageSet({ [STORAGE_KEY]: state.top });
  }

  function applyTop(nextTop) {
    state.top = clampTop(nextTop);
    host.style.top = `${state.top}px`;
  }

  function setStatus(message, mode = "idle") {
    statusEl.textContent = message;
    statusEl.dataset.state = mode;
  }

  function setBusy(isBusy) {
    saveButton.disabled = isBusy;
    resetButton.disabled = isBusy;
    refreshButton.disabled = isBusy;
    createFolderButton.disabled = isBusy;
    refreshDraftIdButton.disabled = isBusy;
    youtubeAuthButton.disabled = isBusy;
    youtubeUploadButton.disabled = isBusy;
    tabButtons.forEach((button) => {
      button.disabled = isBusy;
    });
  }

  function setPanelOpen(isOpen) {
    state.isOpen = Boolean(isOpen);
    panel.hidden = !state.isOpen;
    badge.setAttribute("aria-expanded", String(state.isOpen));
  }

  function getPayload() {
    const formData = new FormData(form);
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

  function sendMessage(type, payload = {}) {
    return chrome.runtime.sendMessage({ type, payload }).catch((error) => {
      const message = String(error?.message || error || "");
      if (message.includes("Extension context invalidated")) {
        throw new Error("擴充功能剛更新，請重新整理目前頁面後再試一次。");
      }

      throw error;
    });
  }

  function isEditableElement(element) {
    return element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement;
  }

  function insertTextAtCursor(element, text) {
    if (!isEditableElement(element)) {
      return;
    }

    const start = element.selectionStart ?? element.value.length;
    const end = element.selectionEnd ?? element.value.length;
    const currentValue = element.value;
    const nextValue = `${currentValue.slice(0, start)}${text}${currentValue.slice(end)}`;

    element.value = nextValue;
    element.dispatchEvent(new Event("input", { bubbles: true }));

    const nextCursor = start + text.length;
    element.setSelectionRange(nextCursor, nextCursor);
  }

  async function pasteClipboardText(element) {
    if (!isEditableElement(element)) {
      return;
    }

    const text = await navigator.clipboard.readText();
    if (!text) {
      return;
    }

    insertTextAtCursor(element, text);
  }

  function selectAllEditableText(element) {
    if (!isEditableElement(element)) {
      return;
    }

    element.focus();
    element.setSelectionRange(0, element.value.length);
  }

  function isOwnedEditableShortcut(event) {
    if (!(event.ctrlKey || event.metaKey)) {
      return false;
    }

    const key = event.key.toLowerCase();
    return ["a", "c", "x", "v", "z", "y"].includes(key);
  }

  function applyAssetTypeUI(assetType) {
    const meta = ASSET_META[assetType];
    if (!meta) {
      return;
    }

    state.assetType = assetType;
    composeTitle.textContent = meta.composeTitle;
    sheetTip.textContent = meta.sheetTip;
    promptLabel.textContent = meta.promptLabel;
    recentTitle.textContent = meta.recentTitle;
    titleInput.placeholder = meta.titlePlaceholder;
    promptInput.placeholder = meta.promptPlaceholder;
    tagsInput.placeholder = meta.tagsPlaceholder;
    notesInput.placeholder = meta.notesPlaceholder;
    createFolderButton.textContent = "建立資料夾";
    refreshDraftIdButton.textContent = "換編號";
    draftEntryId.textContent = state.draftIds[assetType] || "準備中";
    youtubePanel.hidden = assetType !== "video";

    tabButtons.forEach((button) => {
      const isActive = button.dataset.assetType === assetType;
      button.dataset.active = String(isActive);
      button.setAttribute("aria-selected", String(isActive));
    });
  }

  function setYouTubeAuthState(authorized) {
    youtubeAuthBadge.textContent = authorized ? "已授權" : "尚未授權";
    youtubeAuthButton.textContent = authorized ? "重新授權" : "連接 YouTube";
  }

  async function refreshYouTubeAuthStatus() {
    if (state.assetType !== "video") {
      return;
    }

    try {
      const response = await sendMessage("lpav:youtubeAuthStatus");
      setYouTubeAuthState(Boolean(response?.authorized));
    } catch (error) {
      setYouTubeAuthState(false);
      youtubeResult.textContent = error.message || "無法連線到 YouTube helper。";
    }
  }

  function renderRecentEntries(entries) {
    recentList.innerHTML = "";

    if (!entries.length) {
      const empty = document.createElement("p");
      empty.className = "lpav-empty";
      empty.textContent = "目前還沒有資料，先存第一筆看看。";
      recentList.append(empty);
      return;
    }

    const fragment = document.createDocumentFragment();

    entries.forEach((entry) => {
      const item = document.createElement("article");
      item.className = "lpav-recent-item";

      const head = document.createElement("div");
      head.className = "lpav-recent-head";

      const title = document.createElement("h4");
      title.className = "lpav-recent-title";
      title.textContent = entry.id || entry.title || "未命名資料";

      const meta = document.createElement("span");
      meta.className = "lpav-recent-meta";
      meta.textContent = [entry.title, entry.createdAt, entry.tags].filter(Boolean).join(" ｜ ");

      const prompt = document.createElement("p");
      prompt.className = "lpav-recent-prompt";
      prompt.textContent = entry.promptText || "沒有提示詞內容";

      head.append(title, meta);
      item.append(head, prompt);

      if (entry.notes) {
        const notes = document.createElement("p");
        notes.className = "lpav-recent-notes";
        notes.textContent = `備註：${entry.notes}`;
        item.append(notes);
      }

      fragment.append(item);
    });

    recentList.append(fragment);
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
    await refreshYouTubeAuthStatus();
    setStatus(`已準備 ${ASSET_META[state.assetType].label} 草稿編號 ${state.draftIds[state.assetType]}。`, "success");
  }

  async function openPanelAndRefresh() {
    setPanelOpen(true);
    setBusy(true);
    try {
      await hydrateCurrentAssetType();
    } catch (error) {
      setStatus(error.message || "初始化失敗", "error");
    } finally {
      setBusy(false);
    }
  }

  function attachVerticalDrag(handle, onTap) {
    handle.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) {
        return;
      }

      event.preventDefault();
      const startY = event.clientY;
      const startTop = state.top;
      let dragged = false;

      const onMove = (moveEvent) => {
        const deltaY = moveEvent.clientY - startY;
        if (Math.abs(deltaY) > 4) {
          dragged = true;
        }

        if (!dragged) {
          return;
        }

        applyTop(startTop + deltaY);
      };

      const onUp = async () => {
        window.removeEventListener("pointermove", onMove, true);
        window.removeEventListener("pointerup", onUp, true);

        if (dragged) {
          await persistTop();
          setStatus("已更新懸浮位置。", "success");
          return;
        }

        if (typeof onTap === "function") {
          onTap();
        }
      };

      window.addEventListener("pointermove", onMove, true);
      window.addEventListener("pointerup", onUp, true);
    });
  }

  badge.addEventListener("click", (event) => {
    event.preventDefault();
  });

  attachVerticalDrag(badge, () => {
    if (state.isOpen) {
      setPanelOpen(false);
      setStatus("已收起懸浮面板。", "idle");
      return;
    }

    void openPanelAndRefresh();
  });

  attachVerticalDrag(dragHandle);

  shadow.addEventListener("paste", (event) => {
    if (!isEditableElement(event.target)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const text = event.clipboardData?.getData("text/plain") || "";
    insertTextAtCursor(event.target, text);
  });

  shadow.addEventListener(
    "keydown",
    (event) => {
      if (!isEditableElement(event.target)) {
        return;
      }

      if (!isOwnedEditableShortcut(event)) {
        return;
      }

      event.stopPropagation();
      const key = event.key.toLowerCase();

      if (key === "a") {
        event.preventDefault();
        selectAllEditableText(event.target);
        return;
      }

      if (key === "v") {
        event.preventDefault();
        void pasteClipboardText(event.target).catch(() => {
          setStatus("貼上失敗，請再試一次或改用右鍵貼上。", "error");
        });
      }
    },
    true
  );

  closeButton.addEventListener("click", () => {
    setPanelOpen(false);
    setStatus("已收起懸浮面板。", "idle");
  });

  tabButtons.forEach((button) => {
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

  youtubeAuthButton.addEventListener("click", async () => {
    setBusy(true);
    youtubeResult.textContent = "正在開啟 YouTube 授權流程。";
    try {
      const response = await sendMessage("lpav:youtubeAuthStart");
      setYouTubeAuthState(Boolean(response?.authorized));
      youtubeResult.textContent = response?.authorized ? "YouTube 已授權，可以開始上傳。" : "YouTube 尚未授權。";
    } catch (error) {
      setYouTubeAuthState(false);
      youtubeResult.textContent = error.message || "YouTube 授權失敗。";
    } finally {
      setBusy(false);
    }
  });

  youtubeUploadButton.addEventListener("click", async () => {
    const file = youtubeVideoFile.files?.[0];
    if (!file) {
      setStatus("請先選擇要上傳的影片檔。", "error");
      return;
    }

    setBusy(true);
    youtubeResult.textContent = "正在上傳影片到 YouTube，請稍候。";
    try {
      const buffer = await file.arrayBuffer();
      const response = await sendMessage("lpav:youtubeUpload", {
        fileName: file.name,
        fileBytes: Array.from(new Uint8Array(buffer)),
        mimeType: file.type || "video/mp4",
        title: titleInput.value.trim() || state.draftIds[state.assetType] || "LPAV Upload",
        description: notesInput.value.trim() || promptInput.value.trim(),
        privacyStatus: youtubePrivacyStatus.value,
        tags: tagsInput.value
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      });

      youtubeResult.textContent = `已上傳成功：${response.youtubeUrl}`;
      setStatus(`YouTube 上傳完成，影片編號 ${response.videoId}。`, "success");
    } catch (error) {
      youtubeResult.textContent = error.message || "YouTube 上傳失敗。";
      setStatus(error.message || "YouTube 上傳失敗。", "error");
    } finally {
      setBusy(false);
    }
  });

  resetButton.addEventListener("click", () => {
    form.reset();
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

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = getPayload();

    if (!formData.entryId) {
      setStatus("目前編號還沒準備好，請稍後再試。", "error");
      return;
    }

    if (!formData.title || !formData.promptText) {
      setStatus("標題和 Prompt 內容都要填。", "error");
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

      form.reset();
      delete state.draftIds[state.assetType];
      await hydrateCurrentAssetType(true);
      setStatus(`已寫入 ${response.sheetName} 第 ${response.rowNumber} 列，編號 ${response.entryId}。`, "success");
    } catch (error) {
      setStatus(error.message || "寫入失敗", "error");
    } finally {
      setBusy(false);
    }
  });

  window.addEventListener("resize", () => {
    applyTop(state.top);
  });

  (async () => {
    applyAssetTypeUI(state.assetType);
    const storedTop = await storageGet(STORAGE_KEY);
    applyTop(typeof storedTop === "number" ? storedTop : DEFAULT_TOP);
    await ensureDraftEntryId();
    setStatus(ASSET_META[state.assetType].statusReady, "idle");
  })().catch((error) => {
    console.error("LPAV 懸浮面板初始化失敗", error);
  });
})();
