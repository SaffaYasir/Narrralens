from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
from dotenv import load_dotenv
from routes.upload import upload_bp
from routes.analyze import analyze_bp
from routes.report import report_bp
from routes.chat import chat_bp
from routes.auth import auth_bp

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads')
app.config['REPORTS_FOLDER'] = os.path.join(os.path.dirname(__file__), 'reports')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'datastory-secret-key-change-in-production')

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['REPORTS_FOLDER'], exist_ok=True)

app.register_blueprint(upload_bp, url_prefix='/api')
app.register_blueprint(analyze_bp, url_prefix='/api')
app.register_blueprint(report_bp, url_prefix='/api')
app.register_blueprint(chat_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api')

@app.route('/api/health')
def health():
    return jsonify({"status": "ok", "message": "NarraLens API is running"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
