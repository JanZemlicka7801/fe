import React, { useState, useRef } from 'react';
import { CSSTransition, SwitchTransition } from 'react-transition-group';

import Login from './Login';
import Register from './Register';

import backgroundImage from '../images/background.jpg';

const AuthPage: React.FC = () => {
    const [isLoginView, setIsLoginView] = useState(true);

    const loginRef = useRef<HTMLDivElement>(null);
    const registerRef = useRef<HTMLDivElement>(null);
    const nodeRef = isLoginView ? loginRef : registerRef;

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
                <SwitchTransition mode="out-in">
                    <CSSTransition
                        key={isLoginView ? 'login' : 'register'}
                        nodeRef={nodeRef}
                        timeout={300}
                        classNames="form-slide"
                        unmountOnExit
                    >
                        <div ref={nodeRef}>
                            {isLoginView ? (
                                <Login onSwitch={() => setIsLoginView(false)} />
                            ) : (
                                <Register onSwitch={() => setIsLoginView(true)} />
                            )}
                        </div>
                    </CSSTransition>
                </SwitchTransition>
            </div>
        </div>
    );
};

export default AuthPage;