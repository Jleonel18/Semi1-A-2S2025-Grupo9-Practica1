from database import db

class Usuario(db.Model):
    __tablename__ = "usuario"

    id_usuario = db.Column(db.Integer, primary_key=True)
    usuario = db.Column(db.String(50), unique=True, nullable=False)
    nombre = db.Column(db.String(70), nullable=False)
    contrasena = db.Column(db.String(200), nullable=False)  # en MD5
    foto = db.Column(db.String(150), nullable=False)  # ruta/URL de la foto en S3
    saldo = db.Column(db.Numeric(12, 2), nullable=False, default=0.00)
