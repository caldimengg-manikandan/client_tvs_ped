import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import tvsLogo from '../assets/tvslogo.jpg';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await login(email, password);

        if (result.success) {
            navigate(from, { replace: true });
        } else {
            setError(result.message);
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full -z-10 bg-[#f8fafc]">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-tvs-blue/5 blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-tvs-red/5 blur-[120px] animate-pulse delay-700"></div>
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="max-w-md w-full space-y-8 relative"
            >
                <div className="text-center">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="flex justify-center"
                    >
                        <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center w-24 h-24">
                            <img
                                className="h-12 w-auto object-contain"
                                src={tvsLogo}
                                alt="TVS Eurogrip"
                            />
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <h2 className="mt-8 text-3xl font-bold tracking-tight text-gray-900 font-outfit">
                            Sign in to your account
                        </h2>
                        <p className="mt-3 text-sm text-gray-500 font-inter">
                            Asset Management System
                        </p>
                    </motion.div>
                </div>

                <div className="mt-8">
                    <div className="glass-card p-8 rounded-3xl border border-white/40 shadow-2xl overflow-hidden relative group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-tvs-blue via-tvs-red to-tvs-blue bg-[length:200%_auto] animate-[gradient_3s_linear_infinite]"></div>
                        
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <AnimatePresence mode="wait">
                                {error && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0, y: -10 }}
                                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                                        exit={{ opacity: 0, height: 0, y: -10 }}
                                        className="bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 text-sm"
                                    >
                                        <AlertCircle size={18} className="shrink-0" />
                                        <span className="font-medium">{error}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-1">
                                <label htmlFor="email" className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">
                                    Email address
                                </label>
                                <div className="relative group/input">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within/input:text-tvs-blue transition-colors">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="block w-full pl-12 pr-4 py-3.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tvs-blue/20 focus:border-tvs-blue transition-all outline-none text-gray-700 placeholder:text-gray-400 font-inter"
                                        placeholder="admin@tvs.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label htmlFor="password" className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">
                                    Password
                                </label>
                                <div className="relative group/input">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within/input:text-tvs-blue transition-colors">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        required
                                        className="block w-full pl-12 pr-12 py-3.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tvs-blue/20 focus:border-tvs-blue transition-all outline-none text-gray-700 placeholder:text-gray-400 font-inter"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 transition-all outline-none"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <motion.button
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full relative overflow-hidden flex justify-center py-4 px-4 rounded-xl shadow-lg shadow-tvs-blue/20 text-sm font-bold text-white bg-tvs-blue hover:bg-tvs-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tvs-blue transition-all active:shadow-inner ${
                                        isLoading ? 'opacity-70 cursor-not-allowed' : ''
                                    }`}
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            Sign in to Dashboard
                                        </span>
                                    )}
                                </motion.button>
                            </div>
                        </form>
                    </div>
                    
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="mt-8 text-center text-xs text-gray-400 font-inter"
                    >
                        &copy; {new Date().getFullYear()} TVS Eurogrip. All rights reserved.
                    </motion.p>
                </div>
            </motion.div>

            {/* Bottom Accent */}
            <div className="fixed bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes gradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
            `}} />
        </div>
    );
};

export default Login;
