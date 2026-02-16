import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import tvsLogo from '../assets/j3.webp';
import tvs1 from '../assets/j1.png';
import tvs2 from '../assets/tvs2.webp';
import tvs3 from '../assets/TVS 4.jpg';
import trolley1 from '../assets/t1.jpg';
import trolley2 from '../assets/t2.jpg';
import trolley3 from '../assets/t3.webp';

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

    const tiltX = useMotionValue(0);
    const tiltY = useMotionValue(0);

    const springConfig = { stiffness: 160, damping: 18, mass: 0.6 };
    const rotateX = useSpring(useTransform(tiltY, [-40, 40], [12, -12]), springConfig);
    const rotateY = useSpring(useTransform(tiltX, [-40, 40], [-12, 12]), springConfig);

    const handleHeroMouseMove = (event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;

        tiltX.set((x / rect.width) * 80);
        tiltY.set((y / rect.height) * 80);
    };

    const handleHeroMouseLeave = () => {
        tiltX.set(0);
        tiltY.set(0);
    };

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
        <div className="h-screen relative overflow-hidden flex items-center justify-center bg-white py-6 px-4 sm:px-6 lg:px-10">
            <div className="absolute inset-0 -z-20 bg-gradient-to-br from-white via-slate-50 to-white" />
            <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-tvs-blue/10 blur-[120px]" />
            <div className="absolute -right-40 -bottom-40 h-80 w-80 rounded-full bg-tvs-red/10 blur-[120px]" />

            <div className="relative max-w-6xl w-full grid grid-cols-1 lg:grid-cols-[1.15fr_minmax(0,1fr)] gap-10 items-center">
                <motion.div
                    className="relative hidden lg:block"
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    onMouseMove={handleHeroMouseMove}
                    onMouseLeave={handleHeroMouseLeave}
                >
                    <motion.div
                        style={{ rotateX, rotateY }}
                        className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-[0_40px_120px_rgba(15,23,42,0.6)]"
                        transition={{ type: 'spring', stiffness: 180, damping: 20 }}
                    >
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(59,130,246,0.35),transparent_55%),radial-gradient(circle_at_100%_100%,rgba(248,113,113,0.35),transparent_55%)]" />

                        <div className="relative p-8 xl:p-10 flex flex-col h-full items-center">
                            <div className="w-full max-w-md">
                                <div className="flex items-center justify-between gap-4 rounded-3xl bg-slate-950/80 border border-white/25 px-6 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-2 ring-white/40">
                                            <img
                                                src={tvs2}
                                                alt="TVS logo flag"
                                                className="h-8 w-auto object-contain"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold tracking-[0.18em] uppercase text-slate-100">
                                                TVS Motors
                                            </p>
                                            <p className="text-sm text-slate-200">
                                                MH Asset Management &amp; Performance
                                            </p>
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-6 py-2 min-w-[160px] text-xs uppercase tracking-[0.18em] text-slate-100/90">
                                        Secure Login
                                    </span>
                                </div>
                            </div>

                            <div className="mt-8 grid grid-rows-2 grid-cols-3 gap-4 flex-1">
                                <motion.div
                                    className="relative col-span-3 row-span-2 overflow-hidden rounded-2xl bg-slate-900/60 border border-white/20"
                                    whileHover={{ scale: 1.02 }}
                                    transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                                >
                                    <img
                                        src={tvs3}
                                        alt="TVS bikes lineup"
                                        className="h-full w-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-900/20" />
                                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-xs font-medium text-slate-200/90">TVS portfolio</p>
                                            <p className="text-sm font-semibold text-white">
                                                Scooters, commuters and performance machines in one view
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-4">
                                <motion.div
                                    className="relative overflow-hidden rounded-2xl border border-white/20 bg-slate-900/70"
                                    whileHover={{ y: -4, scale: 1.02 }}
                                    transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                                >
                                    <img
                                        src={tvs1}
                                        alt="TVS manufacturing plant"
                                        className="h-28 w-full object-cover"
                                    />
                                </motion.div>
                                <motion.div
                                    className="relative overflow-hidden rounded-2xl border border-white/20 bg-slate-900/70 flex items-center justify-center"
                                    whileHover={{ y: -4, scale: 1.02 }}
                                    transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                                >
                                    <img
                                        src={tvsLogo}
                                        alt="TVS Eurorip brand"
                                        className="h-20 w-full object-cover drop-shadow-[0_10px_30px_rgba(15,23,42,0.9)]"
                                    />
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
                    className="max-w-md w-full mx-auto space-y-8 relative"
                >
                    <div className="text-left">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 font-outfit">
                                Sign in to your account
                            </h2>
                            <p className="mt-2 text-sm text-slate-600 font-inter">
                                Use your official TVS credentials to access the Asset Management System.
                            </p>
                        </motion.div>
                    </div>

                    <div className="mt-6 space-y-6">
                        <div className="glass-card p-8 rounded-3xl border border-slate-200 shadow-2xl shadow-slate-200/70 overflow-hidden relative group bg-white backdrop-blur-xl">
                            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-tvs-blue via-sky-400 to-tvs-red bg-[length:200%_auto] animate-[gradient_3s_linear_infinite]" />

                            <form className="space-y-6" onSubmit={handleSubmit}>
                                <AnimatePresence mode="wait">
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0, y: -10 }}
                                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                                            exit={{ opacity: 0, height: 0, y: -10 }}
                                            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 text-sm"
                                        >
                                            <AlertCircle size={18} className="shrink-0" />
                                            <span className="font-medium">{error}</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="space-y-1">
                                    <label
                                        htmlFor="email"
                                        className="text-xs font-semibold text-slate-700 uppercase tracking-wider ml-1"
                                    >
                                        Email address
                                    </label>
                                    <div className="relative group/input">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within/input:text-tvs-blue transition-colors">
                                            <Mail size={18} />
                                        </div>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            required
                                            className="block w-full pl-12 pr-4 py-3.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-tvs-blue/60 focus:border-tvs-blue transition-all outline-none text-slate-900 placeholder:text-slate-400 font-inter"
                                            placeholder="admin@tvs.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label
                                        htmlFor="password"
                                        className="text-xs font-semibold text-slate-700 uppercase tracking-wider ml-1"
                                    >
                                        Password
                                    </label>
                                    <div className="relative group/input">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within/input:text-tvs-blue transition-colors">
                                            <Lock size={18} />
                                        </div>
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            autoComplete="current-password"
                                            required
                                            className="block w-full pl-12 pr-12 py-3.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-tvs-blue/60 focus:border-tvs-blue transition-all outline-none text-slate-900 placeholder:text-slate-400 font-inter"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all outline-none"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-xs text-slate-500">
                                    <span>admin@tvs.com / admin123</span>
                                    <span className="opacity-70">For internal use only</span>
                                </div>

                                <div className="pt-1.5">
                                    <motion.button
                                        whileHover={{ scale: isLoading ? 1 : 1.02 }}
                                        whileTap={{ scale: isLoading ? 1 : 0.98 }}
                                        type="submit"
                                        disabled={isLoading}
                                        className={`w-full relative overflow-hidden flex justify-center py-3.5 px-4 rounded-xl shadow-lg shadow-tvs-blue/40 text-sm font-semibold text-white bg-gradient-to-r from-tvs-blue via-sky-500 to-tvs-red focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tvs-blue transition-all active:shadow-inner ${
                                            isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-[0_15px_45px_rgba(37,99,235,0.55)]'
                                        }`}
                                    >
                                        <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        {isLoading ? (
                                            <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                <span>Sign In </span>
                                            </span>
                                        )}
                                    </motion.button>
                                </div>
                            </form>
                        </div>

                        <div className="w-full">
                            <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-slate-500">
                                Heavy Duty Trolley
                            </p>
                            <p className="mt-1 text-[11px] text-slate-500">
                                Quick view of key trolley variants used across TVS plants.
                            </p>
                            <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                                <motion.div
                                    whileHover={{ scale: 1.03, y: -2 }}
                                    transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                                    className="min-w-[120px] max-w-[140px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-50"
                                >
                                    <img
                                        src={trolley1}
                                        alt="Heavy duty trolley 1"
                                        className="h-24 w-full object-cover"
                                    />
                                </motion.div>
                                <motion.div
                                    whileHover={{ scale: 1.03, y: -2 }}
                                    transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                                    className="min-w-[120px] max-w-[140px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-50"
                                >
                                    <img
                                        src={trolley2}
                                        alt="Heavy duty trolley 2"
                                        className="h-24 w-full object-cover"
                                    />
                                </motion.div>
                                <motion.div
                                    whileHover={{ scale: 1.03, y: -2 }}
                                    transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                                    className="min-w-[120px] max-w-[140px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-50"
                                >
                                    <img
                                        src={trolley3}
                                        alt="Heavy duty trolley 3"
                                        className="h-24 w-full object-cover"
                                    />
                                </motion.div>
                            </div>
                        </div>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="mt-6 text-center text-xs text-slate-500 font-inter"
                        >
                            &copy; {new Date().getFullYear()} TVS Group. All rights reserved.
                        </motion.p>
                    </div>
                </motion.div>
            </div>

            <div className="fixed bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-600/60 to-transparent" />

            <style
                dangerouslySetInnerHTML={{
                    __html: `
                @keyframes gradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
            `
                }}
            />
        </div>
    );
};

export default Login;
