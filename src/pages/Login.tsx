import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LoginProps {
    onSwitch: () => void;
}

const Login: React.FC<LoginProps> = ({ onSwitch }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [formErrors, setFormErrors] = useState<{
        email?: string;
        password?: string;
    }>({});
    const { login, error, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();

    const validateForm = (): boolean => {
        const errors: any = {};
        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            errors.email = 'Prosím vyplň správně email';
        }
        if (!password) {
            errors.password = 'Prosím vyplň správně heslo';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            try {
                await login(email, password);
                navigate('/');
            } catch (err) {
                console.error("Login attempt failed:", err);
            }
        }
    };

    return (
        <>
            <div className="auth-header">
                <h2>Přihlášení</h2>
                <p>Ahoj vítej zpět! Prosím přihlaš se.</p>
            </div>
            <form className="auth-form" onSubmit={handleSubmit} noValidate autoComplete="off">
                {error && <div className="auth-error">{error}</div>}
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" className={formErrors.email ? 'input-error' : ''} disabled={authLoading} />
                    {formErrors.email && <div className="error-message">{formErrors.email}</div>}
                </div>
                <div className="form-group">
                    <label htmlFor="password">Heslo</label>
                    <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className={formErrors.password ? 'input-error' : ''} disabled={authLoading} />
                    {formErrors.password && <div className="error-message">{formErrors.password}</div>}
                </div>
                <div className="form-actions">
                    <button type="submit" className="btn-primary btn-block" disabled={authLoading}>
                        {authLoading ? 'Přihlašuji...' : 'Přihlásit se'}
                    </button>
                </div>
            </form>
            <div className="auth-footer">
                <p>
                </p>
            </div>
        </>
    );
};

export default Login;