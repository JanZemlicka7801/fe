import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface RegisterProps {
    onSwitch: () => void;
}

const Register: React.FC<RegisterProps> = ({ onSwitch }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [formErrors, setFormErrors] = useState<{
        username?: string;
        email?: string;
        password?: string;
        confirmPassword?: string;
    }>({});
    const { register, error, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();

    const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

    const passwordRequirements = {
        minLength: (pw: string) => pw.length >= 6,
        hasNumber: (pw: string) => /\d/.test(pw),
        hasUppercase: (pw: string) => /[A-Z]/.test(pw),
    };

    const isEmailValid = isValidEmail(email);
    const pwValid = {
        isSame: password === confirmPassword,
        minLength: passwordRequirements.minLength(password),
        hasNumber: passwordRequirements.hasNumber(password),
        hasUppercase: passwordRequirements.hasUppercase(password),
    };

    // Validation helpers
    const validateEmail = (value: string) => {
        if (!value || !/\S+@\S+\.\S+/.test(value)) {
            setFormErrors(prev => ({ ...prev, email: 'Email is invalid' }));
        } else {
            setFormErrors(prev => ({ ...prev, email: undefined }));
        }
    };

    const validatePassword = (value: string) => {
        if (!value || value.length < 6) {
            setFormErrors(prev => ({ ...prev, password: 'Password must be at least 6 characters' }));
        } else {
            setFormErrors(prev => ({ ...prev, password: undefined }));
        }
    };

    const validateConfirmPassword = (value: string, pwd: string) => {
        if (value !== pwd) {
            setFormErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
        } else {
            setFormErrors(prev => ({ ...prev, confirmPassword: undefined }));
        }
    };

    const validateForm = (): boolean => {
        const errors: typeof formErrors = {};

        if (!username || username.length < 3) errors.username = 'Username must be at least 3 characters';
        if (!email || !/\S+@\S+\.\S+/.test(email)) errors.email = 'Email is invalid';
        if (!password || password.length < 6) errors.password = 'Password must be at least 6 characters';
        if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            try {
                await register(username, email, password);
                navigate('/');
            } catch (err) {
                console.error("Registration attempt failed:", err);
            }
        }
    };

    return (
        <>
            <div className="auth-header">
                <h2>Register</h2>
                <p>Create a new account to get started.</p>
            </div>
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
                {error && <div className="auth-error">{error}</div>}

                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => {
                            setUsername(e.target.value);
                            setFormErrors(prev => ({
                                ...prev,
                                username: e.target.value.length < 3 ? 'Username must be at least 3 characters' : undefined
                            }));
                        }}
                        className={formErrors.username ? 'input-error' : ''}
                        disabled={authLoading}
                    />
                    {formErrors.username && <div className="error-message">{formErrors.username}</div>}
                </div>

                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            validateEmail(e.target.value);
                        }}
                        className={formErrors.email ? 'input-error' : ''}
                        disabled={authLoading}
                    />
                    {formErrors.email && <div className="error-message">{formErrors.email}</div>}

                    <ul className="validation-list">
                        <li className={isEmailValid ? 'valid' : 'invalid'}>
                            {isEmailValid ? '✔' : '✘'} Valid email format
                        </li>
                    </ul>
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => {
                            const val = e.target.value;
                            setPassword(val);
                            validatePassword(val);
                            validateConfirmPassword(confirmPassword, val);
                        }}
                        className={formErrors.password ? 'input-error' : ''}
                        disabled={authLoading}
                    />
                    {formErrors.password && <div className="error-message">{formErrors.password}</div>}

                    <ul className="validation-list">
                        <li className={pwValid.minLength ? 'valid' : 'invalid'}>
                            {pwValid.minLength ? '✔' : '✘'} At least 6 characters
                        </li>
                        <li className={pwValid.hasNumber ? 'valid' : 'invalid'}>
                            {pwValid.hasNumber ? '✔' : '✘'} Includes a number
                        </li>
                        <li className={pwValid.hasUppercase ? 'valid' : 'invalid'}>
                            {pwValid.hasUppercase ? '✔' : '✘'} Includes an uppercase letter
                        </li>
                    </ul>
                </div>

                <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => {
                            const val = e.target.value;
                            setConfirmPassword(val);
                            validateConfirmPassword(val, password);
                        }}
                        className={formErrors.confirmPassword ? 'input-error' : ''}
                        disabled={authLoading}
                    />
                    {formErrors.confirmPassword && <div className="error-message">{formErrors.confirmPassword}</div>}

                    <ul className={"validation-list"}>
                        <li className={pwValid.isSame ? 'valid' : 'invalid'}>
                            {pwValid.isSame ? '✔' : '✘'} Is the same as the password
                        </li>
                    </ul>
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn-primary btn-block" disabled={authLoading}>
                        {authLoading ? 'Registering...' : 'Register'}
                    </button>
                </div>
            </form>
            <div className="auth-footer">
                <p>
                    Already have an account?{' '}
                    <a href="#" onClick={(e) => { e.preventDefault(); onSwitch(); }}>
                        Login
                    </a>
                </p>
            </div>
        </>
    );
};

export default Register;