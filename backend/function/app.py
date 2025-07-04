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
        if not file_details:
            return context.res.json({"message": "No changes detected", 
                            "page_token": saved_token
            })

        return context.res.json({
            "message": "Changes detected",
            "page_token": saved_token,
            "changes": file_details
        })

    except Exception as e:
        return context.res.json({"error": str(e)})


# if __name__ == "__main__":
#     app.run(debug=True, port=5000)
