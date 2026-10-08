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
    hasMoreMessages: boolean;
    isLoadingMessages: boolean;
    isLoadingMoreMessages: boolean;

    messageHandler: ((message: any) => void) | null;
    messageDeliveredHandler: ((data: { messageId: string; deliveredAt: string }) => void) | null;
    messageSeenHandler: ((data: { messageIds: string[]; seenAt: string }) => void) | null;

    getChatListUsers: () => Promise<void>;
    getMessages: (userId: string, before?: string) => Promise<void>;

    sendMessage: (userId: string, message?: string, image?: string) => Promise<void>;

    subscribeToMessages: (socket: Socket) => void;
    unsubscribeFromMessages: (socket: Socket) => void;

    setSelectedUser: (user: any) => void;
    clearUnseenMessages: (userId: string) => void;
    clearNewMessages: () => void;
    markMessagesSeen: (userId: string) => Promise<boolean>;
}

export const useChatStore = create<ChatState>((set, get) => ({
    // states
    messages: [],
    selectedUser: null,
    users: [],
    unseenMessages: {},
    newMessageCount: 0,
    messageHandler: null,
    messageDeliveredHandler: null,
    messageSeenHandler: null,
    hasMoreMessages: true,
    isLoadingMessages: false,
    isLoadingMoreMessages: false,

    markMessagesSeen: async (userId) => {
        try {
            const { data } = await axios.put(`/api/messages/${userId}/seen`);

            if (data.success) {
                set((state) => ({
                    unseenMessages: {
                        ...state.unseenMessages,
                        [userId]: 0,
                    },
                }));

                return true;
            }

            return false;
        } catch (error: any) {
            console.error('Error marking messages as seen:', error);
            return false;
        }
    },

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
    getMessages: async (userId, before) => {
        try {
            // Initial chat loading
            if (!before) {
                set({
                    isLoadingMessages: true,
                });
            } else {
                // Loading older messages
                set({
                    isLoadingMoreMessages: true,
                });
            }

            const params = new URLSearchParams({
                limit: '30',
            });

            if (before) {
                params.set('before', before);
            }

            const { data } = await axios.get(`/api/messages/${userId}?${params.toString()}`);

            if (data.success) {
                set((state) => ({
                    messages: before ? [...data.messages, ...state.messages] : data.messages,

                    hasMoreMessages: data.hasMore,
                    newMessageCount: before ? state.newMessageCount : 0,

                    isLoadingMessages: false,
                    isLoadingMoreMessages: false,
                }));
            }
        } catch (error: any) {
            console.error('Error fetching chat:', error);

            set({
                isLoadingMessages: false,
                isLoadingMoreMessages: false,
            });

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

            // Tell the server that this client received the message.
            socket.emit('messageDelivered', {
                messageId: newMessage._id,
            });

            // Message belongs to the currently opened chat
            if (selectedUser && newMessage.senderId === selectedUser._id) {
                set((state) => ({
                    messages: [...state.messages, newMessage],
                    newMessageCount: state.newMessageCount + 1,
                }));

                return;
            }

            // Message belongs to another conversation
            set((state) => ({
                unseenMessages: {
                    ...state.unseenMessages,
                    [newMessage.senderId]: (state.unseenMessages[newMessage.senderId] || 0) + 1,
                },
            }));
        };

        const handleMessageDelivered = ({
            messageId,
            deliveredAt,
        }: {
            messageId: string;
            deliveredAt: string;
        }) => {
            set((state) => ({
                messages: state.messages.map((message) =>
                    message._id === messageId
                        ? {
                              ...message,
                              deliveredAt,
                          }
                        : message,
                ),
            }));
        };

        const handleMessageSeen = ({
            messageIds,
            seenAt,
        }: {
            messageIds: string[];
            seenAt: string;
        }) => {
            set((state) => ({
                messages: state.messages.map((message) =>
                    messageIds.includes(message._id)
                        ? {
                              ...message,
                              seenAt,
                          }
                        : message,
                ),
            }));
        };

        set({
            messageHandler: handleNewMessage,
            messageDeliveredHandler: handleMessageDelivered,
            messageSeenHandler: handleMessageSeen,
        });

        socket.on('newMessage', handleNewMessage);
        socket.on('messageDelivered', handleMessageDelivered);
        socket.on('messageSeen', handleMessageSeen);
    },

    //unsuscribe from messages
    unsubscribeFromMessages: (socket) => {
        const messageHandler = get().messageHandler;
        const messageDeliveredHandler = get().messageDeliveredHandler;
        const messageSeenHandler = get().messageSeenHandler;

        if (messageSeenHandler) {
            socket.off('messageSeen', messageSeenHandler);
        }

        if (messageHandler) {
            socket.off('newMessage', messageHandler);
        }

        if (messageDeliveredHandler) {
            socket.off('messageDelivered', messageDeliveredHandler);
        }

        set({
            messageHandler: null,
            messageDeliveredHandler: null,
            messageSeenHandler: null,
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
