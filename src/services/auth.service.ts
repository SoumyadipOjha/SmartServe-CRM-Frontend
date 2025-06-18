import apiClient from './api-client';
import { User } from '../types/models';

export interface AuthResponse {
    token: string;
    user: User;
}

const AuthService = {
    /**
     * Initialize Google OAuth login
     */
    initiateGoogleLogin: (): void => {
        window.location.href = `${process.env.REACT_APP_API_URL}/api/auth/google`;
    },

    /**
     * Process the OAuth callback and store the token
     * @param token JWT token from OAuth callback
     */
    handleAuthCallback: (token: string): void => {
        localStorage.setItem('token', token);
    },

    /**
     * Get the currently logged in user
     * @returns Promise with user data
     */
    getCurrentUser: async (): Promise<User> => {
        const response = await apiClient.get<{ user: User }>('/auth/me');
        return response.data.user;
    },

    /**
     * Check if user is authenticated
     * @returns boolean
     */
    isAuthenticated: (): boolean => {
        return localStorage.getItem('token') !== null;
    },

    /**
     * Logout user
     */
    logout: (): void => {
        localStorage.removeItem('token');
    }
};

export default AuthService;