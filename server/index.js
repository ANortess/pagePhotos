// server/index.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'; // Importa dotenv
import mysql2 from 'mysql2/promise';
import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary'; // 🔥 Nuevo
import multer from 'multer';

// Carga las variables de entorno del archivo .env
dotenv.config();

const app = express();

const FRONTEND_URL = process.env.MYSQL_URLFRONTEND || '*'; 

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', FRONTEND_URL);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200); 
    }

    next();
});

// Middleware para parsear el cuerpo de las peticiones JSON
app.use(express.json());

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🔥 CONFIGURACIÓN DE MULTER para almacenar en MEMORIA (la opción escalable)
const memoryStorage = multer.memoryStorage();
const upload = multer({ 
    storage: memoryStorage,
    limits: { fileSize: 10 * 1024 * 1024 } // Límite de 10MB
});

// --- Configuración de la Conexión a MySQL ---
const dbConfig = {
    host: process.env.MYSQL_HOST || 'centerbeam.proxy.rlwy.net',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'OyZfHJcIUlWYRZOpuBTAdMvFKjzRXOBC',
    database: process.env.MYSQL_DATABASE || 'railway',
    port: process.env.MYSQL_PORT || 59476,
};
//mysql://root:OyZfHJcIUlWYRZOpuBTAdMvFKjzRXOBC@centerbeam.proxy.rlwy.net:59476/railway
let pool; // Usaremos un pool de conexiones para mejor rendimiento

async function connectToDb() {
    try {
        pool = mysql2.createPool(dbConfig);
        // Intenta una conexión para verificar que funciona
        await pool.getConnection();
        console.log('Conectado a MySQL');

        // --- Crear tabla de usuarios si no existe ---
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Tabla de usuarios verificada/creada');
        
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS albums (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,  /* Clave foránea: a qué usuario pertenece el álbum */
                title VARCHAR(255) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                cover_photo_url VARCHAR(512),
                
                /* Definir la clave foránea que enlaza con la tabla users */
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('Tabla de álbumes verificada/creada');

        await pool.execute(`
        CREATE TABLE IF NOT EXISTS photos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            album_id INT NOT NULL, /* Clave foránea: a qué álbum pertenece */
            user_id INT NOT NULL,  
            url VARCHAR(512) NOT NULL,    /* 🔥 Almacenará la URL pública de Cloudinary */
            public_id VARCHAR(255) NOT NULL, /* ID de Cloudinary para poder borrarla */
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);
    console.log('Tabla de fotos verificada/creada');

    } catch (err) {
        console.error('Error al conectar o inicializar MySQL:', err);
    }
}

connectToDb();

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'Token no proporcionado.' });
    }

    const token = authHeader.split(' ')[1]; // Espera formato "Bearer TOKEN"
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id; // 🔥 Adjuntamos el ID del usuario a la solicitud
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Token inválido o expirado.' });
    }
};

app.post('/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email y contraseña son requeridos.' });
    }

    try {
        // Verificar si el usuario ya existe en la base de datos
        const [rows] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (rows.length > 0) {
            return res.status(409).json({ message: 'El email ya existe' });
        }

        // Hashear la contraseña antes de guardarla
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertar el nuevo usuario en la base de datos
        const [result] = await pool.execute(
            'INSERT INTO users (email, password_hash) VALUES (?, ?)',
            [email, hashedPassword]
        );
        const newUserId = result.insertId; // Obtener el ID del usuario recién insertado

        // Generar un token JWT para el nuevo usuario
        const token = jwt.sign({ id: newUserId, email: email }, process.env.JWT_SECRET, { expiresIn: '1h' });

        console.log('Usuario registrado:', email);
        res.status(201).json({ message: 'Registro exitoso', token });

    } catch (error) {
        console.error('Error en el registro:', error);
        res.status(500).json({ message: 'Error interno del servidor al registrar usuario.' });
    }
});

// Ruta de Inicio de Sesión
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email y contraseña son requeridos.' });
    }

    try {
        // Buscar el usuario en la base de datos
        const [rows] = await pool.execute('SELECT id, email, password_hash FROM users WHERE email = ?', [email]);
        const user = rows[0];

        if (!user) {
            return res.status(401).json({ message: 'No coinciden los datos' });
        }

        // Comparar la contraseña proporcionada con la contraseña hasheada
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'No coinciden los datos' });
        }

        // Si las credenciales son correctas, generar un token JWT
        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

        console.log('Usuario ha iniciado sesión:', user.email);
        res.status(200).json({ message: 'Inicio de sesión exitoso', token });

    } catch (error) {
        console.error('Error en el inicio de sesión:', error);
        res.status(500).json({ message: 'Error interno del servidor al iniciar sesión.' });
    }
});

app.post('/albums', verifyToken, async (req, res) => {
    const { title, description } = req.body;
    const userId = req.userId; // Obtenido del middleware verifyToken

    if (!title) {
        return res.status(400).json({ message: 'El título del álbum es obligatorio.' });
    }

    try {
        const [result] = await pool.execute(
            'INSERT INTO albums (user_id, title, description) VALUES (?, ?, ?)',
            [userId, title, description]
        );

        // 🔥 2. RECUPERAR EL REGISTRO COMPLETO CON LA FECHA GENERADA
        const [rows] = await pool.execute(
            'SELECT id, title, description, DATE_FORMAT(created_at, "%Y-%m-%d %H:%i:%s") AS created_at FROM albums WHERE id = ?',
            [result.insertId]
        );
        
        const newAlbum = rows[0]; // Este objeto AHORA sí contiene 'created_at'

        if (!newAlbum) {
             return res.status(500).json({ message: 'Error al recuperar el álbum recién creado.' });
        }

        // 3. Devolver el álbum completo (incluyendo la fecha)
        res.status(201).json(newAlbum); 
        
    } catch (error) {
        console.error('Error al crear álbum:', error);
        res.status(500).json({ message: 'Error interno del servidor al crear álbum.' });
    }
});

app.get('/albums', verifyToken, async (req, res) => {
    // El ID del usuario se adjuntó a req.userId en el middleware verifyToken
    const userId = req.userId; 

    try {
        // Consultar solo los álbumes que coinciden con el ID del usuario
        const [albums] = await pool.execute(
            'SELECT id, title, description, cover_photo_url, DATE_FORMAT(created_at, "%Y-%m-%d %H:%i:%s") AS created_at FROM albums WHERE user_id = ? ORDER BY created_at DESC', 
            [userId]
        );

        // Devolver la lista de álbumes (puede ser un array vacío si no tiene ninguno)
        res.status(200).json(albums);

    } catch (error) {
        console.error('Error al obtener álbumes:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener álbumes.' });
    }
});

app.patch('/albums/:id', verifyToken, async (req, res) => {
    const albumId = req.params.id; // Obtiene el ID del álbum de la URL
    const userId = req.userId;     // Obtiene el ID del usuario del token
    const { title, description } = req.body; // Obtiene los datos a actualizar

    if (!title) {
        return res.status(400).json({ message: 'El título del álbum es obligatorio.' });
    }

    try {
        // Ejecutar la actualización: Solo se permite si el álbum pertenece al usuario
        const [result] = await pool.execute(
            'UPDATE albums SET title = ?, description = ? WHERE id = ? AND user_id = ?',
            [title, description, albumId, userId]
        );

        if (result.affectedRows === 0) {
            // El álbum no existe o no pertenece al usuario autenticado
            return res.status(404).json({ message: 'Álbum no encontrado o no autorizado.' });
        }

        res.status(200).json({ message: 'Álbum actualizado correctamente.', id: albumId, title, description });

    } catch (error) {
        console.error('Error al actualizar álbum:', error);
        res.status(500).json({ message: 'Error interno del servidor al actualizar álbum.' });
    }
});

app.delete('/albums/:id', verifyToken, async (req, res) => {
    const albumId = req.params.id; // ID del álbum a eliminar
    const userId = req.userId;     // ID del usuario autenticado (del token)

    try {
        // Ejecutar la eliminación: Solo se permite si el álbum pertenece al usuario.
        // Esto es crucial por seguridad.
        const [result] = await pool.execute(
            'DELETE FROM albums WHERE id = ? AND user_id = ?',
            [albumId, userId]
        );

        if (result.affectedRows === 0) {
            // El álbum no existe o no pertenece al usuario autenticado
            return res.status(404).json({ message: 'Álbum no encontrado o no autorizado para la eliminación.' });
        }

        // 200 OK o 204 No Content son códigos estándar para una eliminación exitosa
        res.status(200).json({ message: 'Álbum eliminado correctamente.', id: albumId });

    } catch (error) {
        console.error('Error al eliminar álbum:', error);
        res.status(500).json({ message: 'Error interno del servidor al eliminar álbum.' });
    }
});

app.patch('/albums/:albumId/cover', verifyToken, async (req, res) => {
    const albumId = req.params.albumId;
    const userId = req.userId;
    const { photoUrl } = req.body; // El frontend enviará la URL completa de Cloudinary

    if (!photoUrl) {
        return res.status(400).json({ message: 'La URL de la foto de portada es obligatoria.' });
    }

    try {
        const [result] = await pool.execute(
            'UPDATE albums SET cover_photo_url = ? WHERE id = ? AND user_id = ?',
            [photoUrl, albumId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Álbum no encontrado o no autorizado.' });
        }

        res.status(200).json({ message: 'Portada del álbum actualizada.', coverUrl: photoUrl });

    } catch (error) {
        console.error('Error al actualizar la portada:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

app.post('/albums/:albumId/photos', verifyToken, upload.single('photoFile'), async (req, res) => {
    const albumId = req.params.albumId;
    const userId = req.userId;

    if (!req.file) {
        return res.status(400).json({ message: 'No se proporcionó archivo de imagen.' });
    }

    try {
        const file = req.file;
        
        // 1. Convertir el buffer a Base64 para Cloudinary
        const base64File = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

        // 2. Subir a Cloudinary
        const uploadResult = await cloudinary.uploader.upload(
            base64File,
            { folder: `my-gallery-app/users/${userId}/albums/${albumId}` }
        );

        // 3. Insertar en la DB
        const [result] = await pool.execute(
            'INSERT INTO photos (album_id, user_id, url, public_id) VALUES (?, ?, ?, ?)',
            [albumId, userId, uploadResult.secure_url, uploadResult.public_id]
        );

        // 4. Devolver la URL y el ID
        res.status(201).json({
            id: result.insertId, // ✅ Ahora definida
            url: uploadResult.secure_url, // ✅ Ahora definida
        });

    } catch (error) {
        console.error('Error al subir foto:', error);
        // Es importante enviar una respuesta de error para que el frontend no se quede colgado
        res.status(500).json({ message: 'Error interno del servidor al subir la foto.' });
    }
});

app.get('/albums/:albumId/photos', verifyToken, async (req, res) => {
    const albumId = req.params.albumId;
    const userId = req.userId;

    try {
        // 1. Verificar que el álbum existe y pertenece al usuario (seguridad)
        const [albumCheck] = await pool.execute(
            'SELECT id FROM albums WHERE id = ? AND user_id = ?',
            [albumId, userId]
        );

        if (albumCheck.length === 0) {
            return res.status(404).json({ message: 'Álbum no encontrado o no autorizado.' });
        }

        // 2. Obtener los metadatos de las fotos (incluyendo la URL)
        const [photos] = await pool.execute(
            'SELECT id, url, DATE_FORMAT(uploaded_at, "%Y-%m-%d %H:%i:%s") AS uploaded_at FROM photos WHERE album_id = ? ORDER BY uploaded_at DESC',
            [albumId]
        );

        res.status(200).json(photos);

    } catch (error) {
        console.error('Error al obtener fotos:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener las fotos.' });
    }
});

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('Server is ready for authentication!');
});

const port = process.env.PORT || 3001;

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});