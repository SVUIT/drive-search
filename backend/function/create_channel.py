import requests
import json
import uuid 

def create_channel():
    ACCESS_TOKEN = ""
    # Start Page Token để bắt đầu theo dõi từ đó
    start_page_token = "51565"

    # Header cho yêu cầu API
    headers = {
        "Authorization": f"Bearer {ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }

    # Tạo webhook notification channel
    body = {
        "id": str(uuid.uuid4()),  # Channel ID (phải là unique UUID)
        "type": "web_hook", # Loại channel
        "address": ""  # Địa chỉ webhook để nhận thông báo                 
    }

    # Call api 
    url = f"https://www.googleapis.com/drive/v3/changes/watch?pageToken={start_page_token}" 
    try: 
        response = requests.post(url, headers=headers, json=body) # Gửi yêu cầu POST đến API
        if response.status_code == 200:
            print("Channel created successfully:")
            print(json.dumps(response.json(), indent=2))
        else:
            print("Failed to create channel:")
            print(response.status_code, response.text)
    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    create_channel()