import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authEvents } from '../services/authEvents';

/**
 * Component that listens for authentication events and handles them
 * This component doesn't render anything, it just adds event listeners
 */
const AuthEventListener: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Handler for token expired event
    const handleTokenExpired = () => {
      // Log the user out
      logout(() => {
        // After logout, navigate to login page with message
        navigate('/auth', { 
          state: { 
            message: 'Your session has expired. Please log in again.' 
          } 
        });
      });
    };

    // Add event listener
    authEvents.addTokenExpiredListener(handleTokenExpired);

    // Clean up event listener on unmount
    return () => {
      authEvents.removeTokenExpiredListener(handleTokenExpired);
    };
  }, [logout, navigate]);

  // This component doesn't render anything
  return null;
};

export default AuthEventListener;