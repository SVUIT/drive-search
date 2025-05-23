from google.oauth2.credentials import Credentials
from dotenv import load_dotenv
import os 
import json 
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
load_dotenv()

def get_token():
    # Xác thực người dùng và lấy thông tin xác thực
    creds = None 
    SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly']
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

if __name__ == "__main__":
  get_token()