import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  ArrowRight, Database, CheckCircle, Play, X,
  Clock, CheckCircle2, FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import heroVideo from '../../assets/WhatsApp Video 2026-04-17 at 12.08.03 PM.mp4';

/* ── Status badge ── */
const STATUS_MAP = {
  Accepted:    { bg: '#F0FFF4', border: '#C6F6D5', color: '#276749' },
  Implemented: { bg: '#EBF8FF', border: '#BEE3F8', color: '#2B6CB0' },
  Rejected:    { bg: '#FFF5F5', border: '#FED7D7', color: '#9B2C2C' },
  Pending:     { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E' },
};
const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || STATUS_MAP.Pending;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, color: s.color,
      background: s.bg, border: `1px solid ${s.border}`,
      padding: '3px 10px', borderRadius: 99,
    }}>
      {status || 'Pending'}
    </span>
  );
};

/* ── Skeleton pulse block ── */
const Sk = ({ w = '100%', h = 14, r = 6 }) => (
  <div style={{
    width: w, height: h, borderRadius: r,
    background: '#EEF2FF',
    animation: 'sk-shine 1.4s ease infinite',
  }} />
);

/* ── Video modal ── */
const VideoModal = ({ onClose }) => (
  <div
    onClick={onClose}
    style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(13,27,62,0.88)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: 'relative', width: '100%', maxWidth: 960,
        borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 40px 100px rgba(0,0,0,0.5)',
      }}
    >
      <video
        src={heroVideo} controls autoPlay
        style={{ width: '100%', display: 'block', maxHeight: '80vh' }}
      />
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 12, right: 12,
          width: 34, height: 34, borderRadius: 8,
          background: 'rgba(0,0,0,0.65)', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#fff',
        }}
      >
        <X size={17} />
      </button>
    </div>
  </div>
);

/* ── Live request card (right side of hero) ── */
const LiveCard = ({ requests, loading }) => {
  const latest   = requests && requests.length > 0 ? requests[0] : null;
  const STEPS    = ['Submitted', 'Accepted', 'Implemented'];
  const doneAt   = latest?.status === 'Implemented' ? 3
                 : latest?.status === 'Accepted'    ? 2
                 : 1;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40, y: 20 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.7, delay: 0.4, ease: 'easeOut' }}
      style={{
        background: '#ffffff', border: '1px solid #E2E8F0',
        borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(13,27,62,0.14), 0 4px 16px rgba(13,27,62,0.06)',
        width: '100%', maxWidth: 440,
      }}
    >
      {/* Header */}
      <div style={{
        background: '#F8FAFD', borderBottom: '1px solid #E2E8F0',
        padding: '14px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          {loading
            ? (<><Sk w={140} h={13} r={4} /><div style={{ marginTop: 6 }}><Sk w={90} h={10} r={4} /></div></>)
            : (
              <>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1A202C' }}>
                  {latest ? (latest.requestId || 'Request #1') : 'No requests yet'}
                </div>
                <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 2 }}>
                  {latest?.createdAt
                    ? `Updated: ${new Date(latest.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`
                    : 'Awaiting data…'}
                </div>
              </>
            )
          }
        </div>
        {!loading && latest && <StatusBadge status={latest.status} />}
      </div>

      {/* Body */}
      <div style={{ padding: '18px 20px' }}>
        {/* Field grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px', marginBottom: 18 }}>
          {[
            { label: 'VENDOR NAME',    value: latest?.vendorName || latest?.vendor?.companyName || '—' },
            { label: 'DEPARTMENT',     value: latest?.department || latest?.deptt || '—' },
          ].map((f, idx) => (
            <div key={`field-${idx}`}>
              <div style={{
                fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: '#94A3B8', marginBottom: 4,
              }}>
                {f.label}
              </div>
              {loading
                ? <Sk w="80%" h={13} r={4} />
                : <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1A202C' }}>{f.value}</div>
              }
            </div>
          ))}
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{
              fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: '#94A3B8', marginBottom: 4,
            }}>
              PLANT LOCATION
            </div>
            {loading
              ? <Sk w="60%" h={13} r={4} />
              : <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1A202C' }}>
                  {latest?.plantLocation || latest?.location || '—'}
                </div>
            }
          </div>
        </div>

        {/* Pipeline steps */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {STEPS.map((label, idx) => {
            const done = idx < doneAt;
            return (
              <React.Fragment key={`step-${idx}`}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', borderRadius: 8,
                  background: done ? '#F0FFF4' : '#F8FAFD',
                  border: `1px solid ${done ? '#C6F6D5' : '#E2E8F0'}`,
                }}>
                  {done
                    ? <CheckCircle2 size={11} color="#38A169" />
                    : <Clock size={11} color="#CBD5E0" />
                  }
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: done ? '#276749' : '#94A3B8' }}>
                    {label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div style={{ width: 12, height: 1, background: '#E2E8F0' }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        borderTop: '1px solid #E2E8F0', padding: '10px 20px',
        display: 'flex', alignItems: 'center', gap: 6, background: '#FAFBFF',
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%', background: '#38A169',
          display: 'inline-block', animation: 'hero-pulse 2s ease infinite',
        }} />
        <span style={{ fontSize: 11.5, color: '#94A3B8', fontWeight: 500 }}>
          {loading
            ? 'Connecting to system…'
            : `Live data · ${requests.length} total request${requests.length !== 1 ? 's' : ''}`
          }
        </span>
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════ */
export default function HeroSection({ stats }) {
  const navigate  = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [showModal, setShowModal] = useState(false);

  // Read from Redux store — safe defaults if not hydrated yet
  const { items: requests = [], loading: reqLoading = false } =
    useSelector(s => s.assetRequests || {});

  const cardLoading = reqLoading && requests.length === 0;
  const totalReqs   = stats?.totalRequests ?? null;

  return (
    <>
      <section
        id="hero"
        style={{
          background: '#F8FAFD', paddingTop: 60,
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          overflow: 'hidden', position: 'relative',
        }}
      >
        {/* Subtle grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage:
            'linear-gradient(#E2E8F010 1px,transparent 1px),' +
            'linear-gradient(90deg,#E2E8F010 1px,transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        <div
          className="hero-grid"
          style={{
            maxWidth: 1180, margin: '0 auto',
            padding: '60px 24px 80px', width: '100%',
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: 60, alignItems: 'center', position: 'relative', zIndex: 1,
          }}
        >
          {/* ── LEFT ── */}
          <div>
            {/* Live badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }} style={{ marginBottom: 22 }}
            >
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '5px 14px', borderRadius: 99,
                background: '#EEF2FF', border: '1px solid #C7D2FE',
                fontSize: 10.5, fontWeight: 800, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: '#4F46E5',
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', background: '#4F46E5',
                  display: 'inline-block', animation: 'hero-pulse 2s ease infinite',
                }} />
                Manufacturing Update Module Live
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.1 }}
              style={{
                margin: 0, marginBottom: 20,
                fontSize: 'clamp(34px,4.5vw,58px)', fontWeight: 900,
                lineHeight: 1.1, letterSpacing: '-0.025em',
                fontFamily: "'Outfit',sans-serif", color: '#0D1B3E',
              }}
            >
              {isAuthenticated && user?.name
                ? (<>Welcome back,<br /><span style={{ color: '#1B3A7A' }}>{user.name.split(' ')[0]}.</span></>)
                : (<>Intelligent Factory <span style={{ color: '#1B3A7A' }}>Operations</span><br /><span style={{ color: '#1B3A7A' }}>Simplified</span></>)
              }
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.2 }}
              style={{
                margin: 0, marginBottom: 38, fontSize: 16,
                color: '#4A5568', lineHeight: 1.75, maxWidth: 460,
              }}
            >
              End-to-end lifecycle tracking. Sync MH requests with your Vendor Master,
              map exact plant locations, verify sign-offs, and maintain a pristine audit
              trail — securely and instantly.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 36 }}
            >
              <motion.button
                id="hero-primary-btn"
                whileHover={{ scale: 1.03, boxShadow: '0 8px 28px rgba(27,58,122,0.35)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(isAuthenticated ? '/' : '/login')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 9,
                  padding: '12px 28px', borderRadius: 10, border: 'none',
                  background: '#1B3A7A', color: '#fff', fontSize: 14.5,
                  fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 4px 18px rgba(27,58,122,0.28)',
                }}
              >
                {isAuthenticated ? 'Open Dashboard' : 'View Dashboard'}
                <ArrowRight size={17} />
              </motion.button>

              <motion.button
                id="hero-demo-btn"
                whileHover={{ background: '#EEF2FF', borderColor: '#C7D2FE' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowModal(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 9,
                  padding: '12px 24px', borderRadius: 10,
                  border: '1.5px solid #CBD5E0', background: '#ffffff',
                  color: '#2D3748', fontSize: 14.5, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'background 0.18s, border-color 0.18s',
                }}
              >
                <Play size={15} fill="#2D3748" color="#2D3748" /> System Demo
              </motion.button>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 600 }}>
                <Database size={15} color="#38A169" /><span style={{ color: '#38A169' }}>MongoDB Synced</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 600 }}>
                <CheckCircle size={15} color="#4F46E5" /><span style={{ color: '#4F46E5' }}>RBAC Enabled</span>
              </div>
              {totalReqs !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 600, color: '#1B3A7A' }}>
                  <FileText size={14} color="#1B3A7A" />
                  {totalReqs.toLocaleString()}+ requests processed
                </div>
              )}
            </motion.div>
          </div>

          {/* ── RIGHT: live card ── */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            {/* Glow bubble */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%,-50%)',
              width: 500, height: 500, borderRadius: '50%',
              background: 'radial-gradient(circle,#EEF2FF 0%,transparent 70%)',
              pointerEvents: 'none',
            }} />

            <LiveCard requests={requests} loading={cardLoading} />

            {/* Floating badge */}
            {totalReqs !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                style={{
                  position: 'absolute', bottom: -20, left: -20,
                  background: '#ffffff', border: '1px solid #E2E8F0',
                  borderRadius: 12, padding: '10px 14px',
                  boxShadow: '0 8px 24px rgba(13,27,62,0.10)',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: 8, background: '#EEF2FF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Database size={16} color="#4F46E5" />
                </div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1A202C', lineHeight: 1.2 }}>MH Requests</div>
                  <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 1 }}>{totalReqs.toLocaleString()}+ processed</div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <style>{`
          @keyframes hero-pulse {
            0%,100% { opacity:1; transform:scale(1); }
            50%      { opacity:0.4; transform:scale(1.4); }
          }
          @keyframes sk-shine {
            0%,100% { opacity:1; } 50% { opacity:0.5; }
          }
          .hero-grid { grid-template-columns:1fr 1fr; }
          @media(max-width:900px){ .hero-grid{ grid-template-columns:1fr !important; } }
        `}</style>
      </section>

      {showModal && <VideoModal onClose={() => setShowModal(false)} />}
    </>
  );
}
