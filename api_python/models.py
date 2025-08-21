from tokenize import String
from database import db

class Usuario(db.Model):
    __tablename__ = "usuario"

    id_usuario = db.Column(db.Integer, primary_key=True)
    usuario = db.Column(db.String(50), unique=True, nullable=False)
    nombre = db.Column(db.String(70), nullable=False)
    contrasena = db.Column(db.String(200), nullable=False)  # en MD5
    foto = db.Column(db.String(150), nullable=False)  # ruta/URL de la foto en S3
    saldo = db.Column(db.Numeric(12, 2), nullable=False, default=0.00)

class Autor(db.Model):
    __tablename__ = "autor"
    id_autor = db.Column(db.Integer, primary_key=True, index=True)
    nombre = db.Column(db.String(70), nullable=False)


class Obra(db.Model):
    __tablename__ = "obra"
    id_obra = db.Column(db.Integer, primary_key=True, index=True)
    titulo = db.Column(db.String(50), nullable=False)
    id_autor = db.Column(db.Integer, db.ForeignKey("autor.id_autor"), nullable=False)
    anio_publicacion = db.Column(db.Date, nullable=False)
    disponibilidad = db.Column(db.Boolean, default=True)
    precio = db.Column(db.Numeric(12, 2), nullable=False, default=0.00)
    imagen = db.Column(db.String(150), nullable=False)  # ruta/URL de la imagen en S3
    id_usuario = db.Column(db.Integer, db.ForeignKey("usuario.id_usuario"), nullable=False)


class Adquisicion(db.Model):
    __tablename__ = "adquisicion"
    id_adquisicion = db.Column(db.Integer, primary_key=True, index=True)
    id_usuario = db.Column(db.Integer, db.ForeignKey("usuario.id_usuario"), nullable=False)
    id_obra = db.Column(db.Integer, db.ForeignKey("obra.id_obra"), nullable=False)
    fecha_adquisicion = db.Column(db.Date, nullable=False)