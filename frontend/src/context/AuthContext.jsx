import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(sessionStorage.getItem('token') || null);
    const [sessionId, setSessionId] = useState(sessionStorage.getItem('sessionId') || null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    // Configure axios defaults
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            sessionStorage.setItem('token', token);
        } else {
            delete axios.defaults.headers.common['Authorization'];
            sessionStorage.removeItem('token');
        }
    }, [token]);

    // Check if user is logged in on mount
    useEffect(() => {
        const loadUser = async () => {
            if (token) {
                try {
                    const res = await axios.get(`${API_BASE_URL}/api/auth/me`);

                    setUser(res.data);
                    setIsAuthenticated(true);
                } catch (error) {
                    console.error('Error loading user', error);
                    logout();
                }
            }
            setLoading(false);
        };

        loadUser();
    }, []);

    const login = async (email, password) => {
        try {
            const res = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });

            setToken(res.data.token);
            setUser(res.data);
            if (res.data.sessionId) {
                setSessionId(res.data.sessionId);
                sessionStorage.setItem('sessionId', res.data.sessionId);
            }
            setIsAuthenticated(true);

            return { success: true };
        } catch (error) {
            console.error('Login error', error.response?.data?.message);
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed'
            };
        }
    };

    const signup = async (userData) => {
        try {
            await axios.post(`${API_BASE_URL}/api/auth/register`, userData);
            return { success: true };
        } catch (error) {
            console.error('Signup error', error.response?.data?.message);
            return {
                success: false,
                message: error.response?.data?.message || 'Signup failed'
            };
        }
    };

    const forgotPassword = async (email) => {
        try {
            await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email });
            return { success: true };
        } catch (error) {
            console.error('Forgot password error', error.response?.data?.message);
            return {
                success: false,
                message: error.response?.data?.message || 'Error sending reset link'
            };
        }
    };

    const resetPassword = async (token, password) => {
        try {
            await axios.post(`${API_BASE_URL}/api/auth/reset-password/${token}`, { password });
            return { success: true };
        } catch (error) {
            console.error('Reset password error', error.response?.data?.message);
            return {
                success: false,
                message: error.response?.data?.message || 'Error resetting password'
            };
        }
    };

    const logout = async () => {
        try {
            if (sessionId) {
                await axios.post(`${API_BASE_URL}/api/auth/logout`, { sessionId });
            }
        } catch (error) {
            console.error('Logout error', error);
        } finally {
            setUser(null);
            setToken(null);
            setSessionId(null);
            setIsAuthenticated(false);
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('sessionId');
            delete axios.defaults.headers.common['Authorization'];
        }
    };

    const hasPermission = (permissionKey) => {
        if (!user) return false;
        if (user.role === 'Admin') return true;
        return user.permissions && user.permissions[permissionKey] === true;
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isAuthenticated,
            loading,
            login,
            logout,
            signup,
            forgotPassword,
            resetPassword,
            hasPermission
        }}>
            {children}
        </AuthContext.Provider>
    );
};
