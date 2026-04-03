from __future__ import annotations

from pathlib import Path
from urllib.parse import quote

from google.auth.transport.requests import AuthorizedSession
from google.oauth2 import service_account

ROOT = Path(__file__).resolve().parents[1]
SERVICE_ACCOUNT_PATH = ROOT / "singular-vector-370902-2aadce26f762.json"
SPREADSHEET_ID = "1LMwmz3KpoTufuDLCatA5f12k2z3bzDqcIPMz55RT9CM"
TEXT_RANGE = "文字!A1:M2"


def build_session() -> AuthorizedSession:
    credentials = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_PATH,
        scopes=["https://www.googleapis.com/auth/spreadsheets"],
    )
    return AuthorizedSession(credentials)


def main() -> None:
    session = build_session()
    encoded_range = quote(TEXT_RANGE, safe="!:'")
    response = session.get(
        f"https://sheets.googleapis.com/v4/spreadsheets/{SPREADSHEET_ID}/values/{encoded_range}",
        timeout=30,
    )
    response.raise_for_status()
    print(response.text)


if __name__ == "__main__":
    main()
