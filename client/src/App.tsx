import { Navigate, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { useEffect } from 'react';
import axios from 'axios';

const App = () => {
    const authUser = useAuthStore((state) => state.authUser);
    const token = useAuthStore((state) => state.token);
    const checkAuth = useAuthStore((state) => state.checkAuth);

    useEffect(() => {
        if (token) {
            checkAuth();
        }
    }, [token, checkAuth]);
    

    return (
        <div className="bg-[url('./src/assets/bgImage.svg')] bg-contain">
            <Toaster position="top-center" reverseOrder={false} />
            {/* <div className="bg-[url('./src/assets/bgImage.svg')] bg-no-repeat bg-contain bg-center min-h-screen"> */}
            <Routes>
                <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
                <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
                <Route
                    path="/profile"
                    element={authUser ? <ProfilePage /> : <Navigate to="/login" />}
                />
            </Routes>
        </div>
    );
};
export default App;
