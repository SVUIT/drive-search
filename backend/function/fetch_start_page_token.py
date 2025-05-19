import google.auth
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import os.path
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
import json 
import logging
from dotenv import load_dotenv
from page_token_utils import read_start_page_token, save_start_page_token


load_dotenv()

SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly']

def fetch_start_page_token():
  # Cấu hình logging
  logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
  """Retrieve page token for the current state of the account.
  Returns & prints : start page token

  Load pre-authorized user credentials from the environment.
  TODO(developer) - See https://developers.google.com/identity
  for guides on implementing OAuth2 for the application.
  """
  # Xác thực người dùng và lấy thông tin xác thực
  creds = None 

  # Nếu đã xác thực trước đó thì dùng lại
  if os.path.exists("token.json"):
    creds = Credentials.from_authorized_user_file("token.json", SCOPES)

  # If there are no (valid) credentials available, let the user log in.
  if not creds or not creds.valid:
    if creds and creds.expired and creds.refresh_token:
      creds.refresh(Request())
    else:
      credentials_info = json.loads(os.getenv("GOOGLE_CREDENTIALS_JSON"))
      flow = InstalledAppFlow.from_client_config(
          credentials_info, SCOPES
      )
      creds = flow.run_local_server(port=0)
    # Save the credentials for the next run
    with open("token.json", "w") as token:
      token.write(creds.to_json())
    
    

  try:
    # create drive api client
    service = build("drive", "v3", credentials=creds)

    # Get token đại diện cho trạng thái hiện tại của Drive 
    response = service.changes().getStartPageToken().execute()
    # print(creds.token)
    # print(f'Start token: {response.get("startPageToken")}')
    logging.info(f'Start token: {response.get("startPageToken")}')
  except HttpError as error:
    (f"An error occurred: {error}")
    response = None

  save_start_page_token(response.get("startPageToken"))
  # Trả về token đại diện cho trạng thái hiện tại của Drive
  return response.get("startPageToken"), creds.token


if __name__ == "__main__":
  fetch_start_page_token()