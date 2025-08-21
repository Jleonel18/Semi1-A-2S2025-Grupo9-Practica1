import hashlib
from flask import request, jsonify, current_app
import jwt
import os
from functools import wraps
from sqlalchemy.orm import Session
from models import Usuario  # Asegúrate de tener importado tu modelo Usuari
from database import db

def hash_password(password: str) -> str:
    return hashlib.md5(password.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        if "Authorization" in request.headers:
            auth_header = request.headers["Authorization"]
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]

        if not token:
            return jsonify({"error": "Token es requerido"}), 401

        try:
            data = jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])
            user_id = data["Id_Usuario"]
            current_user = db.session.query(Usuario).filter_by(id_usuario=user_id).first()

            if not current_user:
                return jsonify({"error": "Usuario no encontrado"}), 404

        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expirado"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Token inválido"}), 401

        return f(current_user, *args, **kwargs)
    return decorated