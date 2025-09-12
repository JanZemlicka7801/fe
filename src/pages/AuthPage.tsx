import React, { useRef, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Login from './Login';

import backgroundImage from '../images/background.jpg';
import { useAuth } from '../contexts/AuthContext';

const AuthPage: React.FC = () => {
    const transitionRef = useRef<HTMLDivElement>(null);
    const [cardHeight, setCardHeight] = useState<number | string>('auto');
    const { error, setError } = useAuth();
    const location = useLocation();
    const resizeObserverRef = useRef<ResizeObserver | null>(null);

    // Use ResizeObserver to dynamically update card height when content changes
    useEffect(() => {
        if (transitionRef.current) {
            // Initial height setting
            setCardHeight(transitionRef.current.offsetHeight);
            
            // Create ResizeObserver to watch for content size changes
            resizeObserverRef.current = new ResizeObserver(entries => {
                for (const entry of entries) {
                    setCardHeight(entry.contentRect.height);
                }
            });
            
            // Start observing the content div
            resizeObserverRef.current.observe(transitionRef.current);
        }
        
        // Cleanup observer on unmount
        return () => {
            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect();
            }
        };
    }, []);
    
    // Check for message in location state (e.g., from token expiration)
    useEffect(() => {
        const state = location.state as { message?: string } | null;
        if (state?.message) {
            setError(state.message);
            // Clear the message from location state to prevent showing it again on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location, setError]);

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