(() => {
  const ROOT_ID = "lpav-floating-root";
  const STORAGE_KEY = "lpavFloatingTop";
  const DEFAULT_TOP = 180;
  const SAFE_MARGIN = 20;
  const RIGHT_OFFSET = 2;
  const BADGE_IMAGE_URL = chrome.runtime.getURL("assets/badge-lightning.png");

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
        color: #2d1f14;
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
        background-color: transparent;
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
        flex: none;
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

      .lpav-form {
        display: grid;
        gap: 12px;
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
    </style>
    <div class="lpav-dock">
      <button id="lpavBadge" class="lpav-badge" type="button" aria-label="LPAV 懸浮徽章" aria-expanded="false" aria-controls="lpavPanel">
        <span class="lpav-badge-image" aria-hidden="true"></span>
        <span class="lpav-badge-glow"></span>
      </button>

      <section id="lpavPanel" class="lpav-panel" hidden>
        <header class="lpav-head">
          <div id="lpavDragHandle" class="lpav-head-copy" title="拖曳可調整位置">
            <span class="lpav-drag-pill" aria-hidden="true"></span>
          </div>
          <button id="lpavCloseButton" class="lpav-close" type="button" aria-label="關閉">×</button>
        </header>

        <div class="lpav-body">
          <div id="lpavStatus" class="lpav-status" data-state="idle">已就緒，拖曳可調位置，點徽章可展開。</div>

          <section class="lpav-card">
            <div class="lpav-card-head">
              <h3>新增文字資產</h3>
              <span class="lpav-tip">寫入 Google Sheet 的「文字」分頁</span>
            </div>

            <form id="lpavForm" class="lpav-form">
              <label class="lpav-field">
                <span class="lpav-label">標題</span>
                <input id="lpavTitle" class="lpav-input" name="title" type="text" maxlength="120" placeholder="例如：冷色金屬感主視覺提示詞" required>
              </label>

              <label class="lpav-field">
                <span class="lpav-label">Prompt 內容</span>
                <textarea id="lpavPromptText" class="lpav-textarea" name="promptText" placeholder="直接把你要收的 prompt 貼進來" required></textarea>
              </label>

              <div class="lpav-grid">
                <label class="lpav-field">
                  <span class="lpav-label">標籤</span>
                  <input id="lpavTags" class="lpav-input" name="tags" type="text" maxlength="160" placeholder="排版, 材質, 視覺">
                </label>

                <label class="lpav-field">
                  <span class="lpav-label">收藏</span>
                  <select id="lpavFavorite" class="lpav-select" name="favorite">
                    <option value="false">一般</option>
                    <option value="true">星號</option>
                  </select>
                </label>
              </div>

              <label class="lpav-field">
                <span class="lpav-label">備註</span>
                <textarea id="lpavNotes" class="lpav-textarea" name="notes" placeholder="補充靈感來源、版本差異、延伸方向"></textarea>
              </label>

              <div class="lpav-action-row">
                <button id="lpavSaveButton" class="lpav-button lpav-button-primary" type="submit">寫入 Sheet</button>
                <button id="lpavResetButton" class="lpav-button lpav-button-ghost" type="button">清空</button>
                <button id="lpavRefreshButton" class="lpav-button lpav-button-ghost" type="button">刷新</button>
              </div>
            </form>
          </section>

          <section class="lpav-card">
            <div class="lpav-card-head">
              <h3>最近 5 筆</h3>
              <span class="lpav-tip">會即時從試算表抓最新資料</span>
            </div>

            <div id="lpavRecentList" class="lpav-recent-list" aria-live="polite">
              <p class="lpav-empty">目前還沒有資料，先新增一筆。</p>
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
  const form = shadow.getElementById("lpavForm");
  const saveButton = shadow.getElementById("lpavSaveButton");
  const resetButton = shadow.getElementById("lpavResetButton");
  const refreshButton = shadow.getElementById("lpavRefreshButton");
  const recentList = shadow.getElementById("lpavRecentList");

  const state = {
    isOpen: false,
    top: DEFAULT_TOP
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
  }

  function setPanelOpen(isOpen) {
    state.isOpen = Boolean(isOpen);
    panel.hidden = !state.isOpen;
    badge.setAttribute("aria-expanded", String(state.isOpen));
  }

  function getPayload() {
    const formData = new FormData(form);
    return {
      title: String(formData.get("title") || "").trim(),
      promptText: String(formData.get("promptText") || "").trim(),
      tags: String(formData.get("tags") || "").trim(),
      notes: String(formData.get("notes") || "").trim(),
      favorite: String(formData.get("favorite") || "false") === "true"
    };
  }

  function sendMessage(type, payload = {}) {
    return chrome.runtime.sendMessage({ type, payload });
  }

  function renderRecentEntries(entries) {
    recentList.innerHTML = "";

    if (!entries.length) {
      const empty = document.createElement("p");
      empty.className = "lpav-empty";
      empty.textContent = "目前還沒有資料，先新增一筆。";
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
      title.textContent = entry.title || "未命名資料";

      const meta = document.createElement("span");
      meta.className = "lpav-recent-meta";
      meta.textContent = `${entry.createdAt || "未知時間"}${entry.tags ? ` ｜ ${entry.tags}` : ""}`;

      const prompt = document.createElement("p");
      prompt.className = "lpav-recent-prompt";
      prompt.textContent = entry.promptText || "沒有 prompt 內容";

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

  async function refreshRecentEntries() {
    setStatus("正在讀取最近資料。", "loading");
    const response = await sendMessage("lpav:listRecentEntries");

    if (!response?.ok) {
      throw new Error(response?.error || "讀取最近資料失敗。");
    }

    renderRecentEntries(response.entries || []);
    setStatus("已刷新最近 5 筆資料。", "success");
  }

  async function openPanelAndRefresh() {
    setPanelOpen(true);
    setBusy(true);
    try {
      await refreshRecentEntries();
    } catch (error) {
      setStatus(error.message || "讀取最近資料失敗。", "error");
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
      setStatus("已收合懸浮面板。", "idle");
      return;
    }

    void openPanelAndRefresh();
  });

  attachVerticalDrag(dragHandle);

  closeButton.addEventListener("click", () => {
    setPanelOpen(false);
    setStatus("已收合懸浮面板。", "idle");
  });

  resetButton.addEventListener("click", () => {
    form.reset();
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

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = getPayload();

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

      form.reset();
      await refreshRecentEntries();
      setStatus(`已寫入 ${response.sheetName} 分頁，第 ${response.rowNumber} 列。`, "success");
    } catch (error) {
      setStatus(error.message || "寫入失敗。", "error");
    } finally {
      setBusy(false);
    }
  });

  window.addEventListener("resize", () => {
    applyTop(state.top);
  });

  (async () => {
    const storedTop = await storageGet(STORAGE_KEY);
    applyTop(typeof storedTop === "number" ? storedTop : DEFAULT_TOP);
  })().catch((error) => {
    console.error("LPAV 懸浮面板初始化失敗", error);
  });
})();
