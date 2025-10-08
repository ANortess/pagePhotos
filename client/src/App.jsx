import { useState } from 'react';
import './App.css'; // Importa los estilos generales de App
import AuthForm from './components/AuthForm';
import MainContent from './components/MainContent';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [authMode, setAuthMode] = useState('login'); // 'login' o 'register'

    // Función que se llama cuando el login O el registro es exitoso
    const handleAuthSuccess = () => {
        setIsLoggedIn(true);
    };

    const handleSwitchAuthMode = () => {
        setAuthMode(prevMode => (prevMode === 'login' ? 'register' : 'login'));
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken'); // Elimina el token
        setIsLoggedIn(false); // Cambia el estado a no logueado
        setAuthMode('login'); // Vuelve al modo login al cerrar sesión
    };

    return (
        <>
            <div className={'background-fixed-layer'}></div> 
            
            <div className={'app-main'}>
                {!isLoggedIn ? (
                    // Pasa el modo actual y las funciones de callback al AuthForm
                    <AuthForm
                        mode={authMode}
                        onAuthSuccess={handleAuthSuccess}
                        onSwitchMode={handleSwitchAuthMode}
                    />
                ) : (
                    <MainContent 
                        handleLogout={handleLogout} 
                    />
                )}
            </div>
        </>
        
    );
}

export default App;