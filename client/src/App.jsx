// client/src/App.jsx
import { useState } from 'react';
import './App.css';
// Importa el componente renombrado
import AuthForm from './components/AuthForm';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [authMode, setAuthMode] = useState('login'); // 'login' o 'register'
    const [count, setCount] = useState(0);

    // Función que se llama cuando el login O el registro es exitoso
    const handleAuthSuccess = () => {
        setIsLoggedIn(true);
        // Podrías mostrar un mensaje diferente si es registro
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
        <>
            <h1>Our Photos</h1>

            {!isLoggedIn ? (
                // Pasa el modo actual y las funciones de callback al AuthForm
                <AuthForm
                    mode={authMode}
                    onAuthSuccess={handleAuthSuccess}
                    onSwitchMode={handleSwitchAuthMode}
                />
            ) : (
                // Muestra el contenido principal de la app si el usuario está logueado
                <div>
                    <h2>¡Bienvenido, usuario autenticado!</h2>
                    <div className="card">
                        <button onClick={() => setCount((count) => count + 1)}>
                            count is {count}
                        </button>
                        <p>
                            Edit <code>src/App.jsx</code> and save to test HMR
                        </p>
                    </div>
                    <p className="read-the-docs">
                        Click on the Vite and React logos to learn more
                    </p>
                    <button
                        onClick={handleLogout}
                        style={{ marginTop: '20px', padding: '10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Cerrar Sesión
                    </button>
                </div>
            )}
        </>
    );
}

export default App;