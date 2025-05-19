from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import os.path
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from page_token_utils import read_start_page_token, save_start_page_token
import json 
import logging
from dotenv import load_dotenv
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request


load_dotenv()

# If modifying these scopes, delete the file token.json.
SCOPES = ["https://www.googleapis.com/auth/drive.metadata.readonly"]

def fetch_changes(saved_start_page_token):
  # Cấu hình logging
  logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s")
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
  creds = None
  
  # if os.path.exists("token.json"):
  #   creds = Credentials.from_authorized_user_file("token.json", SCOPES)
  creds = Credentials(
    token=None,
    refresh_token=os.getenv("GOOGLE_REFRESH_TOKEN"),
    token_uri="https://oauth2.googleapis.com/token",
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    scopes=SCOPES,
)

  # If there are no (valid) credentials available, let the user log in.
  # if not creds or not creds.valid:
  #   if creds and creds.expired and creds.refresh_token:
  #     creds.refresh(Request())
  #   else:
  #     credentials_info = json.loads(os.getenv("GOOGLE_CREDENTIALS_JSON"))
  #     flow = InstalledAppFlow.from_client_config(
  #         credentials_info, SCOPES
  #     )
  #     creds = flow.run_local_server(port=0)
  #   # Save the credentials for the next run
  #   with open("token.json", "w") as token:
  #     token.write(creds.to_json())

  try:
    # create drive api client
    service = build("drive", "v3", credentials=creds)

    # Begin with our last saved start token for this user or the
    # current token from getStartPageToken()

    page_token = saved_start_page_token



    # pylint: disable=maybe-no-member
    while page_token is not None:
      response = (
          service.changes().list(pageToken=page_token, spaces="drive",
                                 fields="nextPageToken, newStartPageToken, changes(fileId, file(name,createdTime, modifiedTime, mimeType, owners(displayName,emailAddress), webViewLink, parents), removed)"
                                 ).execute()
      )
      
      for change in response.get("changes"):
        # Process change
        if change.get("removed"):
          print("This file was removed.")
        else:
          file = change.get("file")
          parents = file.get("parents", [])
          folder_id = os.getenv("FILE_ID")
          if folder_id not in parents:
            continue  
          logging.info("")
          print(f'FileId: {change.get("fileId")}') # ID của file
          print(f'Removed: {change.get("removed")}') # File có bị xóa hay không 
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

  save_start_page_token(response["newStartPageToken"])
  return page_token, creds.token 


if __name__ == "__main__":
  # saved_start_page_token is the token number
  fetch_changes(saved_start_page_token=52121)