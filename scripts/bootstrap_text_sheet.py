from __future__ import annotations

from pathlib import Path
from urllib.parse import quote

from google.auth.transport.requests import AuthorizedSession
from google.oauth2 import service_account

ROOT = Path(__file__).resolve().parents[1]
SERVICE_ACCOUNT_PATH = ROOT / "singular-vector-370902-2aadce26f762.json"
SPREADSHEET_ID = "1LMwmz3KpoTufuDLCatA5f12k2z3bzDqcIPMz55RT9CM"
SHEET_NAMES = ["影片", "圖片", "文字"]
HEADERS = [[
    "編號",
    "建立時間",
    "資產類型",
    "標題",
    "提示詞內容",
    "標籤",
    "備註",
    "雲端檔案ID",
    "雲端檢視連結",
    "檔案類型",
    "是否公開",
    "是否收藏",
    "狀態",
]]


def build_session() -> AuthorizedSession:
    credentials = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_PATH,
        scopes=["https://www.googleapis.com/auth/spreadsheets"],
    )
    return AuthorizedSession(credentials)


def ensure_sheets(session: AuthorizedSession) -> None:
    metadata_response = session.get(
        f"https://sheets.googleapis.com/v4/spreadsheets/{SPREADSHEET_ID}?fields=sheets.properties.title",
        timeout=30,
    )
    metadata_response.raise_for_status()

    metadata = metadata_response.json()
    existing_sheets = {sheet["properties"]["title"] for sheet in metadata.get("sheets", [])}

    missing_sheets = [sheet_name for sheet_name in SHEET_NAMES if sheet_name not in existing_sheets]
    if missing_sheets:
        add_sheet_response = session.post(
            f"https://sheets.googleapis.com/v4/spreadsheets/{SPREADSHEET_ID}:batchUpdate",
            json={
                "requests": [
                    {
                        "addSheet": {
                            "properties": {
                                "title": sheet_name,
                            }
                        }
                    }
                    for sheet_name in missing_sheets
                ]
            },
            timeout=30,
        )
        add_sheet_response.raise_for_status()
        print("已建立分頁：", ", ".join(missing_sheets))
    else:
        print("三個分頁都已存在")


def ensure_headers(session: AuthorizedSession) -> None:
    for sheet_name in SHEET_NAMES:
        encoded_range = quote(f"{sheet_name}!A1:M1", safe="!:'")
        header_response = session.put(
            f"https://sheets.googleapis.com/v4/spreadsheets/{SPREADSHEET_ID}/values/{encoded_range}?valueInputOption=RAW",
            json={
                "range": f"{sheet_name}!A1:M1",
                "majorDimension": "ROWS",
                "values": HEADERS,
            },
            timeout=30,
        )
        header_response.raise_for_status()
        print(f"已寫入表頭：{sheet_name}!A1:M1")


def main() -> None:
    session = build_session()
    ensure_sheets(session)
    ensure_headers(session)


if __name__ == "__main__":
    main()
