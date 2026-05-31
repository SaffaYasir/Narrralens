from flask import Blueprint, request, jsonify, current_app
import os
import uuid
import pandas as pd

upload_bp = Blueprint('upload', __name__)

ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@upload_bp.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Only CSV and Excel files are supported"}), 400

    file_id = str(uuid.uuid4())
    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f"{file_id}.{ext}"
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    try:
        if ext == 'csv':
            # For large files, only read first 5 rows for preview
            df_preview = pd.read_csv(filepath, nrows=5)
            df_shape = pd.read_csv(filepath, usecols=[0])
            total_rows = len(df_shape)
            full_cols = pd.read_csv(filepath, nrows=0).columns.tolist()
        else:
            df_preview = pd.read_excel(filepath, nrows=5)
            df_full = pd.read_excel(filepath)
            total_rows = len(df_full)
            full_cols = df_full.columns.tolist()

        file_size_mb = round(os.path.getsize(filepath) / (1024 * 1024), 2)

        preview = {
            "file_id": file_id,
            "filename": file.filename,
            "rows": total_rows,
            "columns": len(full_cols),
            "column_names": full_cols,
            "dtypes": {col: str(dtype) for col, dtype in df_preview.dtypes.items()},
            "preview": df_preview.head(5).to_dict(orient='records'),
            "missing_values": df_preview.isnull().sum().to_dict(),
            "ext": ext,
            "file_size_mb": file_size_mb
        }
        return jsonify(preview)

    except Exception as e:
        os.remove(filepath)
        return jsonify({"error": f"Failed to parse file: {str(e)}"}), 400
