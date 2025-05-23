from page_token_utils import read_start_page_token, save_start_page_token
from google.oauth2.credentials import Credentials
from googleapiclient.errors import HttpError
from googleapiclient.discovery import build
from dotenv import load_dotenv
import logging
import time 
import os

load_dotenv()

def polling_loop():
    interval = 2 * 24 * 60 * 60  # 2 ngày = 172800 giây
    
    while True:
        try:
            start_token = read_start_page_token()
            new_token = fetch_changes(start_token)
            
            if new_token:
                print("Polling successfully")
            else:
                print("Polling failed")

            time.sleep(interval) #Sleep 2 ngày 
            
        except Exception as e:
            print(f"Lỗi: {e}")
            time.sleep(300)  # Chờ 5 phút rồi thử lại


def fetch_changes(saved_start_page_token):

  SCOPES = ["https://www.googleapis.com/auth/drive.metadata.readonly"]
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
    return None 

  save_start_page_token(response["newStartPageToken"])
  return saved_start_page_token


if __name__ == "__main__":
    try:
        print("Đã bắt đầu polling Google Drive - 2 ngày 1 lần")
        polling_loop()  # Chạy trực tiếp, không cần thread
    except KeyboardInterrupt:
        print("\nĐã dừng polling")