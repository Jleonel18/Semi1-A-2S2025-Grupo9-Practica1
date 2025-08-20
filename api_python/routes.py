from flask import Blueprint, request, jsonify, current_app
from database import db
from models import Usuario
from auth import hash_password, verify_password
from functools import wraps
from s3 import upload_image_base64
import datetime
import jwt


routes = Blueprint("routes", __name__)

@routes.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get("Usuario")
    fullname = data.get("Nombre")
    password = data.get("Contrasena")
    profile_pic = data.get("Foto")  # base64

    # Validaciones
    if not all([username, fullname, password, profile_pic]):
        return jsonify({"error": "Todos los campos son obligatorios"}), 400

    # Validar si ya existe
    if Usuario.query.filter_by(usuario=username).first():
        return jsonify({"error": "El nombre de usuario ya existe"}), 400
    
    # Nombre del archivo en S3
    filename = f"Fotos_Perfil/{username}_perfil.jpg"
    url_foto = upload_image_base64(profile_pic, filename)

    if not url_foto:
        return jsonify({"error": "Error subiendo la imagen"}), 500
    
    print(f"Foto subida a S3: {url_foto}")

    # Crear usuario
    new_user = Usuario(
        usuario=username,
        nombre=fullname,
        contrasena=hash_password(password),
        foto=filename
    )
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "Usuario registrado exitosamente"}), 201


@routes.route("/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("Usuario")
    password = data.get("Contrasena")

    if not all([username, password]):
        return jsonify({"error": "Se requieren Usuario y Contrasena"}), 400

    user = Usuario.query.filter_by(usuario=username).first()
    if not user or not verify_password(password, user.contrasena):
        return jsonify({"error": "Credenciales inválidas"}), 401

    # Generar token
    payload = {
        "Id_Usuario": user.id_usuario,
        "Usuario": user.usuario,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)  # expira en 2h
    }
    token = jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")

    return jsonify({"message": "Login exitoso", "token": token})


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # Buscar el token en el header Authorization
        if "Authorization" in request.headers:
            auth_header = request.headers["Authorization"]
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]

        if not token:
            return jsonify({"error": "Token faltante"}), 401

        try:
            data = jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])
            current_user = Usuario.query.get(data["id_usuario"])
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expirado"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Token inválido"}), 401

        return f(current_user, *args, **kwargs)
    return decorated
