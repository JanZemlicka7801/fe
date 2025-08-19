import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const FirstLogin: React.FC = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/auth/set-password', { newPassword }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            navigate('/');
        } catch (err) {
            setError("Failed to set password");
            console.error(err);
        }
    };

    return (
        <div className="first-login-form">
            <h2>Set Your Password</h2>
            <p>This is your first time logging in. Please set a new password.</p>
            {error && <div className="error">{error}</div>}
            <form onSubmit={handleSubmit}>
                <input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button type="submit">Set Password</button>
            </form>
        </div>
    );
};

export default FirstLogin;