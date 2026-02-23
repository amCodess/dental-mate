import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { clearSelection } from '../utils/clinicSelection';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            // Revisar token o pedir el perfil
            api.post('/auth/me')
                .then(response => setUser(response.data))
                .catch(() => {
                    localStorage.removeItem('token');
                    setUser(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        const { access_token, user: userData } = response.data; // según lo devuelva el backend

        localStorage.setItem('token', access_token);
        // Si no viene el usuario en la respuesta, pedimos /auth/me

        if (userData) {
            setUser(userData);
            return;
        }

        const userResp = await api.post('/auth/me');
        setUser(userResp.data);
    };

    const logout = () => {
        // Se podría llamar al logout en el backend
        localStorage.removeItem('token');
        clearSelection();
        setUser(null);
    };

    const register = async (name, email, password) => {
        const response = await api.post('/auth/register', { name, email, password });
        // El backend devuelve { message, user, token: { access_token, token_type, expires_in } }
        const tokenData = response.data.token || response.data;
        const access_token = tokenData.access_token || response.data.access_token;
        localStorage.setItem('token', access_token);
        if (response.data.user) {
            setUser(response.data.user);
            return;
        }

        const userResp = await api.post('/auth/me');
        setUser(userResp.data);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, register, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
