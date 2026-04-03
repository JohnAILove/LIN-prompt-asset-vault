from __future__ import annotations

import json
from pathlib import Path

from google.oauth2 import service_account
from google.auth.transport.requests import AuthorizedSession

ROOT = Path(__file__).resolve().parents[1]
SERVICE_ACCOUNT_PATH = ROOT / "singular-vector-370902-2aadce26f762.json"
SPREADSHEET_ID = "1LMwmz3KpoTufuDLCatA5f12k2z3bzDqcIPMz55RT9CM"


def main() -> None:
    credentials = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_PATH,
        scopes=["https://www.googleapis.com/auth/spreadsheets"],
    )
    session = AuthorizedSession(credentials)

    metadata_response = session.get(
        f"https://sheets.googleapis.com/v4/spreadsheets/{SPREADSHEET_ID}?fields=properties.title,sheets.properties.title",
        timeout=30,
    )
    metadata_response.raise_for_status()

    metadata = metadata_response.json()
    print("試算表標題：", metadata["properties"]["title"])
    print("現有分頁：", ", ".join(sheet["properties"]["title"] for sheet in metadata["sheets"]))


if __name__ == "__main__":
    main()
