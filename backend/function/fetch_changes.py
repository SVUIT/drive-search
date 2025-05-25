from page_token_utils import read_start_page_token, save_start_page_token
from google.oauth2.credentials import Credentials
from googleapiclient.errors import HttpError
from googleapiclient.discovery import build
from dotenv import load_dotenv
import logging
import os
import datetime 
load_dotenv()

def main(context):
    """Appwrite HTTP Handler"""
    try:
        # Đọc token từ file
        start_token = read_start_page_token()
        if not start_token:
            return context.response.json({
                'success': False,
                'message': 'No start token found'
            }, 400)

        # Thực hiện polling
        new_token, file_details = fetch_changes(start_token)
        
        if new_token:
            save_start_page_token(new_token)
            # Log kết quả (sẽ hiển thị trong Appwrite logs)
            context.log("Polling completed successfully")
            return context.response.json({
                'success': True,
                'date': datetime.datetime.now().isoformat(),
                'message': 'Polling completed',
                'new_token': new_token,
                'file_details': file_details
            })
        else:
            context.error("Polling failed")
            return context.response.json({
                'success': False,
                'message': 'Polling failed'
            }, 500)
            
    except Exception as e:
        context.error(f"Error: {str(e)}")
        return context.response.json({
            'success': False,
            'message': str(e)
        }, 500)

def fetch_changes(saved_start_page_token):
    SCOPES = ["https://www.googleapis.com/auth/drive.metadata.readonly"]
    logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s")

    creds = Credentials(
        token=None,
        refresh_token=os.getenv("GOOGLE_REFRESH_TOKEN"),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.getenv("GOOGLE_CLIENT_ID"),
        client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
        scopes=SCOPES,
    )

    try:
        service = build("drive", "v3", credentials=creds)
        page_token = saved_start_page_token

        file_details = []
        while page_token is not None:
            response = service.changes().list(
                pageToken=page_token,
                spaces="drive",
                fields="nextPageToken, newStartPageToken, changes(fileId, file(name,createdTime, modifiedTime, mimeType, owners(displayName,emailAddress), webViewLink, parents), removed)"
            ).execute()
            
            for change in response.get("changes", []):
                if change.get("removed"):
                    logging.info("File removed: %s", change.get("fileId"))
                    file_details.append({
                        "fileId": change.get("fileId"),
                        "name": change.get("file", {}).get('name', 'Unknown'),
                        "removed": True
                    })
                else:
                    file = change.get("file")
                    parents = file.get("parents", [])
                    folder_id = os.getenv("FILE_ID")
                    
                    if folder_id in parents:
                        file_details.append({
                            "fileId": change.get("fileId"),
                            "name": file.get('name'),
                            "createdTime": file.get('createdTime'),
                            "modifiedTime": file.get('modifiedTime'),
                            "mimeType": file.get('mimeType'),
                            "webViewLink": file.get('webViewLink')
                        })

            if "newStartPageToken" in response:
                saved_start_page_token = response.get("newStartPageToken")
            
            page_token = response.get("nextPageToken")

    except HttpError as error:
        logging.error("Google API error: %s", error)
        return None, None 

    return saved_start_page_token, file_details
