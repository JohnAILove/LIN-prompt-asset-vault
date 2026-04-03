export const LPAV_CONFIG = {
  googleServiceAccount: {
    clientEmail: "service-account@example.iam.gserviceaccount.com",
    privateKey: "-----BEGIN PRIVATE KEY-----\\n請改成你的私鑰\\n-----END PRIVATE KEY-----\\n",
    tokenUri: "https://oauth2.googleapis.com/token"
  },
  spreadsheet: {
    spreadsheetId: "請填入 Google Sheet ID",
    defaultAssetType: "video",
    sheetNames: {
      text: "文字",
      image: "圖片",
      video: "影片"
    }
  }
};
