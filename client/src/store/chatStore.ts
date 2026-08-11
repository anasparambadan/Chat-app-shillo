import { create } from 'zustand';
import axios from 'axios';
import { toast } from 'react-hot-toast/headless';
import type { Socket } from 'socket.io-client';

interface ChatState {
    messages: any[];
    selectedUser: any;
    users: any[];
    unseenMessages: Record<string, number>;

    newMessageCount: number;

    messageHandler: ((message: any) => void) | null;

    getChatListUsers: () => Promise<void>;
    getMessages: (userId: string) => Promise<void>;

    sendMessage: (userId: string, message?: string, image?: string) => Promise<void>;

    subscribeToMessages: (socket: Socket) => void;
    unsubscribeFromMessages: (socket: Socket) => void;

    setSelectedUser: (user: any) => void;
    clearUnseenMessages: (userId: string) => void;
    clearNewMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
    // states
    messages: [],
    selectedUser: null,
    users: [],
    unseenMessages: {},
    newMessageCount: 0,
    messageHandler: null,

    // GET CHAT LIST USERS
    getChatListUsers: async () => {
        try {
            const { data } = await axios.get('/api/messages/users');

            set({
                users: data.users,
                unseenMessages: data.unseenMessages,
            });
        } catch (error: any) {
            console.error('Error fetching chat users:', error);

            toast.error(error.message || 'Failed to fetch chat users');
        }
    },

    //get messages
    getMessages: async (userId) => {
        try {
            const { data } = await axios.get(`/api/messages/${userId}`);

            if (data.success) {
                set({
                    messages: data.messages,
                    newMessageCount: 0,
                });
            }
        } catch (error: any) {
            console.error('Error fetching chat:', error);

            toast.error(error.message || 'Failed to fetch chat');
        }
    },

    // send a message
    sendMessage: async (userId, message = '', image) => {
        try {
            const { data } = await axios.post(`/api/messages/send/${userId}`, {
                text: message,
                image,
            });

            if (data.success) {
                set((state) => ({
                    messages: [...state.messages, data.newMessage],
                }));
            } else {
                toast.error(data.message || 'Failed to send message');
            }
        } catch (error: any) {
            console.error('Error sending message:', error);

            toast.error(error.message || 'Failed to send message');
        }
    },

    //suscribe to messages
    subscribeToMessages: (socket) => {
        const handleNewMessage = (newMessage: any) => {
            const selectedUser = get().selectedUser;

            // Message belongs to the currently opened chat
            if (selectedUser && newMessage.senderId === selectedUser._id) {
                newMessage.seen = true;

                set((state) => ({
                    messages: [...state.messages, newMessage],
                    newMessageCount: state.newMessageCount + 1,
                }));
                axios.put(`/api/messages/${newMessage._id}/seen`);

                return;
            }

            set((state) => ({
                unseenMessages: {
                    ...state.unseenMessages,

                    [newMessage.senderId]: (state.unseenMessages[newMessage.senderId] || 0) + 1,
                },
            }));
        };

        set({
            messageHandler: handleNewMessage,
        });

        socket.on('newMessage', handleNewMessage);
    },

    //unsuscribe from messages
    unsubscribeFromMessages: (socket) => {
        const messageHandler = get().messageHandler;

        if (!messageHandler) return;

        socket.off('newMessage', messageHandler);

        set({
            messageHandler: null,
        });
    },

    // select user to chat
    setSelectedUser: (user) => {
        set({
            selectedUser: user,
            newMessageCount: 0,
        });
    },

    // clear message count in the chatlist
    clearUnseenMessages: (userId) => {
        set((state) => ({
            unseenMessages: {
                ...state.unseenMessages,
                [userId]: 0,
            },
        }));
    },

    //    clear new message indicator in chat container
    clearNewMessages: () => {
        set({
            newMessageCount: 0,
        });
    },
}));
