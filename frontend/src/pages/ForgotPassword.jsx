import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, AlertCircle, ArrowLeft, CheckCircle2, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import tvsLogo from '../assets/j3.webp';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { forgotPassword } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await forgotPassword(email);

        if (result.success) {
            setIsSubmitted(true);
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
                    <Link to="/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-tvs-blue transition-colors mb-8 group">
                        <div className="p-2 rounded-full border border-slate-100 group-hover:bg-tvs-blue/10 group-hover:border-tvs-blue/20 transition-all">
                            <ArrowLeft size={16} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest">Back to Login</span>
                    </Link>
                    
                    <img src={tvsLogo} alt="TVS Logo" className="h-12 w-auto mx-auto mb-6" />
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-outfit px-4">
                        Trouble Signing In?
                    </h2>
                    <p className="mt-3 text-sm text-slate-500 font-inter px-8">
                        Enter your registered email below and we'll send you a secure link to reset your account.
                    </p>
                </div>

                <div className="mt-8">
                    <div className="glass-card p-10 rounded-3xl border border-slate-200 shadow-2xl shadow-slate-200/70 overflow-hidden relative bg-white/80 backdrop-blur-xl">
                        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-tvs-blue via-sky-400 to-tvs-red" />

                        <AnimatePresence mode="wait">
                            {!isSubmitted ? (
                                <motion.form
                                    key="forgot-form"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0, x: -20 }}
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
                                        <label htmlFor="email" className="text-xs font-semibold text-slate-700 uppercase tracking-widest ml-1">
                                            Registered Email
                                        </label>
                                        <div className="relative group/input">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within/input:text-tvs-blue transition-colors">
                                                <Mail size={18} />
                                            </div>
                                            <input
                                                id="email"
                                                type="email"
                                                required
                                                className="block w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-tvs-blue/5 focus:border-tvs-blue transition-all outline-none text-slate-900 placeholder:text-slate-300 font-inter shadow-sm"
                                                placeholder="e.g. employee@tvs.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
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
                                            <>
                                                <span>Send Recovery Link</span>
                                                <Send size={16} />
                                            </>
                                        )}
                                    </motion.button>
                                </motion.form>
                            ) : (
                                <motion.div
                                    key="success-message"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-4"
                                >
                                    <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm ring-4 ring-emerald-50/50">
                                        <CheckCircle2 size={40} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">Check your inbox</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">
                                        We've sent a password recovery link to:<br />
                                        <span className="font-bold text-slate-900">{email}</span>
                                    </p>
                                    <button
                                        onClick={() => setIsSubmitted(false)}
                                        className="mt-8 text-xs font-bold text-tvs-blue uppercase tracking-widest hover:text-blue-700 transition-colors"
                                    >
                                        Didn't get the email? Try again
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-10 text-center"
                    >
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                            Official TVS Asset Management Portal
                        </p>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
