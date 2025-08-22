from flask import Flask
from database import db
from routes import routes
from dotenv import load_dotenv
import os
from flask_cors import CORS

# Cargar .env
load_dotenv()

app = Flask(__name__)
CORS(app)


# Configuración PostgreSQL (cambia usuario/contraseña/db a los tuyos)
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")


# Inicializar DB
db.init_app(app)

with app.app_context():
    db.create_all()

# Registrar rutas
app.register_blueprint(routes, url_prefix="/api")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
