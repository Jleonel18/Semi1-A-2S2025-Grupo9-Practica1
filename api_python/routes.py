from flask import Blueprint, request, jsonify, current_app
from database import db
from models import Usuario, Adquisicion, Obra, Autor
from auth import hash_password, verify_password, token_required
from functools import wraps
from s3 import upload_image_base64
from decimal import Decimal
from datetime import datetime as dt
import datetime
import jwt
from sqlalchemy import text
import os
BUCKET_NAME = os.getenv("AWS_BUCKET_NAME")


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
    token = jwt.encode(
        payload, current_app.config["SECRET_KEY"], algorithm="HS256")

    return jsonify({"message": "Login exitoso", "token": token})


@routes.route("/user", methods=["GET"])
@token_required
def obtener_perfil(current_user):

    # URL completa de la foto
    foto_url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{current_user.foto}?t={int(datetime.datetime.utcnow().timestamp())}"

    # Datos básicos del usuario
    perfil = {
        "nombre": current_user.nombre,
        "usuario": current_user.usuario,
        "foto": foto_url,
        "saldo": float(current_user.saldo),
        "obras": []
    }

    # Traer las adquisiciones del usuario
    adquisiciones = db.session.query(Adquisicion).filter_by(
        id_usuario=current_user.id_usuario).all()

    for aq in adquisiciones:
        obra = db.session.query(Obra).filter_by(id_obra=aq.id_obra).first()
        if obra:
            autor = db.session.query(Autor).filter_by(
                id_autor=obra.id_autor).first()
            perfil["obras"].append({
                "id": obra.id_obra,
                "titulo": obra.titulo,
                "autor": autor.nombre if autor else "",
                "publicacion": obra.anio_publicacion.strftime("%Y-%m-%d"),
                "precio": float(obra.precio),
                "fecha_adquisicion": aq.fecha_adquisicion.strftime("%Y-%m-%d")
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
        "message": f"Saldo aumentado correctamente.",
        "nuevoSaldo": float(current_user.saldo)
    })


@routes.route("/art/create", methods=["POST"])
@token_required
def crear_obra(current_user):
    try:
        data = request.get_json()

        titulo = data.get("Titulo")
        id_autor = data.get("Id_Autor")
        anio_publicacion = data.get("Anio_Publicacion")  # formato yyyy-mm-dd
        precio = data.get("Precio")
        imagen_base64 = data.get("Imagen")

        if not all([titulo, id_autor, anio_publicacion, precio, imagen_base64]):
            return jsonify({"error": "Todos los campos son obligatorios"}), 400

        # Nombre del archivo en S3
        # Limpiar espacios de titulo
        titulo_sinespacios = titulo.strip().replace(" ", "_")
        filename = f"Fotos_Publicadas/{titulo_sinespacios}_{id_autor}_obra.jpg"
        url_foto = upload_image_base64(imagen_base64, filename)

        if not url_foto:
            return jsonify({"error": "Error subiendo la imagen"}), 500

        print(f"Foto subida a S3: {url_foto}")

        # Crear objeto Obra
        nueva_obra = Obra(
            titulo=titulo,
            id_autor=int(id_autor),
            anio_publicacion=dt.strptime(anio_publicacion, "%Y-%m-%d").date(),
            precio=Decimal(precio),
            imagen=filename,
            id_usuario=int(current_user.id_usuario)
        )

        db.session.add(nueva_obra)
        db.session.commit()

        return jsonify({
            "message": "Obra creada exitosamente"
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@routes.route('/art/purchase/<int:id_obra>', methods=['POST'])
@token_required
def adquirir_obra(current_user, id_obra):
    try:
        # Buscar la obra
        obra = Obra.query.get(id_obra)
        if not obra:
            return jsonify({"error": "La obra no existe"}), 404

        # Validar que la obra esté disponible
        if not obra.disponibilidad:
            return jsonify({"error": "La obra ya no está disponible"}), 400

        # Validar que el usuario no sea el creador
        if obra.id_usuario == current_user.id_usuario:
            return jsonify({"error": "No puedes adquirir una obra que tú mismo creaste"}), 400

        # Validar que el usuario tenga saldo suficiente
        if current_user.saldo < obra.precio:
            return jsonify({"error": "Saldo insuficiente"}), 400

        # Buscar al creador de la obra
        creador = Usuario.query.get(obra.id_usuario)
        if not creador:
            return jsonify({"error": "El creador de la obra no existe"}), 404

        # --- Realizar transacciones ---
        # Restar saldo al comprador
        current_user.saldo -= obra.precio

        # Aumentar saldo al creador
        creador.saldo += obra.precio

        # Cambiar disponibilidad de la obra
        obra.disponibilidad = False

        nueva_adquisicion = Adquisicion(
            id_usuario=current_user.id_usuario,
            id_obra=obra.id_obra,
            fecha_adquisicion=dt.utcnow().date()
        )
        db.session.add(nueva_adquisicion)

        db.session.commit()

        return jsonify({"message": "Obra adquirida exitosamente", "saldo_restante": float(current_user.saldo)}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@routes.route("/gallery", methods=["GET"])
@token_required
def obtener_obras_disponibles(current_user):
    try:
        # Obtener todas las obras disponibles excepto las del usuario logueado
        obras = (
            db.session.query(Obra, Autor, Usuario)
            .join(Autor, Obra.id_autor == Autor.id_autor)
            .join(Usuario, Obra.id_usuario == Usuario.id_usuario)
            .filter(Obra.disponibilidad == True)
            # .filter(Obra.id_usuario != current_user.id_usuario)  # Uncomment if needed
            .all()
        )

        resultados = []
        for obra, autor, usuario in obras:
            resultados.append({
                "id_obra": obra.id_obra,
                "titulo": obra.titulo,
                "autor": autor.nombre,  # Asumiendo que Autor tiene el campo nombre
                "anio_publicacion": obra.anio_publicacion.strftime("%Y-%m-%d") if obra.anio_publicacion else None,
                "precio": float(obra.precio) if obra.precio is not None else None,
                "imagen": obra.imagen,
                "creador": usuario.usuario,  # Asumiendo que Usuario tiene el campo usuario
                # Asegura booleano
                "disponibilidad": obra.disponibilidad in (True, 't', 1),
                "id_usuario": obra.id_usuario
            })

        return jsonify({"obras": resultados}), 200

    except Exception as e:
        print(f"Error en /gallery: {str(e)}")  # Log del error para depuración
        return jsonify({"error": "Error en el servidor"}), 500


@routes.route("/gallery/<int:id_obra>", methods=["GET"])
@token_required
def obtener_obra(current_user, id_obra):
    try:
        # Buscar la obra con join a Autor y Usuario
        obra = (
            db.session.query(Obra, Autor, Usuario)
            .join(Autor, Obra.id_autor == Autor.id_autor)
            .join(Usuario, Obra.id_usuario == Usuario.id_usuario)
            .filter(Obra.id_obra == id_obra)
            .first()
        )

        if not obra:
            return jsonify({"error": "La obra no existe"}), 404

        obra_data, autor, usuario = obra

        resultado = {
            "id_obra": obra_data.id_obra,
            "titulo": obra_data.titulo,
            "autor": autor.nombre,
            "anio_publicacion": obra_data.anio_publicacion.strftime("%Y-%m-%d"),
            "precio": float(obra_data.precio),
            "imagen": obra_data.imagen,
            "disponibilidad": obra_data.disponibilidad,
            "creador": usuario.usuario
        }

        return jsonify(resultado), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@routes.route("/profile", methods=["PUT"])
@token_required
def editar_perfil(current_user):
    try:
        data = request.get_json()
        nuevo_usuario = data.get("Usuario")
        nuevo_nombre = data.get("Nombre")
        nueva_foto_base64 = data.get("Foto")
        password = data.get("Contrasena")

        # Validar contraseña (MD5)
        import hashlib
        if hashlib.md5(password.encode()).hexdigest() != current_user.contrasena:
            return jsonify({"error": "Contraseña incorrecta"}), 401

        # Validar que el nuevo usuario no exista ya
        if nuevo_usuario and nuevo_usuario != current_user.usuario:
            existente = Usuario.query.filter_by(usuario=nuevo_usuario).first()
            if existente:
                return jsonify({"error": "El nombre de usuario ya está en uso"}), 400
            current_user.usuario = nuevo_usuario

        # Cambiar nombre si se envió
        if nuevo_nombre:
            current_user.nombre = nuevo_nombre

        # Cambiar foto si se envió
        if nueva_foto_base64:
            filename = f"Fotos_Perfil/{current_user.usuario}_perfil.jpg"
            url_foto = upload_image_base64(nueva_foto_base64, filename)

            if not url_foto:
                return jsonify({"error": "Error subiendo la imagen"}), 500

            print(f"Foto actualizada en S3: {url_foto}")
            # current_user.foto = filename
            current_user.foto = filename  # guardamos el nombre en la DB
            foto_url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{current_user.foto}?t={int(datetime.datetime.utcnow().timestamp())}"

        db.session.commit()

        return jsonify({
            "mensaje": "Perfil actualizado exitosamente",
            "usuario": {
                "usuario": current_user.usuario,
                "nombre": current_user.nombre,
                "foto": foto_url,
                "saldo": float(current_user.saldo)
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@routes.route('/my-art', methods=['GET'])
@token_required
def obtener_mis_obras(current_user):
    try:
        # Obtener todas las obras creadas por el usuario logeado
        obras = db.session.query(Obra, Autor, Usuario)\
            .join(Autor, Obra.id_autor == Autor.id_autor)\
            .join(Usuario, Obra.id_usuario == Usuario.id_usuario)\
            .filter(Obra.id_usuario == current_user.id_usuario)\
            .all()

        resultado = []
        for obra, autor, usuario in obras:
            resultado.append({
                "id_obra": obra.id_obra,
                "titulo": obra.titulo,
                "autor": autor.nombre,  # suponiendo que en Autor el campo es Nombre
                "anio_publicacion": obra.anio_publicacion.strftime("%Y-%m-%d"),
                "disponibilidad": obra.disponibilidad,
                "precio": float(obra.precio),
                "imagen": obra.imagen,
                "creador": usuario.usuario  # nombre del usuario que creó la obra
            })

        return jsonify({"obras": resultado}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    
@routes.route("/authors", methods=["GET"])
@token_required
def obtener_autores(current_user):
    try:
        authors = Autor.query.all()
        resultados = [{
            "id_autor": autor.id_autor,
            "nombre": autor.nombre
        } for autor in authors]
        return jsonify({"authors": resultados}), 200
    except Exception as e:
        print(f"Error en /authors: {str(e)}")
        return jsonify({"error": "Error en el servidor"}), 500
