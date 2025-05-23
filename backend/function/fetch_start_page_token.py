from page_token_utils import save_start_page_token
from google.oauth2.credentials import Credentials
from googleapiclient.errors import HttpError
from googleapiclient.discovery import build
from dotenv import load_dotenv
import logging
import os

load_dotenv()

def fetch_start_page_token():
  SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly']
  # Cấu hình logging
  logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
  """Retrieve page token for the current state of the account.
  Returns & prints : start page token

  Load pre-authorized user credentials from the environment.
  TODO(developer) - See https://developers.google.com/identity
  for guides on implementing OAuth2 for the application.
  """
    
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