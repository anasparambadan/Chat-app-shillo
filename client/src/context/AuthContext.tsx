import { createContext, useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

const backendUrl = import.meta.env.VITE_API_URL;
axios.defaults.baseURL = backendUrl;
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [authUser, setAuthUser] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [socket, setSocket] = useState(null);

    // check if user is authenticated, set user data connect socket, etc.

    const checkAuth = async () => {
        try {
            const { data } = await axios.get('/api/auth/check-auth');
            if (data?.success) {
                setAuthUser(data.user);
                connectSocket(data.user);
            }
        } catch (error) {
            toast.error(error.message || 'Authentication check failed');
        }
    };

    // connect socket function to handle socket connection and online user

    const connectSocket = (userData: any) => {
        // socket connection logic here
        if (!userData || socket?.connected) return;
        const newSocket = io(backendUrl, {
            query: { userId: userData._id },
        });
        newSocket.connect();
        setSocket(newSocket);
        newSocket.on('getOnlineUsers', (users: any[]) => {
            setOnlineUsers(users);
        });
    };

    // login function to user auth and socket connection

    const login = async (state, credential) => {
        try {
            const { data } = await axios.post(`/api/auth/${state}`, credential);

            if (data?.success) {
                setToken(data.token);
                localStorage.setItem('token', data.token);
                axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
                console.log(data.userData, 'data at login');
                setAuthUser(data.userData);
                connectSocket(data.userData);
                toast.success(data.message);
            } else {
                toast.error(data.message || 'Authentication failed');
            }
        } catch (error: any) {
            toast.error(error.message || 'Authentication failed');
        }
    };

    // logout function to clear auth data and disconnect socket

    const logout = async () => {
        setToken(null);
        setAuthUser(null);
        setOnlineUsers([]);
        if (socket) {
            socket.disconnect();
            setSocket(null);
        }
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        toast.success('Logged out successfully');
    };

    // update profile function to update user data

    const updateProfile = async (profileData) => {
        try {
            const { data } = await axios.put('/api/auth/update-profile', profileData);
            console.log(data, 'data at profile updata');
            if (data?.success) {
                setAuthUser(data.user);
                toast.success(data.message);
            }
        } catch (error) {
            toast.error(error.message || 'Profile update failed');
        }
    };

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            checkAuth();
        }
    }, []);

    const value = {
        axios,
        authUser,
        onlineUsers,
        socket,
        login,
        logout,
        updateProfile,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
