import { createContext, useContext, useEffect, useState } from 'react';
import { AuthContext } from './AuthContext';
import { toast } from 'react-hot-toast/headless';
export const ChatContext = createContext<ChatContextType | null>(null);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
    const [messages, setMessages] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [unseenMessages, setUnseenMessages] = useState({});

    const { axios, socket } = useContext(AuthContext);

    // get chat list users

    const getChatListUsers = async () => {
        try {
            const { data } = await axios.get('/api/messages/users');
            setUsers(data.users);
            setUnseenMessages(data.unseenMessages);
        } catch (error: any) {
            console.error('Error fetching chat users:', error);
            toast.error(error.message || 'Failed to fetch chat users');
        }
    };

    // get messages of selected user

    const getMessages = async (userId: string) => {
        try {
            const { data } = await axios.get(`/api/messages/${userId}`);
            if (data.success) {
                setMessages(data.messages);
            }
        } catch (error: any) {
            console.error('Error fetching chat:', error);
            toast.error(error.message || 'Failed to fetch chat');
        }
    };

    // send message to selected user

    const sendMessage = async (userId: string, message: string = '', image?: string) => {
        try {
            const { data } = await axios.post(`/api/messages/send/${userId}`, {
                text: message,
                image,
            });

            if (data.success) {
                setMessages((prevMessages) => [...prevMessages, data.newMessage]);
            } else {
                toast.error(data.message || 'Failed to send message');
            }
        } catch (error: any) {
            console.error('Error sending message:', error);
            toast.error(error.message || 'Failed to send message');
        }
    };

    // suscribe to the message from selected user

    const subscribeToMessages = async () => {
        if (!socket) return;

        socket.on('newMessage', (newMessage: any) => {
            if (selectedUser && newMessage.senderId === selectedUser._id) {
                newMessage.seen = true;
                setMessages((prevMessages) => [...prevMessages, newMessage]);
                axios.put(`/api/messages/mark/${newMessage._id}`);
            } else {
                setUnseenMessages((prevUnseenMessages) => ({
                    ...prevUnseenMessages,
                    [newMessage.senderId]: (prevUnseenMessages[newMessage.senderId] || 0) + 1,
                }));
            }
        });
    };

    // unsuscribe form messages

    const unsubscribeFromMessages = () => {
        if (!socket) return;
        socket.off('newMessage');
    };

    useEffect(() => {
        subscribeToMessages();
        return () => {
            unsubscribeFromMessages();
        };
    }, [socket, selectedUser]);

    const value = {
        messages,
        setMessages,
        selectedUser,
        setSelectedUser,
        users,
        getChatListUsers,
        sendMessage,
        unseenMessages,
        setUnseenMessages,
        getMessages,
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
