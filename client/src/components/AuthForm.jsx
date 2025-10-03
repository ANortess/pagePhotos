import React, { useState, useEffect } from 'react';
import './AuthForm.css';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

function AuthForm({ mode, onAuthSuccess, onSwitchMode }) {
    // --- ESTADO ---
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState(''); 
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // --- VARIABLES DERIVADAS ---
    const isLoginMode = mode === 'login';
    const title = isLoginMode ? 'Iniciar Sesión' : 'Registrarse';
    const switchModeText = isLoginMode ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión';

    // --- FUNCIÓN DE ENVÍO Y LÓGICA DE API ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // 1. Validación de Contraseñas (Solo para registro)
        if (!isLoginMode && password !== confirmPassword) {
            setError('Contraseñas distintas');
            setLoading(false);
            return;
        }

        // 2. Preparación de la Petición
        const url = isLoginMode ? '/login' : '/register';
        const body = { email, password };
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://pagephotos-production-up.railway.app';

        try {
            const response = await fetch(API_BASE_URL + url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            // 3. Manejo de Respuesta
            if (response.ok) {
                localStorage.setItem('authToken', data.token);
                if (onAuthSuccess) {
                    onAuthSuccess();
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
    useEffect(() => {
        if (error) {
            // Establece un temporizador para limpiar el error
            const timer = setTimeout(() => {
                setError('');
            }, 3000); // 3000 milisegundos = 3 segundos

            // Función de limpieza de useEffect: se ejecuta si el componente se desmonta 
            // o si 'error' cambia de nuevo antes de que se dispare el temporizador.
            return () => clearTimeout(timer);
        }
    }, [error]);
    
    const FormComponent = isLoginMode ? LoginForm : RegisterForm;
    return (
        <div className="auth-container">
            <h2><span className="title-text">{title}</span></h2>
            
            <FormComponent 
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                error={error}
                loading={loading}
                handleSubmit={handleSubmit}
            />

            <button
                onClick={onSwitchMode}
                className="auth-button-secondary"
            >
                {switchModeText}
            </button>
        </div>
    );
}

export default AuthForm;