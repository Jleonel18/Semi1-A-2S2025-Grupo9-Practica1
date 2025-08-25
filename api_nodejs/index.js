require('dotenv').config(); // Carga variables de entorno
const express = require('express');
const cors = require('cors'); // Para habilitar CORS
const { Pool } = require('pg');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const AWS = require('aws-sdk');

const app = express();
const port = 5000;

// ===== CORS =====
app.use(cors({
    origin: "http://localhost:5173", // URL de tu frontend Vite
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

// Middleware para parsear JSON con límite aumentado a 10MB
app.use(express.json({ limit: '10mb' }));

// Configura PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});


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


// Función para sanitizar nombres de archivos (remueve caracteres no válidos)
const sanitizeFileName = (name) => {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_');
};

// Middleware para verificar JWT
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ error: 'Token requerido' });
    }

    const token = authHeader.split(' ')[1]; // Espera 'Bearer <token>'
    if (!token) {
        return res.status(401).json({ error: 'Token inválido' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Almacena el usuario decodificado (incluye Id_Usuario y Usuario)
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
};

// ===== Endpoint para REGISTRO (/register) =====
app.post('/api/register', async (req, res) => {
    const { Usuario, Nombre, Contrasena, Foto } = req.body;

    if (!Usuario || !Nombre || !Contrasena || !Foto) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    try {
        const checkUser = await pool.query('SELECT COUNT(*) FROM Usuario WHERE Usuario = $1', [Usuario]);
        if (checkUser.rows[0].count > 0) return res.status(409).json({ error: 'El usuario ya existe' });

        const ContrasenaHash = hashMD5(Contrasena);
        const buffer = Buffer.from(Foto, 'base64');
        const key = `Fotos_Perfil/${Usuario}_perfil.jpg`;
        await s3.upload({ Bucket: process.env.AWS_BUCKET_NAME, Key: key, Body: buffer, ContentType: 'image/jpeg' }).promise();

        await pool.query(
            'INSERT INTO Usuario (Usuario, Nombre, Contrasena, Foto) VALUES ($1, $2, $3, $4)',
            [Usuario, Nombre, ContrasenaHash, key]
        );

        res.status(201).json({ message: 'Usuario registrado exitosamente' });
    } catch (error) {
        console.error('Error en /register:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// ===== Endpoint para LOGIN (/auth/login) =====
app.post('/api/auth/login', async (req, res) => {
    const { Usuario, Contrasena } = req.body;

    if (!Usuario || !Contrasena) {
        return res.status(400).json({ error: 'Usuario y Contrasena son obligatorios' });
    }

    try {
        const userResult = await pool.query('SELECT * FROM Usuario WHERE Usuario = $1', [Usuario]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const user = userResult.rows[0];

        const hashedInputPassword = hashMD5(Contrasena);
        if (hashedInputPassword !== user.contrasena) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { Id_Usuario: user.id_usuario, Usuario: user.usuario },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );


        res.json({ message: 'Login exitoso', token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});


// Nuevo Endpoint para OBTENER DATOS DEL USUARIO (/profile)
app.get('/api/user', verifyToken, async (req, res) => {
    const userId = req.user.Id_Usuario; // Obtiene el Id_Usuario del token decodificado


    try {
        // Obtiene los datos del usuario
        const userResult = await pool.query(
            'SELECT Nombre, Usuario, Saldo, Foto FROM Usuario WHERE Id_Usuario = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const userData = userResult.rows[0];

        // Obtiene las obras adquiridas por el usuario
        const obrasResult = await pool.query(
            `SELECT 
                Obra.Id_Obra AS id,
                Obra.Titulo AS titulo,
                Autor.Nombre AS autor,
                Obra.Anio_Publicacion AS publicacion,
                Adquisicion.Fecha_Adquisicion AS fecha_adquisicion,
                Obra.Precio AS precio,
                Obra.Imagen AS imagen
             FROM Adquisicion
             JOIN Obra ON Adquisicion.Id_Obra = Obra.Id_Obra
             JOIN Autor ON Obra.Id_Autor = Autor.Id_Autor
             WHERE Adquisicion.Id_Usuario = $1`,
            [userId]
        );

        const obras = obrasResult.rows;

        // Construye la respuesta
        const response = {
            nombre: userData.nombre,
            usuario: userData.usuario,
            saldo: userData.saldo,
            foto: "https://practica1-grupo9-imagenes.s3.us-east-2.amazonaws.com/" + userData.foto,
            obras: obras
        };

        res.json(response);
    } catch (error) {
        console.error('Error en /api/user:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});


//SUMAR SALDO 
app.post('/api/user/balance', verifyToken, async (req, res) => {
    const userId = req.user.Id_Usuario;
    console.log('Id_Usuario del token:', userId);
    
    try {

        const monto = parseFloat(req.body.monto);

        // Validación: monto debe ser un número positivo
        if (!monto || typeof monto !== 'number' || monto <= 0) {
            return res.status(400).json({ error: 'Monto debe ser un número positivo' });
        }
        // Verifica si el usuario existe
        const userResult = await pool.query('SELECT * FROM Usuario WHERE Id_Usuario = $1', [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        
        const currentSaldo = userResult.rows[0].saldo;
        

        // Actualiza el saldo sumando el monto
        const newSaldo = parseFloat(currentSaldo) + parseFloat(monto.toFixed(2));
        await pool.query(
            'UPDATE Usuario SET Saldo = $1 WHERE Id_Usuario = $2',
            [newSaldo, userId]
        );

        res.json({ message: 'Saldo aumentado correctamente', nuevoSaldo: newSaldo });
    } catch (error) {
        console.error('Error en /user/balance:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});



// Nuevo Endpoint para CREAR OBRA (/art/create)
app.post('/api/art/create', verifyToken, async (req, res) => {
    const userId = req.user.Id_Usuario;
    const { Titulo, Id_Autor, Anio_Publicacion, Precio, Imagen } = req.body;

    // Validación: Todos los campos son obligatorios
    if (!Titulo || !Id_Autor || !Anio_Publicacion || !Precio || !Imagen) {
        return res.status(400).json({ error: 'Titulo, Id_Autor, Anio_Publicacion, Precio e Imagen son obligatorios' });
    }

    // Validación: Precio debe ser no negativo
    if (typeof Precio !== 'number' || Precio < 0) {
        return res.status(400).json({ error: 'Precio debe ser un número no negativo' });
    }

    // Validación: Anio_Publicacion debe ser una fecha válida
    if (isNaN(Date.parse(Anio_Publicacion))) {
        return res.status(400).json({ error: 'Anio_Publicacion debe ser una fecha válida (YYYY-MM-DD)' });
    }

    try {
        // Verifica si el autor existe y obtiene su nombre
        const autorResult = await pool.query('SELECT Nombre FROM Autor WHERE Id_Autor = $1', [Id_Autor]);
        if (autorResult.rows.length === 0) {
            return res.status(404).json({ error: 'Autor no encontrado' });
        }

        const autorNombre = autorResult.rows[0].nombre;

        // Sube la imagen a S3
        const buffer = Buffer.from(Imagen, 'base64');
        const sanitizedTitulo = sanitizeFileName(Titulo);
        const sanitizedAutorNombre = sanitizeFileName(autorNombre);
        console.log('Sanitized Titulo:', sanitizedTitulo);
        console.log('Sanitized Autor Nombre:', sanitizedAutorNombre);
        const key = `Fotos_Publicadas/${sanitizedTitulo}_${sanitizedAutorNombre}.jpg`;
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: 'image/jpeg'
        };
        await s3.upload(params).promise();
        const ImagenRuta = key;


        // Inserta la obra en la DB
        const obraResult = await pool.query(
            'INSERT INTO Obra (Titulo, Id_Autor, Anio_Publicacion, Precio, Imagen, Id_Usuario) VALUES ($1, $2, $3, $4, $5, $6) RETURNING Id_Obra',
            [Titulo, Id_Autor, Anio_Publicacion, Precio, ImagenRuta, userId]
        );

        const obraId = obraResult.rows[0].Id_Obra;

        res.status(201).json({ 
            message: 'Obra creada exitosamente'
        });
    } catch (error) {
        console.error('Error en /api/art/create:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});


// Nuevo Endpoint para COMPRAR OBRA (/art/purchase)
app.post('/api/art/purchase/:Id_Obra', verifyToken, async (req, res) => {
    const compradorId = req.user.Id_Usuario;
    const Id_Obra = parseInt(req.params.Id_Obra, 10);

    // Validación: Id_Obra debe ser un número válido
    if (isNaN(Id_Obra) || Id_Obra <= 0) {
        return res.status(400).json({ error: 'Id_Obra debe ser un número válido' });
    }

    const client = await pool.connect(); // Inicia transacción
    try {
        await client.query('BEGIN');

        // Obtiene la obra con su precio, disponibilidad y dueño
        const obraResult = await client.query(
            'SELECT Precio, Disponibilidad, Id_Usuario FROM Obra WHERE Id_Obra = $1',
            [Id_Obra]
        );
        if (obraResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Obra no encontrada' });
        }

        const obra = obraResult.rows[0];
        const precio = parseFloat(obra.precio);
        const disponibilidad = obra.disponibilidad;
        const dueñoId = obra.id_usuario;

        // Validación: Precio debe ser un número válido
        if (isNaN(precio) || precio < 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'El precio de la obra no es válido' });
        }

        // Validación: Obra disponible
        if (!disponibilidad) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'La obra no está disponible' });
        }

        // Validación: No comprada por el mismo usuario
        if (compradorId === dueñoId) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'No puedes comprar tu propia obra' });
        }

        // Obtiene el saldo del comprador
        const compradorSaldoResult = await client.query('SELECT Saldo FROM Usuario WHERE Id_Usuario = $1', [compradorId]);
        if (compradorSaldoResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Usuario comprador no encontrado' });
        }

        const saldoComprador = parseFloat(compradorSaldoResult.rows[0].saldo);
        if (isNaN(saldoComprador)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'El saldo del comprador no es válido' });
        }

        // Validación: Saldo suficiente
        if (saldoComprador < precio) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Saldo insuficiente' });
        }

        // Obtiene el saldo del dueño
        const dueñoSaldoResult = await client.query('SELECT Saldo FROM Usuario WHERE Id_Usuario = $1', [dueñoId]);
        if (dueñoSaldoResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Dueño de la obra no encontrado' });
        }

        const saldoDueño = parseFloat(dueñoSaldoResult.rows[0].saldo);
        if (isNaN(saldoDueño)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'El saldo del dueño no es válido' });
        }

        // Actualiza el saldo del comprador
        const nuevoSaldoComprador = (saldoComprador - precio).toFixed(2);
        await client.query(
            'UPDATE Usuario SET Saldo = $1 WHERE Id_Usuario = $2',
            [nuevoSaldoComprador, compradorId]
        );

        // Actualiza el saldo del dueño
        const nuevoSaldoDueño = (saldoDueño + precio).toFixed(2);
        await client.query(
            'UPDATE Usuario SET Saldo = $1 WHERE Id_Usuario = $2',
            [nuevoSaldoDueño, dueñoId]
        );

        // Marca la obra como no disponible
        await client.query(
            'UPDATE Obra SET Disponibilidad = FALSE WHERE Id_Obra = $1',
            [Id_Obra]
        );

        // Registra la adquisición
        const fechaActual = new Date().toISOString().split('T')[0]; // Fecha actual en YYYY-MM-DD
        await client.query(
            'INSERT INTO Adquisicion (Id_Usuario, Id_Obra, Fecha_Adquisicion) VALUES ($1, $2, $3)',
            [compradorId, Id_Obra, fechaActual]
        );

        await client.query('COMMIT');

        res.json({ message: 'Obra adquirida exitosamente', saldo_restante: parseFloat(nuevoSaldoComprador) });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en /api/art/purchase:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    } finally {
        client.release();
    }
});


app.get('/api/gallery', verifyToken, async (req, res) => {
    try {
      const obrasResult = await pool.query(
        `SELECT 
            obra.id_obra,
            autor.nombre AS autor,
            usuario.usuario AS creador,
            obra.anio_publicacion,
            obra.imagen,
            obra.titulo,
            obra.precio,
            obra.disponibilidad,
            obra.id_usuario
         FROM obra
         JOIN autor ON obra.id_autor = autor.id_autor
         JOIN usuario ON obra.id_usuario = usuario.id_usuario`
      );
  
      const obras = obrasResult.rows.map((obra) => ({
        ...obra,
        disponibilidad: obra.disponibilidad === true || obra.disponibilidad === 't' // asegura boolean
      }));
  
      res.json({ obras });
    } catch (error) {
      console.error('Error en /gallery:', error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  });
  

app.get('/api/my-art', verifyToken, async (req, res) => {
    const userId = req.user.Id_Usuario;
  
    try {
      const obrasResult = await pool.query(
        `SELECT 
            obra.id_obra,
            autor.nombre AS autor,
            usuario.usuario AS creador,
            obra.anio_publicacion,
            obra.imagen,
            obra.titulo,
            obra.precio,
            obra.disponibilidad
         FROM obra
         JOIN autor ON obra.id_autor = autor.id_autor
         JOIN usuario ON obra.id_usuario = usuario.id_usuario
         WHERE obra.id_usuario = $1`,
        [userId]
      );
      
  
      res.json({ obras: obrasResult.rows });
    } catch (error) {
      console.error('Error en /my-art:', error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  });
  


// Nuevo Endpoint para OBTENER OBRA POR ID (/art/:Id_Obra)
app.get('/api/gallery/:Id_Obra', verifyToken, async (req, res) => {
    const {Id_Obra} = req.params;
    

    try {
        // Obtiene la obra con su autor y usuario creador
        const obraResult = await pool.query(
            `SELECT 
                Obra.Id_Obra AS id_obra,
                Obra.Titulo AS titulo,
                Autor.Nombre AS autor,
                Usuario.Usuario AS creador,
                Obra.Anio_Publicacion AS anio_publicacion,
                Obra.Precio AS precio,
                Obra.Disponibilidad AS disponibilidad,
                Obra.Imagen AS imagen
             FROM Obra
             JOIN Autor ON Obra.Id_Autor = Autor.Id_Autor
             JOIN Usuario ON Obra.Id_Usuario = Usuario.Id_Usuario
             WHERE Obra.Id_Obra = $1`,
            [Id_Obra]
        );

        if (obraResult.rows.length === 0) {
            return res.status(404).json({ error: 'Obra no encontrada' });
        }

        const obra = obraResult.rows[0];

        res.json({ obra });
    } catch (error) {
        console.error('Error en /art/:Id_Obra:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});


// Endpoint para EDITAR PERFIL (/profile)
app.put('/api/profile', verifyToken, async (req, res) => {
    const userId = req.user.Id_Usuario;
    const { Usuario, Nombre, Foto, Contrasena } = req.body;

    // Validación: Contraseña es obligatoria
    if (!Contrasena) {
        return res.status(400).json({ error: 'Contrasena es obligatoria para editar el perfil' });
    }

    // Validación: Al menos un campo para actualizar
    if (!Usuario && !Nombre && !Foto) {
        return res.status(400).json({ error: 'Debe proporcionar al menos un campo para actualizar (Usuario, Nombre o Foto)' });
    }

    try {
        // Verifica la contraseña del usuario
        const userResult = await pool.query(
            'SELECT Contrasena FROM Usuario WHERE Id_Usuario = $1',
            [userId]
        );
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const hashedInputPassword = hashMD5(Contrasena);
        if (hashedInputPassword !== userResult.rows[0].contrasena) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        // Construye la consulta de actualización dinámicamente
        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (Usuario) {
            // Validación: Verificar si el nuevo nombre de usuario ya existe
            const checkUser = await pool.query(
                'SELECT COUNT(*) FROM Usuario WHERE Usuario = $1 AND Id_Usuario != $2',
                [Usuario, userId]
            );
            if (checkUser.rows[0].count > 0) {
                return res.status(409).json({ error: 'El nombre de usuario ya existe' });
            }
            // Validación: Usuario debe ser un string no vacío
            if (typeof Usuario !== 'string' || Usuario.trim() === '') {
                return res.status(400).json({ error: 'Usuario debe ser un string no vacío' });
            }
            updates.push(`Usuario = $${paramIndex++}`);
            values.push(Usuario);
        }

        if (Nombre) {
            // Validación: Nombre debe ser un string no vacío
            if (typeof Nombre !== 'string' || Nombre.trim() === '') {
                return res.status(400).json({ error: 'Nombre debe ser un string no vacío' });
            }
            updates.push(`Nombre = $${paramIndex++}`);
            values.push(Nombre);
        }

        if (Foto) {
            // Sube la nueva imagen a S3
            const buffer = Buffer.from(Foto, 'base64');
            const key = `Fotos_Perfil/${sanitizeFileName(Usuario || req.user.Usuario)}_perfil.jpg`;
            const params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: key,
                Body: buffer,
                ContentType: 'image/jpeg'
            };
            await s3.upload(params).promise();
            updates.push(`Foto = $${paramIndex++}`);
            values.push(key);
        }

        // Si no hay campos para actualizar, no debería llegar aquí, pero por seguridad
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No se proporcionaron campos válidos para actualizar' });
        }

        // Actualiza el usuario en la base de datos
        values.push(userId);
        const query = `UPDATE Usuario SET ${updates.join(', ')} WHERE Id_Usuario = $${paramIndex}`;
        await pool.query(query, values);

        // Obtiene los datos actualizados del usuario
        const updatedUserResult = await pool.query(
            'SELECT Nombre, Usuario, Saldo, Foto FROM Usuario WHERE Id_Usuario = $1',
            [userId]
        );
        const updatedUser = updatedUserResult.rows[0];

        res.json({
            message: 'Perfil actualizado exitosamente',
            usuario: {
                nombre: updatedUser.nombre,
                usuario: updatedUser.usuario,
                saldo: updatedUser.saldo,
                foto: updatedUser.foto
            }
        });
    } catch (error) {
        console.error('Error en /profile (PUT):', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Endpoint para OBTENER AUTORES (/api/authors)
app.get('/api/authors', verifyToken, async (req, res) => {
    try {
        const authorsResult = await pool.query('SELECT * FROM Autor');
        res.json({ authors: authorsResult.rows });
    } catch (error) {
        console.error('Error en /api/authors:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// ===== Inicia el servidor =====
app.listen(port, () => {
    console.log(`API corriendo en http://localhost:${port}`);
});
