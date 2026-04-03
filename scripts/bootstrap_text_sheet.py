from __future__ import annotations

from pathlib import Path
from urllib.parse import quote

from google.auth.transport.requests import AuthorizedSession
from google.oauth2 import service_account

ROOT = Path(__file__).resolve().parents[1]
SERVICE_ACCOUNT_PATH = ROOT / "singular-vector-370902-2aadce26f762.json"
SPREADSHEET_ID = "1LMwmz3KpoTufuDLCatA5f12k2z3bzDqcIPMz55RT9CM"
TEXT_SHEET_NAME = "文字"
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


def ensure_text_sheet(session: AuthorizedSession) -> None:
    metadata_response = session.get(
        f"https://sheets.googleapis.com/v4/spreadsheets/{SPREADSHEET_ID}?fields=sheets.properties.title",
        timeout=30,
    )
    metadata_response.raise_for_status()

    metadata = metadata_response.json()
    existing_sheets = {sheet["properties"]["title"] for sheet in metadata.get("sheets", [])}

    if TEXT_SHEET_NAME not in existing_sheets:
        add_sheet_response = session.post(
            f"https://sheets.googleapis.com/v4/spreadsheets/{SPREADSHEET_ID}:batchUpdate",
            json={
                "requests": [
                    {
                        "addSheet": {
                            "properties": {
                                "title": TEXT_SHEET_NAME,
                            }
                        }
                    }
                ]
            },
            timeout=30,
        )
        add_sheet_response.raise_for_status()
        print("已建立分頁：文字")
    else:
        print("分頁已存在：文字")


def ensure_headers(session: AuthorizedSession) -> None:
    encoded_range = quote(f"{TEXT_SHEET_NAME}!A1:M1", safe="!:'")
    header_response = session.put(
        f"https://sheets.googleapis.com/v4/spreadsheets/{SPREADSHEET_ID}/values/{encoded_range}?valueInputOption=RAW",
        json={
            "range": f"{TEXT_SHEET_NAME}!A1:M1",
            "majorDimension": "ROWS",
            "values": HEADERS,
        },
        timeout=30,
    )
    header_response.raise_for_status()
    print("已寫入表頭：文字!A1:M1")


def main() -> None:
    session = build_session()
    ensure_text_sheet(session)
    ensure_headers(session)


if __name__ == "__main__":
    main()
