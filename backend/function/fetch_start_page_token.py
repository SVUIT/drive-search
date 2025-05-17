import google.auth
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


def fetch_start_page_token():
    """Retrieve page token for the current state of the account.
    Returns & prints : start page token

    Load pre-authorized user credentials from the environment.
    TODO(developer) - See https://developers.google.com/identity
    for guides on implementing OAuth2 for the application.
    """
    # Xác thực người dùng và lấy thông tin xác thực
    creds, _ = google.auth.default()

    try:
        # create drive api client
        service = build("drive", "v3", credentials=creds)

        # Get token đại diện cho trạng thái hiện tại của Drive 
        response = service.changes().getStartPageToken().execute()
        print(f'Start token: {response.get("startPageToken")}')

    except HttpError as error:
        print(f"An error occurred: {error}")
        response = None

    # Trả về token đại diện cho trạng thái hiện tại của Drive
    return response.get("startPageToken")


if __name__ == "__main__":
    fetch_start_page_token()