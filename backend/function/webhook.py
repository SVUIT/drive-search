from flask import Flask, request
from fetch_changes import fetch_changes
from page_token_utils import read_start_page_token, save_start_page_token
from fetch_start_page_token import fetch_start_page_token
app = Flask(__name__)

@app.route('/notification', methods=['POST'])
def webhook():
    # Lấy các thông tin từ tiêu đề (headers) của thông báo
    channel_id = request.headers.get('X-Goog-Channel-ID')
    resource_id = request.headers.get('X-Goog-Resource-ID')
    resource_state = request.headers.get('X-Goog-Resource-State')
    message_number = request.headers.get('X-Goog-Message-Number')
    resource_uri = request.headers.get('X-Goog-Resource-URI')
    
    resource_change = request.headers.get('X-Goog-Changed') if resource_state == 'update' else ''
    if resource_change:
        change_types = [c.strip() for c in resource_change.split(',')]
    # In log ra màn hình để kiểm tra
    print(f'  Channel ID: {channel_id}')
    print(f'  Resource ID: {resource_id}')
    print(f'  Resource State: {resource_state}')
    print(f'  Message Number: {message_number}')
    print(f'  Resource URI: {resource_uri}')
    if resource_change:
        print(f'  Resource Change: {", ".join(change_types)}')
    print('\n')

    if not read_start_page_token():
      page_token, _ = fetch_start_page_token()
    else:
      page_token = read_start_page_token()
    next_page_token, access_token = fetch_changes(page_token) 
    return '', 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)