import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import backgroundImage from '../images/background.jpg';

const MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const FirstLogin: React.FC = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [formErrors, setFormErrors] = useState<{ newPassword?: string; confirmPassword?: string } >({});
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const navigate = useNavigate();
    const { user, token, setError: setAuthError, updateUser } = useAuth();

    const validateForm = (): boolean => {
        const errors: any = {};
        if (newPassword.length < MIN_LENGTH) {
            errors.newPassword = 'Heslo musí mít alespoň 8 znaků';
        } else if (!PASSWORD_REGEX.test(newPassword)) {
            errors.newPassword = 'Heslo musí obsahovat alespoň jedno číslo a jedno písmeno';
        }
        if (newPassword !== confirmPassword) {
            errors.confirmPassword = 'Hesla se neshodují';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        setBusy(true);
        setError('');
        try {
            const res = await fetch('/api/auth/set-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ newPassword }),
            });
            if (!res.ok) throw new Error('Failed to set password');
            if (user) {
                const updatedUser = { ...user, validated: true };
                updateUser(updatedUser);
            }
            setAuthError(null);
            navigate('/schedule');
        } catch (err: any) {
            setError('Nepodařilo se nastavit heslo');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div
            className="auth-container"
            style={{
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
        >
            <div className="auth-card">
                <div className="auth-header">
                    <h2>Nastavení hesla</h2>
                    <p>Jste tu poprvé. Prosím nastavte si nové heslo.</p>
                </div>
                <form className="auth-form" onSubmit={handleSubmit} noValidate autoComplete="off">
                    {error && <div className="auth-error">{error}</div>}
                    <div className="form-group">
                        <label htmlFor="newPassword">Nové heslo</label>
                        <input
                            type="password"
                            id="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className={formErrors.newPassword ? 'input-error' : ''}
                            disabled={busy}
                        />
                        {formErrors.newPassword && <div className="error-message">{formErrors.newPassword}</div>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirmPassword">Potvrdit heslo</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={formErrors.confirmPassword ? 'input-error' : ''}
                            disabled={busy}
                        />
                        {formErrors.confirmPassword && <div className="error-message">{formErrors.confirmPassword}</div>}
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="btn-primary btn-block" disabled={busy}>
                            {busy ? 'Nastavuji...' : 'Nastavit heslo'}
                        </button>
                    </div>
                </form>
                <div className="auth-footer">
                    <p></p>
                </div>
            </div>
        </div>
    );
};

export default FirstLogin;
