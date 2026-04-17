import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Eye, EyeOff, Lock, Mail, AlertCircle, ArrowRight,
    CheckCircle2, Factory, Shield,
    ChevronLeft, ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

/* ── Generic manufacturing images ── */
import imgCnc        from '../assets/mfg_cnc.png';
import imgControlRoom from '../assets/mfg_control_room.png';
import imgWarehouse   from '../assets/mfg_warehouse.png';
import imgQuality     from '../assets/mfg_quality.png';
import imgDashboard   from '../assets/mfg_dashboard.png';
import imgProduction  from '../assets/mfg_production.png';

/* ──────────────────────────────────────────────
   Slide data  —  generic manufacturing content
 ────────────────────────────────────────────── */
const SLIDES = [
    {
        src: imgCnc,
        tag: 'Precision Machining',
        title: 'CNC Machining Excellence',
        desc: 'State-of-the-art CNC machining centers delivering micron-level precision for every part produced on the floor.',
        accent: '#00C9A7',
    },
    {
        src: imgControlRoom,
        tag: 'Smart Operations',
        title: 'Intelligent Factory Control',
        desc: 'Centralised real-time visibility across every production line, machine and shift — all in one unified command center.',
        accent: '#60A5FA',
    },
    {
        src: imgWarehouse,
        tag: 'Logistics',
        title: 'Inbound Logistics Optimized',
        desc: 'Automated guided vehicles and smart warehousing ensure zero downtime and perfect inventory accuracy.',
        accent: '#FBBF24',
    },
    {
        src: imgQuality,
        tag: 'Quality Assurance',
        title: 'Zero-Defect Quality Control',
        desc: 'Advanced metrology and CMM inspection workflows eliminate defects before they reach the customer.',
        accent: '#F472B6',
    },
    {
        src: imgDashboard,
        tag: 'Analytics',
        title: 'Live Production Intelligence',
        desc: 'Real-time dashboards, OEE tracking and predictive analytics guide every decision on the shop floor.',
        accent: '#A78BFA',
    },
    {
        src: imgProduction,
        tag: 'Assembly',
        title: 'World-Class Assembly Lines',
        desc: 'High-throughput assembly lines combining human expertise and automation for consistent product excellence.',
        accent: '#FB923C',
    },
];



/* ══════════════════════════════════════════════
   LOGIN PAGE
 ══════════════════════════════════════════════ */
const Login = () => {
    /* Form state */
    const [email,        setEmail]        = useState('');
    const [password,     setPassword]     = useState('');
    const [showPwd,      setShowPwd]      = useState(false);
    const [rememberMe,   setRememberMe]   = useState(false);
    const [error,        setError]        = useState('');
    const [isLoading,    setIsLoading]    = useState(false);

    /* Slider state */
    const [current,   setCurrent]   = useState(0);
    const [direction, setDirection] = useState(1);
    const [paused,    setPaused]    = useState(false);
    const timerRef = useRef(null);

    const { login } = useAuth();
    const navigate  = useNavigate();
    const location  = useLocation();
    const from      = location.state?.from?.pathname || '/';

    /* ── Auto-advance ── */
    const resetTimer = () => {
        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setDirection(1);
            setCurrent(c => (c + 1) % SLIDES.length);
        }, 5200);
    };

    useEffect(() => {
        if (!paused) resetTimer();
        else clearInterval(timerRef.current);
        return () => clearInterval(timerRef.current);
    }, [paused]);   // eslint-disable-line

    const goTo = (idx) => {
        setDirection(idx > current ? 1 : -1);
        setCurrent(idx);
        resetTimer();
    };
    const prev = () => { setDirection(-1); setCurrent(c => (c - 1 + SLIDES.length) % SLIDES.length); resetTimer(); };
    const next = () => { setDirection(1);  setCurrent(c => (c + 1) % SLIDES.length); resetTimer(); };

    /* ── Submit ── */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        const result = await login(email, password);
        if (result.success) navigate(from, { replace: true });
        else setError(result.message || 'Invalid credentials. Please try again.');
        setIsLoading(false);
    };

    const slide = SLIDES[current];

    /* ── Animation variants ── */
    const imgV = {
        enter:  d => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
        center: { x: 0, opacity: 1, transition: { duration: 0.7, ease: [0.32, 0.72, 0, 1] } },
        exit:   d => ({ x: d > 0 ? '-40%' : '40%', opacity: 0, transition: { duration: 0.55, ease: [0.32, 0.72, 0, 1] } }),
    };
    const capV = {
        enter:  { y: 28, opacity: 0 },
        center: { y: 0, opacity: 1, transition: { duration: 0.55, delay: 0.18, ease: 'easeOut' } },
        exit:   { y: -16, opacity: 0, transition: { duration: 0.3 } },
    };

    return (
        <>
            {/* Google Font + spinner keyframe */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@400;600;700;800;900&display=swap');
                @keyframes login-spin { to { transform: rotate(360deg); } }
            `}</style>

            <div style={{ display:'flex', height:'100vh', overflow:'hidden', fontFamily:"'Inter', system-ui, sans-serif", background:'#F8FAFC' }}>

                {/* ════════════════════════════════════
                    LEFT  –  Image Slideshow Panel
                 ════════════════════════════════════ */}
                <div
                    className="hidden lg:block"
                    style={{ position:'relative', flex:'1 1 0%', overflow:'hidden' }}
                    onMouseEnter={() => setPaused(true)}
                    onMouseLeave={() => setPaused(false)}
                >
                    {/* ── Slide images ── */}
                    <div style={{ position:'absolute', inset:0, overflow:'hidden' }}>
                        <AnimatePresence initial={false} custom={direction}>
                            <motion.div
                                key={`slide-${current}`}
                                custom={direction}
                                variants={imgV}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                style={{ position:'absolute', inset:0, overflow:'hidden' }}
                            >
                                {/* Ken-Burns zoom */}
                                <motion.img
                                    src={slide.src}
                                    alt={slide.title}
                                    animate={{ scale: [1, 1.07] }}
                                    transition={{ duration: 5.5, ease: 'linear' }}
                                    style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center', display:'block' }}
                                />
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* ── Overlays ── */}
                    <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(4,9,22,0.78) 0%, transparent 30%, rgba(4,9,22,0.88) 70%, rgba(2,6,16,0.97) 100%)', pointerEvents:'none', zIndex:2 }} />
                    <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, transparent 70%, rgba(4,9,22,0.35) 100%)', pointerEvents:'none', zIndex:2 }} />

                    {/* ── Brand bar (top) ── */}
                    <div style={{ position:'absolute', top:0, left:0, right:0, zIndex:10, display:'flex', alignItems:'center', gap:14, padding:'26px 30px' }}>
                        <div style={{ width:46, height:46, borderRadius:13, background:'rgba(0,201,167,0.12)', border:'1px solid rgba(0,201,167,0.24)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            <Factory size={22} color="#00C9A7" />
                        </div>
                        <div>
                            <div style={{ fontSize:12, fontWeight:800, letterSpacing:'0.16em', textTransform:'uppercase', color:'#00C9A7', lineHeight:1.2 }}>MfG FACTORY</div>
                            <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:1 }}>Manufacturing Intelligence Portal</div>
                        </div>
                        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:5, padding:'5px 13px', borderRadius:99, background:'rgba(0,201,167,0.1)', border:'1px solid rgba(0,201,167,0.22)', color:'#00C9A7', fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' }}>
                            <Shield size={10} color="#00C9A7" />
                            <span>Secure Portal</span>
                        </div>
                    </div>

                    {/* ── Thumbnail strip (right edge) ── */}
                    <div style={{ position:'absolute', right:18, top:'50%', transform:'translateY(-50%)', zIndex:10, display:'flex', flexDirection:'column', gap:7 }}>
                        {SLIDES.map((s, i) => (
                            <motion.button
                                key={i}
                                onClick={() => goTo(i)}
                                whileHover={{ scale: 1.08 }}
                                transition={{ type:'spring', stiffness:340, damping:24 }}
                                style={{
                                    width:54, height:38, borderRadius:8, overflow:'hidden',
                                    cursor:'pointer', padding:0, background:'none', border:'none',
                                    outline: i === current ? `2.5px solid ${slide.accent}` : '2px solid rgba(255,255,255,0.15)',
                                    outlineOffset: 2,
                                    opacity: i === current ? 1 : 0.55,
                                    transition:'opacity 0.3s, outline 0.3s',
                                }}
                                aria-label={s.tag}
                            >
                                <img src={s.src} alt={s.tag} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                            </motion.button>
                        ))}
                    </div>

                    {/* ── Caption (bottom) ── */}
                    <div style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:10, padding:'0 30px 26px 30px' }}>
                        <AnimatePresence mode="wait">
                            <motion.div key={`cap-${current}`} variants={capV} initial="enter" animate="center" exit="exit">
                                <div style={{
                                    display:'inline-flex', alignItems:'center',
                                    fontSize:9.5, fontWeight:800, letterSpacing:'0.13em', textTransform:'uppercase',
                                    padding:'3px 11px', borderRadius:99, marginBottom:10,
                                    color: slide.accent,
                                    background: slide.accent + '1A',
                                    border: `1px solid ${slide.accent}44`,
                                }}>
                                    {slide.tag}
                                </div>
                                <h2 style={{ margin:0, color:'#ffffff', fontSize:26, fontWeight:900, lineHeight:1.22, letterSpacing:'-0.025em', marginBottom:8, textShadow:'0 2px 16px rgba(0,0,0,0.5)' }}>
                                    {slide.title}
                                </h2>
                                <p style={{ margin:0, color:'rgba(255,255,255,0.58)', fontSize:13, lineHeight:1.65, maxWidth:480, marginBottom:20 }}>
                                    {slide.desc}
                                </p>
                            </motion.div>
                        </AnimatePresence>

                        {/* Progress bar */}
                        {!paused && (
                            <div style={{ height:3, borderRadius:99, background:'rgba(255,255,255,0.1)', overflow:'hidden', marginBottom:14 }}>
                                <motion.div
                                    key={`prog-${current}`}
                                    style={{ height:'100%', borderRadius:99, background: slide.accent }}
                                    initial={{ width:'0%' }}
                                    animate={{ width:'100%' }}
                                    transition={{ duration:5.2, ease:'linear' }}
                                />
                            </div>
                        )}

                        {/* Dots + Arrows */}
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                            <div style={{ display:'flex', gap:5, alignItems:'center' }}>
                                {SLIDES.map((_, i) => (
                                    <button key={i} onClick={() => goTo(i)} style={{ background:'none', border:'none', padding:2, cursor:'pointer' }} aria-label={`Slide ${i+1}`}>
                                        <motion.div animate={{ width: i === current ? 26 : 7, background: i === current ? slide.accent : 'rgba(255,255,255,0.28)' }} transition={{ duration:0.35 }} style={{ height:7, borderRadius:99 }} />
                                    </button>
                                ))}
                            </div>
                            <div style={{ display:'flex', gap:7 }}>
                                {[{ fn: prev, icon: <ChevronLeft size={17} color="#fff" /> }, { fn: next, icon: <ChevronRight size={17} color="#fff" /> }].map(({ fn, icon }, i) => (
                                    <button key={i} onClick={fn} style={{ width:34, height:34, borderRadius:10, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.18)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', backdropFilter:'blur(8px)', transition:'background 0.2s' }} aria-label={i === 0 ? 'Previous' : 'Next'}>
                                        {icon}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ════════════════════════════════════
                    RIGHT  –  Login Form
                 ════════════════════════════════════ */}
                <motion.div
                    initial={{ opacity:0, x:40 }}
                    animate={{ opacity:1, x:0 }}
                    transition={{ duration:0.72, ease:[0.32,0.72,0,1], delay:0.08 }}
                    style={{ position:'relative', width:'100%', maxWidth:490, flexShrink:0, background:'#ffffff', borderLeft:'1px solid #E8EDF5', display:'flex', flexDirection:'column', overflowY:'auto' }}
                >
                    {/* Top tri-color accent */}
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:3.5, background:'linear-gradient(90deg, #253C80 0%, #00C9A7 50%, #FFB800 100%)', zIndex:10 }} />

                    {/* Ambient blobs */}
                    <div style={{ position:'absolute', top:'4%', right:'-10%', width:260, height:260, background:'radial-gradient(circle, rgba(0,201,167,0.07) 0%, transparent 70%)', borderRadius:'50%', pointerEvents:'none' }} />
                    <div style={{ position:'absolute', bottom:'12%', left:'-6%', width:200, height:200, background:'radial-gradient(circle, rgba(37,60,128,0.07) 0%, transparent 70%)', borderRadius:'50%', pointerEvents:'none' }} />

                    {/* Form content */}
                    <div style={{ position:'relative', zIndex:2, padding:'36px 44px', flex:1, display:'flex', flexDirection:'column', justifyContent:'center', boxSizing:'border-box' }}>

                        {/* ── Brand ── */}
                        <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
                            <div style={{ width:48, height:48, borderRadius:14, background:'rgba(37,60,128,0.08)', border:'1.5px solid rgba(37,60,128,0.14)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                <Factory size={22} color="#253C80" />
                            </div>
                            <div>
                                <div style={{ fontSize:15, fontWeight:900, letterSpacing:'0.16em', textTransform:'uppercase', color:'#1A2F70', lineHeight:1.2, fontFamily:"'Outfit', sans-serif" }}>MfG FACTORY</div>
                                <div style={{ fontSize:11.5, color:'#A0ABBF', marginTop:4, fontWeight:500, letterSpacing:'0.02em' }}>Manufacturing Intelligence Portal</div>
                            </div>
                        </motion.div>

                        {/* ── Divider ── */}
                        <div style={{ height:1, background:'linear-gradient(90deg, #E0E7EF 0%, transparent 90%)', marginBottom:22 }} />

                        {/* ── Heading ── */}
                        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.32 }} style={{ marginBottom:26 }}>
                            <h1 style={{ margin:0, marginBottom:12, fontSize:44, fontWeight:900, letterSpacing:'-0.04em', color:'#0D1B3E', lineHeight:1.1, fontFamily:"'Outfit', 'Inter', sans-serif" }}>
                                Welcome{' '}
                                <span style={{ color:'#253C80' }}>back</span>{' '}
                                <span style={{ display:'inline-block' }}>👋</span>
                            </h1>
                            <p style={{ margin:0, fontSize:14.5, color:'#7B8AAB', lineHeight:1.7, fontWeight:400, fontFamily:"'Inter', sans-serif" }}>
                                Sign in with your official credentials to access the portal.
                            </p>
                        </motion.div>



                        {/* ── Form card ── */}
                        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.40 }} style={{ background:'#F8FAFC', border:'1.5px solid #E8EDF5', borderRadius:20, padding:'26px 24px', boxShadow:'0 4px 24px rgba(13,27,62,0.07)', marginBottom:22 }}>
                            <form onSubmit={handleSubmit}>

                                {/* Error */}
                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity:0, height:0, marginBottom:0 }}
                                            animate={{ opacity:1, height:'auto', marginBottom:18 }}
                                            exit={{ opacity:0, height:0, marginBottom:0 }}
                                            style={{ display:'flex', alignItems:'center', gap:9, padding:'10px 14px', borderRadius:12, background:'#FEF2F2', border:'1px solid #FECACA', color:'#DC2626', fontSize:13, fontWeight:500, overflow:'hidden' }}
                                        >
                                            <AlertCircle size={14} style={{ flexShrink:0 }} />
                                            <span>{error}</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Email field */}
                                <div style={{ marginBottom:16 }}>
                                    <label htmlFor="login-email" style={{ display:'block', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.09em', color:'#3D4B6B', marginBottom:8 }}>
                                        Email Address
                                    </label>
                                    <div style={{ position:'relative' }}>
                                        <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#B0BBC9', display:'flex', alignItems:'center', pointerEvents:'none' }}>
                                            <Mail size={15} />
                                        </span>
                                        <input
                                            id="login-email" name="email" type="email" autoComplete="email" required
                                            value={email} onChange={e => setEmail(e.target.value)}
                                            placeholder="admin@company.com"
                                            style={{ width:'100%', paddingLeft:42, paddingRight:14, paddingTop:13, paddingBottom:13, borderRadius:12, border:'1.5px solid #E2E8F0', background:'#ffffff', color:'#0D1B3E', fontSize:14, fontWeight:500, outline:'none', transition:'border-color 0.2s, box-shadow 0.2s', boxSizing:'border-box', fontFamily:'inherit' }}
                                            onFocus={e => { e.target.style.borderColor='#00C9A7'; e.target.style.boxShadow='0 0 0 3px rgba(0,201,167,0.13)'; }}
                                            onBlur={e  => { e.target.style.borderColor='#E2E8F0'; e.target.style.boxShadow='none'; }}
                                        />
                                    </div>
                                </div>

                                {/* Password field */}
                                <div style={{ marginBottom:14 }}>
                                    <label htmlFor="login-password" style={{ display:'block', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.09em', color:'#3D4B6B', marginBottom:8 }}>
                                        Password
                                    </label>
                                    <div style={{ position:'relative' }}>
                                        <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#B0BBC9', display:'flex', alignItems:'center', pointerEvents:'none' }}>
                                            <Lock size={15} />
                                        </span>
                                        <input
                                            id="login-password" name="password" type={showPwd ? 'text' : 'password'} autoComplete="current-password" required
                                            value={password} onChange={e => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            style={{ width:'100%', paddingLeft:42, paddingRight:44, paddingTop:12, paddingBottom:12, borderRadius:12, border:'1.5px solid #E2E8F0', background:'#ffffff', color:'#0D1B3E', fontSize:14, fontWeight:500, outline:'none', transition:'border-color 0.2s, box-shadow 0.2s', boxSizing:'border-box', fontFamily:'inherit' }}
                                            onFocus={e => { e.target.style.borderColor='#00C9A7'; e.target.style.boxShadow='0 0 0 3px rgba(0,201,167,0.13)'; }}
                                            onBlur={e  => { e.target.style.borderColor='#E2E8F0'; e.target.style.boxShadow='none'; }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPwd(v => !v)}
                                            style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#B0BBC9', display:'flex', alignItems:'center', padding:4 }}
                                            aria-label={showPwd ? 'Hide password' : 'Show password'}
                                        >
                                            {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Remember + Forgot */}
                                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
                                    <label style={{ display:'flex', alignItems:'center', gap:7, cursor:'pointer' }}>
                                        <input
                                            type="checkbox" id="remember-me"
                                            checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                                            style={{ width:14, height:14, accentColor:'#253C80', cursor:'pointer' }}
                                        />
                                        <span style={{ fontSize:13, color:'#5A6A85', fontWeight:500 }}>Remember me</span>
                                    </label>
                                    <button type="button" style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color:'#253C80', fontWeight:600, padding:0 }}>
                                        Forgot password?
                                    </button>
                                </div>

                                {/* Submit button */}
                                <motion.button
                                    id="login-submit"
                                    type="submit"
                                    disabled={isLoading}
                                    whileHover={isLoading ? {} : { scale:1.025, boxShadow:'0 12px 36px rgba(37,60,128,0.48)' }}
                                    whileTap={isLoading  ? {} : { scale:0.975 }}
                                    style={{
                                        width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                                        padding:'14px 24px', borderRadius:14, border:'none',
                                        background:'linear-gradient(135deg, #253C80 0%, #1E3A7E 50%, #0F2855 100%)',
                                        color:'#ffffff', fontSize:14.5, fontWeight:800, letterSpacing:'0.02em',
                                        boxShadow:'0 8px 28px rgba(37,60,128,0.38)',
                                        cursor: isLoading ? 'not-allowed' : 'pointer',
                                        opacity: isLoading ? 0.8 : 1,
                                        fontFamily:'inherit', transition:'box-shadow 0.2s',
                                        marginBottom:14,
                                    }}
                                >
                                    {isLoading
                                        ? <div style={{ width:20, height:20, border:'2.5px solid rgba(255,255,255,0.25)', borderTopColor:'#ffffff', borderRadius:'50%', animation:'login-spin 0.75s linear infinite' }} />
                                        : <><span>Sign In to Portal</span><ArrowRight size={17} /></>
                                    }
                                </motion.button>

                                {/* Demo hint */}
                                <p style={{ margin:0, fontSize:11.5, color:'#A0ABBF', lineHeight:1.5, textAlign:'center' }}>
                                    Demo: <span style={{ color:'#00C9A7', fontWeight:700 }}>admin@company.com</span>&nbsp;/&nbsp;<span style={{ color:'#00C9A7', fontWeight:700 }}>admin123</span>
                                </p>
                            </form>
                        </motion.div>

                        {/* ── Trust badges ── */}
                        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.58 }} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:20, marginBottom:14 }}>
                            {[
                                { Icon: Shield,       text: 'SSL Encrypted' },
                                { Icon: CheckCircle2, text: 'ISO Compliant' },
                                { Icon: Lock,         text: 'MFA Ready' },
                            ].map(({ Icon, text }, i) => (
                                <div key={i} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11.5, color:'#8A99B8', fontWeight:500 }}>
                                    <Icon size={13} color="#00C9A7" />
                                    <span>{text}</span>
                                </div>
                            ))}
                        </motion.div>

                        {/* ── Footer ── */}
                        <p style={{ textAlign:'center', fontSize:10.5, color:'#C0CBDB', margin:0, lineHeight:1.6 }}>
                            © {new Date().getFullYear()} Manufacturing Intelligence Portal · Internal Use Only
                        </p>
                    </div>
                </motion.div>
            </div>
        </>
    );
};

export default Login;
