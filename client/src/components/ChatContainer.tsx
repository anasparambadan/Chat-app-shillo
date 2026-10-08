import { useEffect, useRef, useState } from 'react';
import assets from '../assets/assets';
import { formatMessageTime } from '../lib/utils';
import { toast } from 'react-hot-toast/headless';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';

const ChatContainer = () => {
    const messages = useChatStore((state) => state.messages);
    const getMessages = useChatStore((state) => state.getMessages);
    const selectedUser = useChatStore((state) => state.selectedUser);
    const setSelectedUser = useChatStore((state) => state.setSelectedUser);
    const sendMessage = useChatStore((state) => state.sendMessage);
    const authUser = useAuthStore((state) => state.authUser);
    const onlineUsers = useAuthStore((state) => state.onlineUsers);
    const newMessageCount = useChatStore((state) => state.newMessageCount);
    const clearNewMessages = useChatStore((state) => state.clearNewMessages);
    const hasMoreMessages = useChatStore((state) => state.hasMoreMessages);
    const isLoadingMoreMessages = useChatStore((state) => state.isLoadingMoreMessages);
    const markMessagesSeen = useChatStore((state) => state.markMessagesSeen);

    const [input, setInput] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const isInitialLoad = useRef(true);
    const shouldScrollToBottom = useRef(false);
    const isNearBottom = useRef(true);
    const isLoadingOlderMessages = useRef(false);
    const isMarkingSeen = useRef(false);

    const markCurrentChatAsSeen = async () => {
        if (!selectedUser || isMarkingSeen.current) return;

        isMarkingSeen.current = true;

        try {
            const success = await markMessagesSeen(selectedUser._id);

            if (success) {
                clearNewMessages();
            }
        } finally {
            isMarkingSeen.current = false;
        }
    };

    const handleScroll = async () => {
        const container = messagesContainerRef.current;

        if (!container || !selectedUser) return;

        const distanceFromBottom =
            container.scrollHeight - container.scrollTop - container.clientHeight;

        const nearBottom = distanceFromBottom < 100;

        isNearBottom.current = nearBottom;

        // User reached the bottom
        if (nearBottom) {
            markCurrentChatAsSeen();
        }

        // Load older messages when reaching the top
        if (
            container.scrollTop <= 50 &&
            hasMoreMessages &&
            !isLoadingMoreMessages &&
            !isLoadingOlderMessages.current
        ) {
            const oldestMessage = messages[0];

            if (!oldestMessage) return;

            isLoadingOlderMessages.current = true;

            const previousScrollHeight = container.scrollHeight;
            const previousScrollTop = container.scrollTop;

            await getMessages(selectedUser._id, oldestMessage._id);

            requestAnimationFrame(() => {
                const newScrollHeight = container.scrollHeight;

                container.scrollTop = previousScrollTop + (newScrollHeight - previousScrollHeight);

                isLoadingOlderMessages.current = false;
            });
        }
    };

    useEffect(() => {
        if (!selectedUser) return;

        isInitialLoad.current = true;
        isLoadingOlderMessages.current = false;
        shouldScrollToBottom.current = false;
        isNearBottom.current = true;

        getMessages(selectedUser._id);

        setTimeout(() => {
            inputRef.current?.focus();
        }, 0);
    }, [selectedUser, getMessages]);

    // Scroll to the latest message
    useEffect(() => {
        const container = messagesContainerRef.current;

        if (!container || !messages.length) return;

        // Initial chat load
        if (isInitialLoad.current) {
            container.scrollTop = container.scrollHeight;
            isInitialLoad.current = false;

            markCurrentChatAsSeen();

            return;
        }

        // Older messages were loaded.
        // Do NOT scroll to bottom and do not mark them as seen.
        if (isLoadingOlderMessages.current) {
            return;
        }

        // We sent a message.
        if (shouldScrollToBottom.current) {
            container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth',
            });

            shouldScrollToBottom.current = false;

            return;
        }

        // Someone else sent a message while we were near the bottom.
        if (isNearBottom.current) {
            container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth',
            });

            markCurrentChatAsSeen();
        }
    }, [messages, selectedUser]);

    const handleSendMessage = async (e?: React.FormEvent | React.KeyboardEvent) => {
        e?.preventDefault();

        if (!selectedUser) return;

        if (!input.trim() && !selectedImage) return;
        shouldScrollToBottom.current = true;

        await sendMessage(selectedUser._id, input.trim(), selectedImage || undefined);

        setInput('');
        setSelectedImage(null);
    };

    const handleSendImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (!file || !file.type.startsWith('image/')) {
            toast.error('Please select a valid image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be less than 5MB');
            return;
        }

        const reader = new FileReader();

        reader.onloadend = () => {
            setSelectedImage(reader.result as string);
        };

        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const getMessageStatus = (message: any) => {
        if (message.seenAt) {
            return <span className="text-blue-500">✓✓</span>;
        }

        if (message.deliveredAt) {
            return <span className="text-gray-400">✓✓</span>;
        }

        return <span className="text-gray-400">✓</span>;
    };

    return selectedUser ? (
        <div className="relative h-full overflow-scroll backdrop-blur-lg">
            <div className="mx-4 flex items-center gap-3 border-b border-stone-500 py-3">
                <img
                    src={selectedUser.profilePic || assets.avatar_icon}
                    alt=""
                    className="w-8 rounded-full"
                />

                <p className="flex flex-1 items-center gap-2 text-lg text-white">
                    {selectedUser.fullName}

                    {onlineUsers.includes(selectedUser._id) && (
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                    )}
                </p>

                <img
                    onClick={() => setSelectedUser(null)}
                    src={assets.arrow_icon}
                    alt=""
                    className="max-w-7 md:hidden"
                />

                <img src={assets.help_icon} alt="" className="max-w-5 max-md:hidden" />
            </div>

            {/* Messages */}
            <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex h-[calc(100%-120px)] flex-col overflow-y-scroll p-3 pb-6"
            >
                {isLoadingMoreMessages && (
                    <p className="py-2 text-center text-xs text-gray-500">
                        Loading older messages...
                    </p>
                )}
                {messages.map((message) => (
                    <div
                        key={message._id}
                        className={`flex items-end justify-end gap-2 ${
                            message.senderId !== authUser._id ? 'flex-row-reverse' : ''
                        }`}
                    >
                        {message.image ? (
                            <img
                                src={message.image}
                                alt=""
                                className="mb-7 max-w-[230px] overflow-hidden rounded-lg border border-gray-700"
                            />
                        ) : (
                            <p
                                className={`mb-7 max-w-[200px] rounded-lg bg-violet-500/35 p-2 font-light break-all text-white md:text-sm ${
                                    message.senderId === authUser._id
                                        ? 'rounded-br-none'
                                        : 'rounded-bl-none'
                                }`}
                            >
                                {message.text}
                            </p>
                        )}

                        <div className="text-center text-xs">
                            <img
                                src={
                                    message.senderId === authUser._id
                                        ? authUser?.profilePic || assets.avatar_icon
                                        : selectedUser.profilePic || assets.avatar_icon
                                }
                                alt=""
                                className="h-7 w-7 rounded-full object-cover"
                            />

                            <div className="flex items-center justify-center gap-1">
                                <p className="text-gray-500">
                                    {formatMessageTime(message.createdAt)}
                                </p>

                                {message.senderId === authUser._id && (
                                    <p className="mt-0.5 text-xs">{getMessageStatus(message)}</p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {newMessageCount > 0 && (
                <button
                    onClick={() => {
                        messagesContainerRef.current?.scrollTo({
                            top: messagesContainerRef.current.scrollHeight,
                            behavior: 'smooth',
                        });

                        markCurrentChatAsSeen();
                    }}
                    className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-violet-600 px-4 py-2 text-sm text-white shadow-lg"
                >
                    {newMessageCount === 1
                        ? '1 new message ↓'
                        : `${newMessageCount} new messages ↓`}
                </button>
            )}

            {/* Message input */}
            <div className="absolute right-0 bottom-0 left-0 flex items-center gap-3 p-3">
                <div className="flex flex-1 items-center rounded-full bg-gray-100/12 px-3">
                    {selectedImage ? (
                        <div className="relative flex flex-1 items-center py-2">
                            <img
                                src={selectedImage}
                                alt="Selected"
                                className="h-14 w-14 rounded-lg object-cover"
                            />

                            <button
                                type="button"
                                onClick={() => setSelectedImage(null)}
                                className="absolute top-0 left-12 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                            >
                                ×
                            </button>
                        </div>
                    ) : (
                        <input
                            ref={inputRef}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSendMessage(e);
                                }
                            }}
                            value={input}
                            type="text"
                            placeholder="Type your message..."
                            className="flex-1 rounded-lg border-none p-3 text-sm text-white placeholder-gray-400 outline-none"
                        />
                    )}

                    <input
                        onChange={handleSendImage}
                        type="file"
                        id="image"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                    />

                    <label htmlFor="image">
                        <img
                            src={assets.gallery_icon}
                            alt="Attach"
                            className="mr-2 h-5 w-5 cursor-pointer"
                        />
                    </label>
                </div>

                <img
                    src={assets.send_button}
                    alt="Send"
                    className="w-7 cursor-pointer"
                    onClick={handleSendMessage}
                />
            </div>
        </div>
    ) : (
        <div className="flex flex-col items-center justify-center gap-2 bg-white/10 text-gray-500 max-md:hidden">
            <img src={assets.logo_icon} alt="" className="max-w-16" />

            <p className="text-lg font-medium text-white">chat anytime, anywhere</p>
        </div>
    );
};

export default ChatContainer;
