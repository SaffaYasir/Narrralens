from flask import Blueprint, request, jsonify, current_app
import os
from analysis_engine import run_full_analysis
from ai_narrator import generate_followup_answer

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/chat/<file_id>', methods=['POST'])
def chat(file_id):
    data = request.get_json()
    question = data.get('question', '').strip()
    history = data.get('history', [])
    
    if not question:
        return jsonify({"error": "No question provided"}), 400
    
    upload_folder = current_app.config['UPLOAD_FOLDER']
    filepath = None
    ext = None
    for f in os.listdir(upload_folder):
        if f.startswith(file_id):
            filepath = os.path.join(upload_folder, f)
            ext = f.rsplit('.', 1)[1].lower()
            break
    
    if not filepath:
        return jsonify({"error": "File not found"}), 404
    
    try:
        # Use cached/lightweight analysis for chat
        analysis = run_full_analysis(filepath, ext, lightweight=True)
        answer = generate_followup_answer(question, analysis, history)
        return jsonify({"answer": answer})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
