import React from 'react';

function LoginForm({ email, setEmail, password, setPassword, error, loading, handleSubmit }) {
    const buttonContent = error 
        ? error 
        : loading 
        ? 'Cargando...' 
        : 'Entrar';

    // 2. Determina las clases CSS del botón:
    // Si hay un error, añade la clase 'auth-button-error' (que le da el color rojo).
    const buttonClasses = `auth-button-primary 
        ${error ? 'auth-button-error' : ''} 
        ${!error && loading ? 'auth-button-loading' : ''}
    `;

    const textClasses = `button-text-content
        ${error ? 'button-text-content-nothing' : ''}
        ${!error && loading ? 'button-text-content-nothing' : ''}
    `;

    return (
        <form onSubmit={handleSubmit}>
            <div className="form-group">
                <label htmlFor="email">Email:</label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="auth-input"
                    autoComplete="username"
                    placeholder="ejemplo@correo.com"
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
                    className="auth-input"
                    autoComplete="current-password"
                    placeholder="contraseña"
                />
            </div>
            
            <button
                type="submit"
                disabled={loading || !!error} // Se deshabilita si está cargando O si hay un error
                className={buttonClasses} // Usamos la clase condicional
            >
                <span className={textClasses}>{buttonContent}</span>
            </button>
        </form>
    );
}

export default LoginForm;