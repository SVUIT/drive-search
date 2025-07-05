# from flask import Flask, jsonify
from dotenv import load_dotenv
from function.fetch_changes import fetch_changes
from function.page_token_utils import read_start_page_token, save_start_page_token
import json 
load_dotenv()

# app = Flask(__name__)

# @app.route("/check-changes", methods=["GET"])
def main(context):
    try:
        saved_token = read_start_page_token()
        saved_token, file_details = fetch_changes(saved_start_page_token=saved_token)

        save_start_page_token(saved_token)
        context.log("page token: ", saved_token)
        if not file_details:
            message = "No changes detected"
            context.log("Message: ", message)
            return context.res.json({"message": "No changes detected", 
                            "page_token": saved_token
            })
        
        message = "Changes detected"
        context.log("Message: ", message)
        for file in file_details:
            if file.get("removed"):
                context.log(f"Đã xóa: {file['name']} (ID: {file['fileId']})")
            else:
                context.log(f" File: {file['name']}")
                context.log(f"   ├─ ID: {file['fileId']}")
                context.log(f"   ├─ Created: {file.get('createdTime')}")
                context.log(f"   ├─ Modified: {file.get('modifiedTime')}")
                context.log(f"   ├─ Link: {file.get('webViewLink')}")
                context.log(f"   └─ MIME: {file.get('mimeType')}")
        return context.res.json({
            "message": "Changes detected",
            "page_token": saved_token,
            "changes": file_details
        })

    except Exception as e:
        return context.res.json({"error": str(e)}), 500


# if __name__ == "__main__":
#     app.run(debug=True, port=5000)
