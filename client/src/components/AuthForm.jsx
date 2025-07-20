// client/src/components/AuthForm.jsx
import React, { useState } from 'react';

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

        const url = isLoginMode ? '/api/login' : '/api/register'; // Cambia la URL según el modo
        const body = isLoginMode ? { email, password } : { email, password }; // Para registro, solo necesitamos email y password

        try {
            const response = await fetch(url, {
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
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2>{title}</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>Contraseña:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                </div>

                {!isLoginMode && ( // Mostrar solo en modo registro
                    <div style={{ marginBottom: '20px' }}>
                        <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '5px' }}>Repetir Contraseña:</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ddd' }}
                        />
                    </div>
                )}

                {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}
                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: loading ? '#cccccc' : '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '16px'
                    }}
                >
                    {buttonText}
                </button>
            </form>

            <button
                onClick={onSwitchMode} // Usa la prop para cambiar el modo
                style={{
                    marginTop: '15px',
                    width: '100%',
                    padding: '10px',
                    backgroundColor: 'transparent',
                    color: '#007bff',
                    border: '1px solid #007bff',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '16px'
                }}
            >
                {switchModeText}
            </button>
        </div>
    );
}

export default AuthForm;