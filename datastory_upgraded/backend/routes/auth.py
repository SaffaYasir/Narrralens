from flask import Blueprint, request, jsonify, current_app
import hashlib
import json
import os
import uuid
import time

auth_bp = Blueprint('auth', __name__)

USERS_FILE = os.path.join(os.path.dirname(__file__), '..', 'users.json')

def load_users():
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_users(users):
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f)

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token(user_id):
    raw = f"{user_id}:{time.time()}:{uuid.uuid4()}"
    return hashlib.sha256(raw.encode()).hexdigest()

@auth_bp.route('/auth/signup', methods=['POST'])
def signup():
    data = request.get_json()
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()

    if not name or not email or not password:
        return jsonify({"error": "Name, email, and password are required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    users = load_users()
    if email in users:
        return jsonify({"error": "An account with this email already exists"}), 409

    user_id = str(uuid.uuid4())
    token = generate_token(user_id)
    users[email] = {
        "id": user_id,
        "name": name,
        "email": email,
        "password": hash_password(password),
        "token": token,
        "created_at": time.time(),
        "uploads": []
    }
    save_users(users)

    return jsonify({
        "token": token,
        "user": {"id": user_id, "name": name, "email": email}
    })

@auth_bp.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    users = load_users()
    user = users.get(email)
    if not user or user['password'] != hash_password(password):
        return jsonify({"error": "Invalid email or password"}), 401

    token = generate_token(user['id'])
    user['token'] = token
    save_users(users)

    return jsonify({
        "token": token,
        "user": {"id": user['id'], "name": user['name'], "email": email}
    })

@auth_bp.route('/auth/me', methods=['GET'])
def me():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return jsonify({"error": "Not authenticated"}), 401

    users = load_users()
    for email, user in users.items():
        if user.get('token') == token:
            return jsonify({"user": {"id": user['id'], "name": user['name'], "email": email}})

    return jsonify({"error": "Invalid token"}), 401
