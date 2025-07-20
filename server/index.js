// server/index.js
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'; // Importa dotenv

// Carga las variables de entorno del archivo .env
dotenv.config();

const app = express();

// Middleware para permitir CORS (Cross-Origin Resource Sharing)
// Esto es crucial para que tu frontend React pueda hacer peticiones al backend
app.use(cors());
// Middleware para parsear el cuerpo de las peticiones JSON
app.use(express.json());

// --- Simulación de Base de Datos de Usuarios ---
// En un entorno real, esto sería una base de datos como MongoDB, PostgreSQL, etc.
const users = []; // Array para almacenar usuarios registrados temporalmente

// --- Rutas de Autenticación ---

// Ruta de Registro
app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email y contraseña son requeridos.' });
    }

    // Verificar si el usuario ya existe
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
        return res.status(409).json({ message: 'El usuario con este email ya existe.' });
    }

    try {
        // Hashear la contraseña antes de guardarla
        const hashedPassword = await bcrypt.hash(password, 10); // 10 es el "salt rounds"

        const newUser = { id: users.length + 1, email, password: hashedPassword };
        users.push(newUser); // Guardar el nuevo usuario en nuestro array simulado

        // Generar un token JWT para el nuevo usuario
        // Aquí usamos el JWT_SECRET que cargamos de .env
        const token = jwt.sign({ id: newUser.id, email: newUser.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

        console.log('Usuario registrado:', newUser.email);
        // Devolver el token y un mensaje de éxito
        res.status(201).json({ message: 'Registro exitoso', token });

    } catch (error) {
        console.error('Error en el registro:', error);
        res.status(500).json({ message: 'Error interno del servidor al registrar usuario.' });
    }
});

// Ruta de Inicio de Sesión
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email y contraseña son requeridos.' });
    }

    // Buscar el usuario en nuestra "base de datos" simulada
    const user = users.find(user => user.email === email);
    if (!user) {
        return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    try {
        // Comparar la contraseña proporcionada con la contraseña hasheada
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // Si las credenciales son correctas, generar un token JWT
        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

        console.log('Usuario ha iniciado sesión:', user.email);
        // Devolver el token
        res.status(200).json({ message: 'Inicio de sesión exitoso', token });

    } catch (error) {
        console.error('Error en el inicio de sesión:', error);
        res.status(500).json({ message: 'Error interno del servidor al iniciar sesión.' });
    }
});

// Ruta de prueba (opcional, para verificar que el servidor está vivo)
app.get('/', (req, res) => {
    res.send('Server is ready for authentication!');
});

// Definir el puerto
const port = process.env.PORT || 3001; // Usamos 3001 para el backend, 3000 o 5173 para el frontend

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});