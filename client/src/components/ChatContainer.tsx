import { useContext, useEffect, useRef, useState } from 'react';
import assets from '../assets/assets';
import { formatMessageTime } from '../lib/utils';
import { AuthContext } from '../context/AuthContext';
import { ChatContext } from '../context/ChatContext';
import { toast } from 'react-hot-toast/headless';

const ChatContainer = () => {
    const { messages, getMessages, selectedUser, setSelectedUser, sendMessage } =
        useContext(ChatContext);
    const { authUser, onlineUsers } = useContext(AuthContext);
    console.log(selectedUser, 'selected user in chat container');
    console.log(authUser, 'auth user in chat container');
    const [input, setInput] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // handle send message function
    const handleSendMessage = async (e?: React.FormEvent | React.KeyboardEvent) => {
        e?.preventDefault();

        if (!input.trim() && !selectedImage) return;

        await sendMessage(selectedUser._id, input.trim(), selectedImage || undefined);

        setInput('');
        setSelectedImage(null);
    };

    // handle sending image

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

        // Allows selecting the same image again later
        e.target.value = '';
    };

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (selectedUser) {
            getMessages(selectedUser._id);
        }
    }, [selectedUser]);

    useEffect(() => {
        if (scrollRef.current && messages) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);
    return selectedUser ? (
        <div className="relative h-full overflow-scroll backdrop-blur-lg">
            <div className="mx-4 flex items-center gap-3 border-b border-stone-500 py-3">
                <img
                    src={selectedUser.profilepic || assets.avatar_icon}
                    alt=""
                    className="w-8 rounded-full"
                />
                <p className="flex flex-1 items-center gap-2 text-lg text-white">
                    {selectedUser.fullName}
                    {onlineUsers.includes(selectedUser._id) && (
                        <span className="h-2 w-2 rounded-full bg-green-500"></span>
                    )}
                </p>
                <img
                    onClick={() => {
                        setSelectedUser(null);
                    }}
                    src={assets.arrow_icon}
                    alt=""
                    className="max-w-7 md:hidden"
                />
                <img src={assets.help_icon} alt="" className="max-w-5 max-md:hidden" />
            </div>
            {/* chat */}
            <div className="flex h-[calc(100%-120px)] flex-col overflow-y-scroll p-3 pb-6">
                {messages.map(
                    (message, index) => (
                        (
                            <div
                                key={message._id}
                                className={`flex items-end justify-end gap-2 ${message.senderId !== authUser._id && 'flex-row-reverse'}`}
                            >
                                {message.image ? (
                                    <img
                                        src={message.image}
                                        alt=""
                                        className="mb-7 max-w-[230px] overflow-hidden rounded-lg border border-gray-700"
                                    />
                                ) : (
                                    <p
                                        className={`mb-7 max-w-[200px] rounded-lg bg-violet-500/35 p-2 font-light break-all text-white md:text-sm ${message.senderId === authUser._id ? 'rounded-br-none' : 'rounded-bl-none'}`}
                                    >
                                        {message.text}
                                    </p>
                                )}
                                <div className="text-center text-xs">
                                    <img
                                        src={
                                            message.senderId === authUser._id
                                                ? authUser?.profilePic || assets.avatar_icon
                                                : selectedUser?.profilePic || assets.avatar_icon
                                        }
                                        alt=""
                                         className="h-7 w-7 rounded-full object-cover"
                                    />
                                    <p className="text-gray-500">
                                        {formatMessageTime(message.createdAt)}
                                    </p>
                                </div>
                            </div>
                        )
                    ),
                )}
                <div ref={scrollRef}></div>
            </div>
            {/* message input */}
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
