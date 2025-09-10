import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { sendNotification } from '../../services/notificationService';

const NotificationForm: React.FC = () => {
    const { token } = useAuth();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!phoneNumber || !message) {
            setStatus('error');
            setErrorMessage('Telefonní číslo a zpráva jsou povinné');
            return;
        }

        setStatus('loading');

        try {
            await sendNotification(token!, phoneNumber, message);
            setStatus('success');
            // Clear form after successful submission
            setPhoneNumber('');
            setMessage('');
            // Reset success status after 3 seconds
            setTimeout(() => setStatus('idle'), 3000);
        } catch (error) {
            setStatus('error');
            setErrorMessage(error instanceof Error ? error.message : 'Nepodařilo se odeslat notifikaci');
        }
    };

    return (
        <div className="notification-form-container">
            <h3>Odeslat SMS notifikaci</h3>

            <form onSubmit={handleSubmit} className="notification-form">
                <div className="form-group">
                    <label htmlFor="phoneNumber">Telefonní číslo</label>
                    <input
                        type="text"
                        id="phoneNumber"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+420123456789"
                        disabled={status === 'loading'}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="message">Zpráva</label>
                    <textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Zadejte text zprávy..."
                        rows={4}
                        disabled={status === 'loading'}
                    />
                </div>

                {status === 'error' && (
                    <div className="error-message">
                        {errorMessage}
                    </div>
                )}

                {status === 'success' && (
                    <div className="success-message">
                        Notifikace byla úspěšně odeslána!
                    </div>
                )}

                <button
                    type="submit"
                    className="btn-primary"
                    disabled={status === 'loading'}
                >
                    {status === 'loading' ? 'Odesílání...' : 'Odeslat notifikaci'}
                </button>
            </form>
        </div>
    );
};

export default NotificationForm;