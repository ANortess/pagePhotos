import { useState } from 'react';
import './App.css'; // Importa los estilos generales de App
import AuthForm from './components/AuthForm'; // Importa el componente de autenticación

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [authMode, setAuthMode] = useState('login'); // 'login' o 'register'
    const [count, setCount] = useState(0);

    // Función que se llama cuando el login O el registro es exitoso
    const handleAuthSuccess = () => {
        setIsLoggedIn(true);
        alert(`¡${authMode === 'login' ? 'Inicio de Sesión' : 'Registro'} Exitoso! Ahora el usuario está logueado.`);
    };

    const handleSwitchAuthMode = () => {
        setAuthMode(prevMode => (prevMode === 'login' ? 'register' : 'login'));
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken'); // Elimina el token
        setIsLoggedIn(false); // Cambia el estado a no logueado
        setAuthMode('login'); // Vuelve al modo login al cerrar sesión
        alert('Sesión cerrada.');
    };

    return (
        !isLoggedIn ? (
            // Pasa el modo actual y las funciones de callback al AuthForm
            <AuthForm
                mode={authMode}
                onAuthSuccess={handleAuthSuccess}
                onSwitchMode={handleSwitchAuthMode}
            />
        ) : (
            // Muestra el contenido principal de la app si el usuario está logueado
            <div className="welcome-content">
                <h2>¡Bienvenido, usuario autenticado!</h2>
                <div className="card">
                    <button onClick={() => setCount((count) => count + 1)}>
                        Contador: {count}
                    </button>
                    <p>
                        Edita <code>src/App.jsx</code> y guarda para probar HMR.
                    </p>
                </div>
                <p className="read-the-docs">
                    Haz clic en los logos de Vite y React para aprender más.
                </p>
                <button
                    onClick={handleLogout}
                    className="logout-button" // Usa la clase CSS para el botón de logout
                >
                    Cerrar Sesión
                </button>
            </div>
        )
        
    );
}

export default App;