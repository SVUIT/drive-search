import google.auth
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


def fetch_changes(saved_start_page_token):
    """Retrieve the list of changes for the currently authenticated user.
        prints changed file's ID
    Args:
        saved_start_page_token : StartPageToken for the current state of the
        account.
    Returns: saved start page token.

    Load pre-authorized user credentials from the environment.
    TODO(developer) - See https://developers.google.com/identity
    for guides on implementing OAuth2 for the application.
    """
    creds, _ = google.auth.default()
    try:
        # create drive api client
        service = build("drive", "v3", credentials=creds)

        # Begin with our last saved start token for this user or the
        # current token from getStartPageToken()
        page_token = saved_start_page_token

        while page_token is not None:
            response = (
                service.changes().list(pageToken=page_token, spaces="drive",
                                        fields="nextPageToken, newStartPageToken, changes(fileId, file(name,createdTime, modifiedTime, mimeType, owners(displayName,emailAddress), webViewLink), removed)"
                                        ).execute()
            )
            for change in response.get("changes"):
                # Process change
                print(f'FileId: {change.get("fileId")}') # ID của file
                print(f'Removed: {change.get("removed")}') # File có bị xóa hay không 
                
                if change.get("removed"):
                    print("This file was removed.")
                else:
                    file = change.get("file")
                    print(f" - WebViewLink: {file.get('webViewLink')}") # Link để mở file
                    print(f" - Name: {file.get('name')}") # Tên file
                    print(f" - MIME Type: {file.get('mimeType')}") # Kiểu file
                    print(f" - Created: {file.get('createdTime')}") # Thời gian tạo file
                    print(f" - Modified: {file.get('modifiedTime')}") # Thời gian sửa đổi file
                    owners = file.get('owners')
                    if owners and isinstance(owners, list) and len(owners) > 0:
                        print(f" - Owner: {owners[0].get('displayName')}") # Tên chủ sở hữu
                        print(f" - Owner email: {owners[0].get('emailAddress')}") # Email chủ sở hữu
                    else:
                        print(" - Owner info not available.")
                    print('\n')
            if "newStartPageToken" in response:
                # Last page, save this token for the next polling interval
                saved_start_page_token = response.get("newStartPageToken")
            page_token = response.get("nextPageToken")

    except HttpError as error:
        print(f"An error occurred: {error}")
        saved_start_page_token = None

    return saved_start_page_token


if __name__ == "__main__":
    # saved_start_page_token is the token number
    fetch_changes(saved_start_page_token=51565)