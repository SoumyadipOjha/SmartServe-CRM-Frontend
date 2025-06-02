import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types/models';
import AuthService from '../services/auth.service';

interface AuthContextType {
    currentUser: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: () => void;
    logout: () => void;
    checkToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    currentUser: null,
    isAuthenticated: false,
    isLoading: true,
    login: () => {},
    logout: () => {},
    checkToken: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const login = () => {
        AuthService.initiateGoogleLogin();
    };

    const logout = () => {
        AuthService.logout();
        setCurrentUser(null);
        setIsAuthenticated(false);
    };

    const checkToken = useCallback(async () => {
        if (AuthService.isAuthenticated()) {
            try {
                const user = await AuthService.getCurrentUser();
                setCurrentUser(user);
                setIsAuthenticated(true);
                return;
            } catch (error) {
                console.error('Error fetching user data:', error);
                // If token is invalid, remove it
                AuthService.logout();
            }
        }
        
        setCurrentUser(null);
        setIsAuthenticated(false);
    }, []);

    // Check authentication on component mount
    useEffect(() => {
        const checkAuth = async () => {
            await checkToken();
            setIsLoading(false);
        };

        checkAuth();
    }, [checkToken]);

    // Check for token in URL (for OAuth callback)
    useEffect(() => {
        const url = new URL(window.location.href);
        const token = url.searchParams.get('token');
        const error = url.searchParams.get('error');
        
        if (error) {
            console.error('Authentication error:', error);
            setIsLoading(false);
            return;
        }
        
        if (token && url.pathname === '/auth/success') {
            console.log('Auth callback received with token');
            AuthService.handleAuthCallback(token);
            checkToken().then(() => {
                // Clean up URL
                window.history.replaceState({}, document.title, '/');
                setIsLoading(false);
            });
        }
    }, [checkToken]);

    const contextValue: AuthContextType = {
        currentUser,
        isAuthenticated,
        isLoading,
        login,
        logout,
        checkToken
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;