// client/src/components/AuthForm.jsx
import React, { useState } from 'react';
import './AuthForm.css';

// Este componente ahora puede ser usado para Login o Registro
// Recibe una prop `mode` ('login' o 'register') y una prop `onSuccess`
function AuthForm({ mode, onAuthSuccess, onSwitchMode }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState(''); // Nuevo para registro
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const isLoginMode = mode === 'login'; // Booleano para saber el modo actual
    const title = isLoginMode ? 'Iniciar Sesión' : 'Registrarse';
    const buttonText = isLoginMode ? 'Entrar' : 'Registrarme';
    const switchModeText = isLoginMode ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!isLoginMode && password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            setLoading(false);
            return;
        }

        const url = isLoginMode ? '/login' : '/register'; // Cambia la URL según el modo
        const body = isLoginMode ? { email, password } : { email, password }; // Para registro, solo necesitamos email y password
        const API_BASE_URL = import.meta.env.VITE_API_URL || '';

        try {
            const response = await fetch(API_BASE_URL + url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (response.ok) {
                // console.log(`${isLoginMode ? 'Login' : 'Registro'} exitoso:`, data);
                localStorage.setItem('authToken', data.token);
                if (onAuthSuccess) {
                    onAuthSuccess(); // Llama a la función de éxito pasada por prop
                }
            } else {
                setError(data.message || `Error al ${isLoginMode ? 'iniciar sesión' : 'registrarte'}.`);
            }
        } catch (err) {
            setError('No se pudo conectar con el servidor. Inténtalo más tarde.');
            console.error('Error de red o servidor:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        // Usamos la clase 'auth-container'
        <div className="auth-container">
            <h2>{title}</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="auth-input" // Usamos la clase 'auth-input'
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Contraseña:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="auth-input" // Usamos la clase 'auth-input'
                    />
                </div>

                {!isLoginMode && ( 
                    <div className="form-group">
                        <label htmlFor="confirmPassword">Repetir Contraseña:</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="auth-input" // Usamos la clase 'auth-input'
                        />
                    </div>
                )}

                {error && <p className="error-message">{error}</p>}
                
                <button
                    type="submit"
                    disabled={loading}
                    className="auth-button-primary" // Usamos la clase primaria
                >
                    {buttonText}
                </button>
            </form>

            <button
                onClick={onSwitchMode}
                className="auth-button-secondary" // Usamos la clase secundaria
            >
                {switchModeText}
            </button>
        </div>
    );
}

export default AuthForm;