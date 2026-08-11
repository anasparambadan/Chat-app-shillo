import { useEffect } from 'react';
import ChatContainer from '../components/ChatContainer';
import RightSidebar from '../components/RightSidebar';
import Sidebar from '../components/Sidebar';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';

const HomePage = () => {
    const selectedUser = useChatStore((state) => state.selectedUser);
    const subscribeToMessages = useChatStore((state) => state.subscribeToMessages);
    const unsubscribeFromMessages = useChatStore((state) => state.unsubscribeFromMessages);
    const socket = useAuthStore((state) => state.socket);

    // Subscribe to incoming messages
    useEffect(() => {
        if (!socket) return;

        subscribeToMessages(socket);

        return () => {
            unsubscribeFromMessages(socket);
        };
    }, [socket, subscribeToMessages, unsubscribeFromMessages]);

    return (
        <div className="h-screen w-full border sm:px-[15%] sm:py-[5%]">
            <div
                className={`relative grid h-full grid-cols-1 overflow-hidden rounded-2xl border-2 border-gray-600 backdrop-blur-xl ${
                    selectedUser
                        ? 'md:grid-cols-[1fr_1.5fr_1fr] xl:grid-cols-[1fr_2fr_1fr]'
                        : 'md:grid-cols-2'
                }`}
            >
                <Sidebar />
                <ChatContainer />
                <RightSidebar />
            </div>
        </div>
    );
};

export default HomePage;
