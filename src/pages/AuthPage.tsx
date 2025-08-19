import React, { useRef, useEffect, useState } from 'react';
import Login from './Login';

import backgroundImage from '../images/background.jpg';
import { useAuth } from '../contexts/AuthContext';

const AuthPage: React.FC = () => {
    const transitionRef = useRef<HTMLDivElement>(null);
    const [cardHeight, setCardHeight] = useState<number | string>('auto');
    const { setError } = useAuth();

    useEffect(() => {
        if (transitionRef.current) {
            setCardHeight(transitionRef.current.offsetHeight);
        }
    }, []);

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
            <div
                className="auth-card"
                style={{
                    height: typeof cardHeight === 'number' ? `${cardHeight}px` : 'auto',
                    transition: 'height 0.3s ease',
                    position: 'relative',
                }}
            >
                <div ref={transitionRef} style={{ width: '100%' }}>
                    <Login onSwitch={() => setError(null)} />
                </div>
            </div>
        </div>
    );
};

export default AuthPage;