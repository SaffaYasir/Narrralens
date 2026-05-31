from flask import Blueprint, request, jsonify

chat_bp = Blueprint("chat", __name__)

@chat_bp.route("/chat", methods=["POST"])
def chat():
    data = request.json
    message = data.get("message", "")
    return jsonify({"reply": "AI response to: " + message})