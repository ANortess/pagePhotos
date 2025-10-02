// server/index.js
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'; // Importa dotenv
import mysql2 from 'mysql2/promise';

// Carga las variables de entorno del archivo .env
dotenv.config();

const app = express();

const allowedOrigins = [
    'https://photos-page-coral.vercel.app', 
    'https://photos-page-2deit091s-anortess-projects.vercel.app',
    // Si usas localhost para desarrollo, agrégalo:
    // 'http://localhost:3000', 
];

app.use(cors({
    origin: (origin, callback) => {
        // Si el origen de la solicitud está en nuestra lista de permitidos, acepta.
        // También permite solicitudes sin origen (como Postman o archivos locales).
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            // Si no está en la lista, rechaza por CORS.
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: 'GET,POST,OPTIONS', 
    credentials: true,
}));

// Middleware para parsear el cuerpo de las peticiones JSON
app.use(express.json());

// --- Configuración de la Conexión a MySQL ---
const dbConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'railway',
    port: process.env.MYSQL_PORT || 3306,
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
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Tabla de usuarios verificada/creada');

    } catch (err) {
        console.error('Error al conectar o inicializar MySQL:', err);
    }
}

connectToDb();

app.post('/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email y contraseña son requeridos.' });
    }

    try {
        // Verificar si el usuario ya existe en la base de datos
        const [rows] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (rows.length > 0) {
            return res.status(409).json({ message: 'El usuario con este email ya existe.' });
        }

        // Hashear la contraseña antes de guardarla
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertar el nuevo usuario en la base de datos
        const [result] = await pool.execute(
            'INSERT INTO users (email, password) VALUES (?, ?)',
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
        const [rows] = await pool.execute('SELECT id, email, password FROM users WHERE email = ?', [email]);
        const user = rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // Comparar la contraseña proporcionada con la contraseña hasheada
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
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

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('Server is ready for authentication!');
});

const port = process.env.PORT || 3001;

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});