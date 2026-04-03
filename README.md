# Lin Prompt Asset Vault

這是第一版可跑的 Chrome Extension MVP，先把「文字提示詞收藏」直接寫進指定 Google Sheet，並在一般網頁右側顯示可拖曳的懸浮徽章。

## 目前已完成

- 一般網頁右側會出現可拖曳的懸浮徽章
- 點開後可展開頁內面板，直接輸入標題、Prompt、標籤、備註、收藏狀態
- Extension 會用本地 service account 換 access token
- 第一次寫入時，若沒有 `文字` 分頁會自動建立
- 第一次寫入時，若表頭不存在會自動補上
- 懸浮面板底部可即時顯示最近 5 筆文字資料

## 本地載入方式

1. 開啟 `chrome://extensions`
2. 打開右上角「開發人員模式」
3. 點「載入未封裝項目」
4. 選擇這個資料夾：`C:\LIN-prompt-asset-vault`
5. 打開一般網站頁面，例如 `https://google.com`
6. 右側會看到 LPAV 懸浮徽章，點一下展開面板

注意：

- `chrome://extensions`、Chrome Web Store 這類 Chrome 系統頁不會顯示懸浮面板，這是 Chrome 本身限制
- 如果更新後沒看到，先到擴充功能頁按一次「重新整理」

## 使用情境

成功案例：

1. 在一般網站右側點開 LPAV 懸浮面板
2. 在「標題」輸入 `精品花店廣告主提示詞`
3. 在「Prompt 內容」貼上完整 prompt
4. 在「標籤」輸入 `花藝, 廣告`
5. 按 `寫入 Sheet`
6. 預期結果：狀態列顯示已寫入 `文字` 分頁第幾列，底下最近資料會刷新

失敗案例：

1. 如果這張 Sheet 沒有分享給 service account
2. 或 `services/config.local.js` 缺失 / 私鑰不正確
3. 按下 `寫入 Sheet` 後，狀態列會顯示 Google API 錯誤訊息

## 驗證指令

成功案例：

```powershell
.\\.venv\\Scripts\\python.exe .\\scripts\\sheet_smoke_test.py
```

預期輸出會列出試算表標題與目前分頁名稱。

## 風險說明

這一版為了讓你快速看成品，直接在本地 Extension 使用 service account 私鑰。這適合你自己本地測試，不適合發佈到公開環境。正式版應改成後端代簽或改走使用者 OAuth。
