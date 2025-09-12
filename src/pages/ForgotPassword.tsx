import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import backgroundImage from '../images/background.jpg';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [formErrors, setFormErrors] = useState<{ email?: string }>({});
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();
    const { forgotPassword, error, setError, isLoading } = useAuth();

    const validateForm = (): boolean => {
        const errors: any = {};
        
        // Email validation with more detailed feedback
        if (!email) {
            errors.email = 'Email je povinný';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = 'Zadejte platný email (např. jmeno@domena.cz)';
        }
        
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleResetPassword = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (!validateForm()) return;

        const result = await forgotPassword(email);
        if (result) {
            setSuccess(true);
        }
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        // Clear email-related errors
        setFormErrors(prev => ({ ...prev, email: undefined }));
        // Clear auth errors when user modifies input
        if (error) setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        
        const result = await forgotPassword(email);
        if (result) {
            setSuccess(true);
        }
    };

    const handleBackToLogin = () => {
        navigate('/auth');
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
                    <h2>Obnovení hesla</h2>
                    <p>Zadejte svůj email a my vám zašleme nové dočasné heslo.</p>
                </div>
                
                {success ? (
                    <div className="auth-form">
                        <div className="auth-success" role="alert">
                            <div className="auth-success-icon">✓</div>
                            <div className="auth-success-message">
                                Dočasné heslo bylo odesláno na váš email. Zkontrolujte svou emailovou schránku.
                            </div>
                        </div>
                        <div className="form-actions">
                            <button 
                                type="button" 
                                className="btn-primary btn-block" 
                                onClick={handleBackToLogin}
                            >
                                Zpět na přihlášení
                            </button>
                        </div>
                    </div>
                ) : (
                    <form className="auth-form" onSubmit={handleSubmit} noValidate autoComplete="off">
                        {/* Display authentication errors with improved styling */}
                        {error && (
                            <div className="auth-error" role="alert">
                                <div className="auth-error-icon">⚠️</div>
                                <div className="auth-error-message">{error}</div>
                            </div>
                        )}
                        
                        {/* Email field with improved error handling */}
                        <div className={`form-group ${formErrors.email ? 'has-error' : ''}`}>
                            <label htmlFor="email">Email</label>
                            <div className="input-wrapper">
                                <input 
                                    type="email" 
                                    id="email" 
                                    value={email} 
                                    onChange={handleEmailChange} 
                                    autoComplete="email" 
                                    className={formErrors.email ? 'input-error' : ''} 
                                    disabled={isLoading} 
                                    placeholder="jmeno@domena.cz"
                                />
                                {formErrors.email && <div className="input-icon error-icon">!</div>}
                            </div>
                            {formErrors.email && <div className="error-message">{formErrors.email}</div>}
                        </div>
                        
                        <div className="form-actions">
                            <button 
                                type="submit" 
                                className={`btn-primary btn-block ${isLoading ? 'loading' : ''}`}
                                onClick={handleResetPassword}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="loading-spinner"></span>
                                        <span>Odesílám...</span>
                                    </>
                                ) : 'Odeslat'}
                            </button>
                            <div className="auth-footer">
                            </div>
                            <button 
                                type="button" 
                                className="btn-secondary btn-block" 
                                onClick={handleBackToLogin}
                                disabled={isLoading}
                            >
                                Zpět na přihlášení
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;