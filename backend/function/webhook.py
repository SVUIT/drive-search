from flask import Flask, request

app = Flask(__name__)

@app.route('/notification', methods=['POST'])
def webhook():
    # Lấy các thông tin từ tiêu đề (headers) của thông báo
    channel_id = request.headers.get('X-Goog-Channel-ID')
    resource_id = request.headers.get('X-Goog-Resource-ID')
    resource_state = request.headers.get('X-Goog-Resource-State')
    message_number = request.headers.get('X-Goog-Message-Number')
    resource_uri = request.headers.get('X-Goog-Resource-URI')

    # In log ra màn hình để kiểm tra
    print(f'Channel ID: {channel_id}')
    print(f'Resource ID: {resource_id}')
    print(f'Resource State: {resource_state}')
    print(f'Message Number: {message_number}')
    print(f'Resource URI: {resource_uri}')
    return '', 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)