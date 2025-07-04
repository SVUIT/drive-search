import json
import os.path 

TOKEN_FILE = 'function/page_token.json'

def read_start_page_token():
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, 'r') as f:
            data = json.load(f)
            return data.get('startPageToken')
    return None

def save_start_page_token(token):
    with open(TOKEN_FILE, 'w') as f:
        json.dump({'startPageToken': token}, f)
