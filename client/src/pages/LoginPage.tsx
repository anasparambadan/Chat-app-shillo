import assets from '../assets/assets';
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';

const LoginPage = () => {
    const [currentForm, setCurrentForm] = useState<'login' | 'signup'>('login');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [bio, setBio] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const login = useAuthStore((state) => state.login);

    const handleOnsubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (currentForm === 'signup' && !isSubmitted) {
            setIsSubmitted(true);
            return;
        }
        login(currentForm === 'login' ? 'login' : 'signup', {
            fullName,
            email,
            password,
            bio,
        });
    };
    return (
        <div className="flex min-h-screen items-center justify-center gap-8 bg-cover bg-center backdrop-blur-2xl max-sm:flex-col sm:justify-evenly">
            {/* ----------left-side---------- */}
            <img src={assets.logo_big} alt="" className="w-[min(30vw,250px)]" />
            {/* ----------right-side---------- */}
            <form
                onSubmit={handleOnsubmit}
                className="flex flex-col gap-6 rounded-lg border-2 border-gray-500 bg-white/8 p-6 text-white shadow-lg"
            >
                <h2 className="flex items-center justify-between text-2xl font-medium">
                    {currentForm}
                    {isSubmitted && (
                        <img
                            onClick={() => setIsSubmitted(false)}
                            src={assets.arrow_icon}
                            alt=""
                            className="w-5 cursor-pointer"
                        />
                    )}
                </h2>
                {currentForm === 'signup' && !isSubmitted && (
                    <input
                        onChange={(e) => setFullName(e.target.value)}
                        value={fullName}
                        type="text"
                        placeholder="Full Name"
                        className="rounded-md border border-gray-500 p-2 focus:outline-none"
                        required
                    />
                )}
                {!isSubmitted && (
                    <>
                        <input
                            onChange={(e) => setEmail(e.target.value)}
                            value={email}
                            type="email"
                            placeholder="Email"
                            required
                            className="rounded-md border border-gray-500 p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />

                        <input
                            onChange={(e) => setPassword(e.target.value)}
                            value={password}
                            type="password"
                            placeholder="Password"
                            required
                            className="rounded-md border border-gray-500 p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                    </>
                )}
                {isSubmitted && currentForm === 'signup' && (
                    <textarea
                        onChange={(e) => setBio(e.target.value)}
                        rows={4}
                        value={bio}
                        placeholder="Enter a short bio"
                        required
                        className="rounded-md border border-gray-500 p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                )}
                <button
                    type="submit"
                    className="cursor-pointer rounded-md bg-gradient-to-r from-purple-400 to-violet-600 py-3 text-white"
                >
                    {currentForm === 'signup' ? 'Signup' : 'Login'}
                </button>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <input type="checkbox" />
                    <p>Agree to terms and conditions.</p>
                </div>
                <div className="flex flex-col gap-2">
                    {currentForm === 'signup' ? (
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <span
                                onClick={() => setCurrentForm('login')}
                                className="cursor-pointer font-medium text-violet-500"
                            >
                                login
                            </span>
                        </p>
                    ) : (
                        <p className="text-sm text-gray-600">
                            Don't have an account?{' '}
                            <span
                                onClick={() => setCurrentForm('signup')}
                                className="cursor-pointer font-medium text-violet-500"
                            >
                                signup
                            </span>
                        </p>
                    )}
                </div>
            </form>
        </div>
    );
};

export default LoginPage;
