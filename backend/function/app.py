# main.py
import time
from dotenv import load_dotenv
from function.fetch_changes import fetch_changes
from function.page_token_utils import read_start_page_token

load_dotenv()

def background_change_checker():
    interval = 30  # Kiểm tra mỗi 3 giây
    saved_token = read_start_page_token()
    print("[Background] Bắt đầu kiểm tra thay đổi...")

    while True:
        try:
            saved_token, file_details = fetch_changes(saved_start_page_token=saved_token)

            if file_details:
                print("✅ Có thay đổi mới!")
                for file in file_details:
                    if file.get("removed"):
                        print(f"🗑️  Đã xóa: {file['name']} (ID: {file['fileId']})")
                    else:
                        print(f"📄 File: {file['name']}")
                        print(f"   ├─ ID: {file['fileId']}")
                        print(f"   ├─ Created: {file.get('createdTime')}")
                        print(f"   ├─ Modified: {file.get('modifiedTime')}")
                        print(f"   ├─ Link: {file.get('webViewLink')}")
                        print(f"   └─ MIME: {file.get('mimeType')}")
                # TODO: xử lý thay đổi ở đây
                # saved_token = page_token  # nếu cần cập nhật token

            else:
                print("Không có thay đổi.")

        except Exception as e:
            print("Lỗi:", e)

        time.sleep(interval)

# if __name__ == "__main__":
#     background_change_checker()
