require('dotenv').config(); // Carga las variables de entorno desde .env
const express = require('express'); // Framework para el servidor
const { Pool } = require('pg'); // Conexión a PostgreSQL
const crypto = require('crypto'); // Para hashear con MD5
const jwt = require('jsonwebtoken'); // Para generar tokens JWT
const AWS = require('aws-sdk'); // Para S3 (mantenido para futura activación)
const app = express();
const port = 5000;

// Configura la conexión a PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// Middleware para parsear cuerpos JSON
app.use(express.json());

// Configura AWS S3 (comentado hasta que configures el bucket)
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

// Función para hashear contraseñas en MD5
const hashMD5 = (text) => {
    return crypto.createHash('md5').update(text).digest('hex');
};

// Endpoint para REGISTRO (/register)
app.post('/api/register', async (req, res) => {
const { Usuario, Nombre, Contrasena, Foto } = req.body; // Recibe Foto como base64

    // Validación: Todos los campos son obligatorios
    if (!Usuario || !Nombre || !Contrasena || !Foto) {
        return res.status(400).json({ error: 'Usuario, Nombre, Contrasena y Foto son obligatorios' });
    }

    try {
        // Verifica si el usuario ya existe
        const checkUser = await pool.query('SELECT COUNT(*) FROM Usuario WHERE Usuario = $1', [Usuario]);
        if (checkUser.rows[0].count > 0) {
            return res.status(409).json({ error: 'El nombre de usuario ya existe' });
        }

        // Hashea la contraseña con MD5
        const ContrasenaHash = hashMD5(Contrasena);

        // Sube la imagen a S3
        const buffer = Buffer.from(Foto, 'base64'); // Convierte base64 a buffer
        const key = `Fotos_Perfil/${Usuario}_perfil.jpg`; // Ruta en S3: Fotos_Perfil/{Usuario}_perfil.jpg
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: 'image/jpeg'
        };
        await s3.upload(params).promise(); // Sube la imagen a S3
        const FotoRuta = key; // Almacena la ruta relativa en la DB

        // Inserta el usuario en la DB (Saldo usa el valor por defecto 0.00)
        await pool.query(
            'INSERT INTO Usuario (Usuario, Nombre, Contrasena, Foto) VALUES ($1, $2, $3, $4)',
            [Usuario, Nombre, ContrasenaHash, FotoRuta]
        );

        res.status(201).json({ message: 'Usuario registrado exitosamente' });
    } catch (error) {
        console.error('Error en /register:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Endpoint para LOGIN (/login)
app.post('/api/auth/login', async (req, res) => {
    const { Usuario, Contrasena } = req.body;

    // Validación: Campos obligatorios
    if (!Usuario || !Contrasena) {
        return res.status(400).json({ error: 'Usuario y Contrasena son obligatorios' });
    }

    try {
        // Busca el usuario
        const userResult = await pool.query('SELECT * FROM Usuario WHERE Usuario = $1', [Usuario]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas 1' });
        }

        const user = userResult.rows[0];
        console.log(user);

       // Hashea la contraseña ingresada (texto plano) y compárala con el hash almacenado
        const hashedInputPassword = hashMD5(Contrasena);
        // Log temporal para depuración (puedes eliminarlo después)
        console.log('Contraseña ingresada (hash):', hashedInputPassword);
        console.log('Contraseña almacenada:', user.contrasena);
        if (hashedInputPassword !== user.contrasena) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Genera token JWT
        const token = jwt.sign(
            { Id_Usuario: user.Id_Usuario, Usuario: user.Usuario },
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // Expira en 1 hora
        );

        res.json({ message: 'Login exitoso', token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Inicia el servidor
app.listen(port, () => {
    console.log(`API corriendo en http://localhost:${port}`);
});