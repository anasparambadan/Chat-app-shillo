import { create } from 'zustand';
import axios from 'axios';
import toast from 'react-hot-toast';
import { io, Socket } from 'socket.io-client';

const backendUrl = import.meta.env.VITE_API_URL;

axios.defaults.baseURL = backendUrl;

interface AuthState {
    token: string | null;
    authUser: any;
    onlineUsers: string[];
    socket: Socket | null;

    checkAuth: () => Promise<void>;
    connectSocket: (userData: any) => void;
    login: (state: string, credential: any) => Promise<void>;
    logout: () => void;
    updateProfile: (profileData: any) => Promise<void>;
}

const configureAxiosAuth = (token: string | null) => {
    if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete axios.defaults.headers.common['Authorization'];
    }
};

export const useAuthStore = create<AuthState>((set, get) => ({
    // State
    token: localStorage.getItem('token'),
    authUser: null,
    onlineUsers: [],
    socket: null,

    // Check authentication
    checkAuth: async () => {
        try {
            const token = get().token;

            configureAxiosAuth(token);

            const { data } = await axios.get('/api/auth/check-auth');

            if (data?.success) {
                set({
                    authUser: data.user,
                });

                get().connectSocket(data.user);
            }
        } catch (error: any) {
            toast.error(error.message || 'Authentication check failed');
        }
    },

    // Connect socket
    connectSocket: (userData) => {
        if (!userData) return;

        const currentSocket = get().socket;

        if (currentSocket?.connected) return;

        const newSocket = io(backendUrl, {
            query: {
                userId: userData._id,
            },
        });

        newSocket.connect();

        set({
            socket: newSocket,
        });

        newSocket.on('getOnlineUsers', (users: string[]) => {
            set({
                onlineUsers: users,
            });
        });
    },

    // Login / Signup
    login: async (state, credential) => {
        try {
            const { data } = await axios.post(`/api/auth/${state}`, credential);

            if (data?.success) {
                set({
                    token: data.token,
                    authUser: data.userData,
                });

                localStorage.setItem('token', data.token);

                configureAxiosAuth(data.token);

                get().connectSocket(data.userData);

                toast.success(data.message);
            } else {
                toast.error(data.message || 'Authentication failed');
            }
        } catch (error: any) {
            toast.error(error.message || 'Authentication failed');
        }
    },
    logout: () => {
        // Disconnect socket
        const socket = get().socket;

        if (socket) {
            socket.disconnect();
        }

        // Clear Zustand state
        set({
            token: null,
            authUser: null,
            onlineUsers: [],
            socket: null,
        });

        // Remove token from localStorage
        localStorage.removeItem('token');

        // Remove Axios authorization
        configureAxiosAuth(null);

        toast.success('Logged out successfully');
    },
    updateProfile: async (profileData) => {
        try {
            const { data } = await axios.put('/api/auth/update-profile', profileData);
            if (data?.success) {
                set({
                    authUser: data.user,
                });
                toast.success(data.message);
            }
        } catch (error: any) {
            toast.error(error.message || 'Profile update failed');
        }
    },
}));
