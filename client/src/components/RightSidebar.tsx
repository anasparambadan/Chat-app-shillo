import React, { useEffect } from 'react';
import assets from '../assets/assets';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';

const RightSidebar = () => {
    const selectedUser = useChatStore((state) => state.selectedUser);
    const messages = useChatStore((state) => state.messages);
    const logout = useAuthStore((state) => state.logout);
    const onlineUsers = useAuthStore((state) => state.onlineUsers);
    const [messageImages, setMessageImages] = React.useState<string[]>([]);
    useEffect(() => {
        setMessageImages(
            messages.filter((message: any) => message.image).map((message: any) => message.image),
        );
    }, [messages]);
    return (
        selectedUser && (
            <div
                className={`relative w-full overflow-y-scroll bg-[#8185B2]/10 text-white ${selectedUser ? 'mx-md:hidden' : ''}`}
            >
                <div className="mx-auto flex flex-col items-center gap-2 pt-16 text-xs font-light">
                    <img
                        src={selectedUser?.profilePic || assets.avatar_icon}
                        alt=""
                        className="aspect-square w-20 rounded-full"
                    />
                    <h1 className="mx-auto flex items-center gap-2 px-10 text-xl font-medium">
                        {onlineUsers?.includes(selectedUser?._id) && (
                            <p className="h-2 w-2 rounded-full bg-green-500"></p>
                        )}
                        {selectedUser?.fullName || 'USER'}
                    </h1>
                    <p className="mx-auto px-10">{selectedUser?.bio}</p>
                </div>

                <hr className="my-4 border-[#ffffff50]" />
                <div className="px-5 text-xs">
                    <p>Media</p>
                    <div className="mt-2 grid max-h-[200px] grid-cols-2 gap-4 overflow-y-scroll opacity-80">
                        {messageImages.map((url, index) => (
                            <div
                                key={index}
                                onClick={() => window.open(url)}
                                className="cursor-pointer rounded"
                            >
                                <img
                                    src={url}
                                    alt={`Media ${index}`}
                                    className="h-full rounded-md"
                                />
                            </div>
                        ))}
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="absolute bottom-5 left-1/2 -translate-x-1/2 transform cursor-pointer rounded-full border-none bg-gradient-to-r from-purple-400 to-violet-600 px-20 py-2 text-sm font-light text-white"
                >
                    Logout
                </button>
            </div>
        )
    );
};

export default RightSidebar;
