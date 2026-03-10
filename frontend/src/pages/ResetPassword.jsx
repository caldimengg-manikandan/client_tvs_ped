import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Lock, AlertCircle, CheckCircle2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import tvsLogo from '../assets/j3.webp';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { resetPassword } = useAuth();
    const { token } = useParams();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        setIsLoading(true);

        const result = await resetPassword(token, password);

        if (result.success) {
            setIsSuccess(true);
            toast.success('Password successfully reset!');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } else {
            setError(result.message);
        }

        setIsLoading(false);
    };

    return (
        <div className="h-screen relative overflow-hidden flex items-center justify-center bg-white py-6 px-4">
            <div className="absolute inset-0 -z-20 bg-gradient-to-br from-white via-slate-50 to-white" />
            <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-tvs-blue/10 blur-[120px]" />
            <div className="absolute -right-40 -bottom-40 h-80 w-80 rounded-full bg-tvs-red/10 blur-[120px]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-md w-full mx-auto space-y-8 relative"
            >
                <div className="text-center">
                    <img src={tvsLogo} alt="TVS Logo" className="h-12 w-auto mx-auto mb-6" />
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-outfit">
                        Reset Your Password
                    </h2>
                    <p className="mt-3 text-sm text-slate-500 font-inter px-8">
                        Almost there! Create a new secure password for your TVS account.
                    </p>
                </div>

                <div className="mt-8">
                    <div className="glass-card p-10 rounded-3xl border border-slate-200 shadow-2xl shadow-slate-200/70 overflow-hidden relative bg-white/80 backdrop-blur-xl">
                        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-emerald-400 via-tvs-blue to-sky-400" />

                        <AnimatePresence mode="wait">
                            {!isSuccess ? (
                                <motion.form
                                    key="reset-form"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-6"
                                    onSubmit={handleSubmit}
                                >
                                    {error && (
                                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 text-sm">
                                            <AlertCircle size={18} className="shrink-0" />
                                            <span className="font-medium">{error}</span>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-widest ml-1">
                                            New Password
                                        </label>
                                        <div className="relative group/input">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within/input:text-tvs-blue transition-colors">
                                                <Lock size={18} />
                                            </div>
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                className="block w-full pl-12 pr-12 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-tvs-blue/5 focus:border-tvs-blue transition-all outline-none text-slate-900 placeholder:text-slate-300 font-inter shadow-sm"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-900 transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-widest ml-1">
                                            Confirm New Password
                                        </label>
                                        <div className="relative group/input">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within/input:text-tvs-blue transition-colors">
                                                <ShieldCheck size={18} />
                                            </div>
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                className="block w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-tvs-blue/5 focus:border-tvs-blue transition-all outline-none text-slate-900 placeholder:text-slate-300 font-inter shadow-sm"
                                                placeholder="••••••••"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: isLoading ? 1 : 1.02 }}
                                        whileTap={{ scale: isLoading ? 1 : 0.98 }}
                                        type="submit"
                                        disabled={isLoading}
                                        className={`w-full relative overflow-hidden flex items-center justify-center gap-2 py-4 px-4 rounded-2xl shadow-lg shadow-tvs-blue/30 text-sm font-bold text-white bg-slate-950 focus:outline-none transition-all ${
                                            isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-tvs-blue hover:shadow-tvs-blue/40'
                                        }`}
                                    >
                                        {isLoading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <span>Update Password</span>
                                        )}
                                    </motion.button>
                                </motion.form>
                            ) : (
                                <motion.div
                                    key="success-reset"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-4"
                                >
                                    <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm ring-4 ring-emerald-50/50">
                                        <CheckCircle2 size={40} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">Password Updated</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed mb-6">
                                        Success! Your password has been securely reset. Redirecting you to login...
                                    </p>
                                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: '100%' }}
                                            transition={{ duration: 2.5 }}
                                            className="h-full bg-emerald-500"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                            Secure Verification Protocol Active
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ResetPassword;
