import { useNavigate } from 'react-router-dom';
import assets from '../assets/assets';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';

const Sidebar = () => {
    const onlineUsers = useAuthStore((state) => state.onlineUsers);
    const logout = useAuthStore((state) => state.logout);
    const users = useChatStore((state) => state.users);
    const getChatListUsers = useChatStore((state) => state.getChatListUsers);
    const selectedUser = useChatStore((state) => state.selectedUser);
    const setSelectedUser = useChatStore((state) => state.setSelectedUser);
    const unseenMessages = useChatStore((state) => state.unseenMessages);
    const clearUnseenMessages = useChatStore((state) => state.clearUnseenMessages);

    const [input, setInput] = useState('');
    const filteredUsers = users.filter((user) =>
        user.fullName.toLowerCase().includes(input.toLowerCase()),
    );

    useEffect(() => {
        getChatListUsers();
    }, [onlineUsers]);

    const navigate = useNavigate();
    return (
        <div
            className={`h-full overflow-y-scroll rounded-r-xl bg-[#8185B2]/10 p-5 text-white ${selectedUser ? 'max-md:hidden' : ''}`}
        >
            <div className="pb-5">
                <div className="flex items-center justify-between">
                    <img src={assets.logo} alt="logo" className="max-w-40" />
                    <div className="group relative py-2">
                        <img src={assets.menu_icon} alt="logo" className="max-w-5 cursor-pointer" />
                        <div className="absolute top-full right-0 z-20 hidden w-32 rounded-md border border-gray-600 bg-[#282142] p-5 text-gray-100 group-hover:block">
                            <p
                                onClick={() => navigate('/profile')}
                                className="cursor-pointer text-sm"
                            >
                                Edit Profile
                            </p>
                            <hr className="my-2 border-t border-gray-500" />
                            <p onClick={() => logout()} className="cursor-pointer text-sm">
                                Logout
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-5 flex items-center gap-2 rounded-full bg-[#282142] px-4 py-3">
                    <img src={assets.search_icon} alt="Search" className="w-3" />
                    <input
                        onChange={(e) => setInput(e.target.value)}
                        type="text"
                        className="flex-1 border-none bg-transparent text-xs text-white placeholder-[#c8c8c8] outline-none"
                        placeholder="Search User..."
                    />
                </div>
            </div>
            <div className="flex flex-col">
                {filteredUsers.map((user) => (
                    <div
                        key={user._id}
                        onClick={() => {
                            setSelectedUser(user);
                            clearUnseenMessages(user._id);
                        }}
                        className={`relative flex cursor-pointer items-center gap-2 rounded p-2 pl-4 max-sm:text-sm ${selectedUser?._id === user._id && 'bg-[#282142]/50'}`}
                    >
                        <img
                            src={user?.profilePic || assets.avatar_icon}
                            alt=""
                            className="aspect-[1/1] w-[35px] rounded-full"
                        />
                        <div className="flex flex-col leading-5">
                            <p>{user.fullName}</p>
                            {onlineUsers.includes(user._id) ? (
                                <span className="text-xs text-green-400">Online</span>
                            ) : (
                                <span className="text-xs text-neutral-400">Offline</span>
                            )}
                        </div>
                        {unseenMessages[user._id] > 0 && (
                            <p className="absolute top-4 right-4 flex h-5 w-5 items-center justify-center rounded-full bg-violet-500/50 text-xs">
                                {unseenMessages[user._id]}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Sidebar;
