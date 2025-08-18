// src/pages/AuthPage.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CSSTransition, SwitchTransition } from 'react-transition-group';

import Login from './Login';
import Register from './Register';

import backgroundImage from '../images/background.jpg';

const AuthPage: React.FC = () => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [cardHeight, setCardHeight] = useState<number | string>('auto');
    const transitionRef = useRef<HTMLDivElement>(null); // single ref for CSSTransition

    const handleSwitch = () => {
        setIsLoginView(prev => !prev);
    };

    const updateCardHeight = useCallback(() => {
        if (transitionRef.current) {
            setCardHeight(transitionRef.current.offsetHeight);
        }
    }, []);

    // Initial height
    useEffect(() => {
        updateCardHeight();
    }, []);

    // Update height on view switch
    useEffect(() => {
        const timeout = setTimeout(updateCardHeight, 350); // wait for transition
        return () => clearTimeout(timeout);
    }, [isLoginView, updateCardHeight]);

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
            <div className="auth-card" style={{ height: cardHeight, position: 'relative' }}>
                <SwitchTransition mode="out-in">
                    <CSSTransition
                        key={isLoginView ? 'login' : 'register'}
                        nodeRef={transitionRef}
                        timeout={300}
                        classNames="form-slide"
                        unmountOnExit
                        onEntered={updateCardHeight}
                    >
                        <div
                            ref={transitionRef}
                            style={{ position: 'absolute', width: '100%' }}
                        >
                            {isLoginView ? (
                                <Login onSwitch={handleSwitch} />
                            ) : (
                                <Register onSwitch={handleSwitch} />
                            )}
                        </div>
                    </CSSTransition>
                </SwitchTransition>
            </div>
        </div>
    );
};

export default AuthPage;