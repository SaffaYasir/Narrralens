from flask import Blueprint, request, jsonify, current_app
import os
from analysis_engine import run_full_analysis
from ai_narrator import generate_narrative

analyze_bp = Blueprint('analyze', __name__)

@analyze_bp.route('/analyze/<file_id>', methods=['GET'])
def analyze(file_id):
    upload_folder = current_app.config['UPLOAD_FOLDER']
    
    # Find the file
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
        analysis = run_full_analysis(filepath, ext)
        narrative = generate_narrative(analysis)
        
        return jsonify({
            "analysis": analysis,
            "narrative": narrative,
            "file_id": file_id
        })
    except Exception as e:
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500
