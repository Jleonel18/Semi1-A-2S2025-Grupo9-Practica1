from flask import Blueprint, request, jsonify, current_app
from database import db
from models import Usuario, Adquisicion, Obra, Autor
from auth import hash_password, verify_password, token_required
from functools import wraps
from s3 import upload_image_base64
from decimal import Decimal
import datetime
import jwt
from sqlalchemy import text


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

@routes.route("/user", methods=["GET"])
@token_required
def obtener_perfil(current_user):
    # Datos básicos del usuario
    perfil = {
        "nombre": current_user.nombre,
        "usuario": current_user.usuario,
        "foto": current_user.foto,
        "saldo": float(current_user.saldo),
        "obras": []
    }

    # Traer las adquisiciones del usuario
    adquisiciones = db.session.query(Adquisicion).filter_by(id_usuario=current_user.id_usuario).all()

    for aq in adquisiciones:
        obra = db.session.query(Obra).filter_by(id_obra=aq.id_obra).first()
        if obra:
            autor = db.session.query(Autor).filter_by(id_autor=obra.id_autor).first()
            perfil["obras"].append({
                "id": obra.id_obra,
                "titulo": obra.titulo,
                "autor": autor.nombre if autor else "",
                "publicacion": obra.año_publicacion.strftime("%Y-%m-%d"),
                "precio": float(obra.precio)
            })

    return jsonify(perfil)

@routes.route("/user/balance", methods=["POST"])
@token_required
def aumentar_saldo(current_user):
    data = request.get_json()
    if not data or "monto" not in data:
        return jsonify({"error": "Debe enviar el monto a agregar"}), 400

    try:
        monto = Decimal(str(data["monto"]))
        if monto <= 0:
            return jsonify({"error": "El monto debe ser mayor a cero"}), 400
    except ValueError:
        return jsonify({"error": "Monto inválido"}), 400

    # Actualizar saldo
    current_user.saldo += monto
    db.session.commit()

    return jsonify({
        "mensaje": f"Saldo aumentado correctamente.",
        "nuevoSaldo": float(current_user.saldo)
    })