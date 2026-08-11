import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import assets from '../assets/assets';
import { useAuthStore } from '../store/authStore';

const ProfilePage = () => {
    const authUser  = useAuthStore((state) => state.authUser);
    const updateProfile = useAuthStore((state) => state.updateProfile);
    const [selectedImg, setSelectedImg] = useState<File | null>(null);
    const navigate = useNavigate();
    const [name, setName] = useState(authUser.fullName);
    const [bio, setBio] = useState(authUser.bio);

    const handleOnsubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedImg) {
            await updateProfile({ fullName: name, bio });
            navigate('/');
            return;
        }
        const reader = new FileReader();
        reader.readAsDataURL(selectedImg);
        reader.onload = async () => {
            const base64Image = reader.result;
            await updateProfile({ profilePic: base64Image, fullname: name, bio });
        };
        navigate('/');
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-cover bg-no-repeat">
            <div className="flex w-5/6 max-w-2xl items-center justify-between rounded-lg border-2 border-gray-600 text-gray-300 backdrop-blur-2xl max-sm:flex-col-reverse">
                <form className="flex flex-1 flex-col gap-5 p-10" onSubmit={handleOnsubmit}>
                    <h3 className="mb-4 text-lg font-medium">Profile details</h3>
                    <label htmlFor="avtar" className="flex cursor-pointer items-center gap-3">
                        <input
                            type="file"
                            id="avtar"
                            accept=".png, .jpeg, .jpg"
                            hidden
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setSelectedImg(e.target.files ? e.target.files[0] : null)
                            }
                        />
                        <img
                            src={
                                selectedImg ? URL.createObjectURL(selectedImg) : assets.avatar_icon
                            }
                            alt=""
                            className={`h-12 w-12 ${selectedImg && 'rounded-full'}`}
                        />
                        Upload Profile image
                    </label>
                    <input
                        type="text"
                        name="name"
                        required
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="rounded-md border border-gray-500 p-2 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                    />
                    <textarea
                        name="bio"
                        id="bio"
                        required
                        value={bio}
                        rows={4}
                        onChange={(e) => setBio(e.target.value)}
                        className="rounded-md border border-gray-500 p-2 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                    />
                    <button
                        type="submit"
                        className="cursor-pointer rounded-full bg-gradient-to-r from-purple-400 to-violet-600 p-2 text-lg text-white"
                    >
                        Save
                    </button>
                </form>
                <img
                    src={authUser?.profilePic || assets.logo_icon}
                    alt=""
                    className={`mx-10 aspect-square max-w-44 rounded-full max-sm:mt-10 ${selectedImg && 'rounded-full'}`}
                />
            </div>
        </div>
    );
};

export default ProfilePage;
