import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Play } from 'lucide-react';
import heroVideo from '../../assets/WhatsApp Video 2026-04-17 at 12.08.03 PM.mp4';
import fallbackImg from '../../assets/mfg_dashboard.png';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';







export default function DashboardPreview() {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef(null);
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.15 });
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.play().catch(() => {});
      setPlaying(true);
    }
  };

  return (
    <section id="demo" style={{
      background: '#0D1B3E',
      padding: '90px 24px',
    }}>
      <div ref={ref} style={{ maxWidth: 1000, margin: '0 auto' }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          style={{ textAlign: 'center', marginBottom: 48 }}
        >
          <h2 style={{
            margin: 0, marginBottom: 14,
            fontSize: 'clamp(24px, 3.5vw, 38px)',
            fontWeight: 900, color: '#ffffff',
            fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em',
          }}>
            See the Platform in Action
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.55)', fontSize: 16,
            lineHeight: 1.7, maxWidth: 520, margin: '0 auto',
          }}>
            Watch exactly how easy it is to onboard new mechanical assets, map them
            to your Vendor Master, and trigger backend synchronization.
          </p>
        </motion.div>

        {/* Video player */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.15 }}
          style={{
            position: 'relative', borderRadius: 16, overflow: 'hidden',
            boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.08)',
            aspectRatio: '16/9',
            cursor: playing ? 'default' : 'pointer',
          }}
          onClick={!playing ? handlePlay : undefined}
        >
          {/* Video element */}
          <video
            ref={videoRef}
            src={heroVideo}
            poster={fallbackImg}
            loop
            playsInline
            preload="metadata"
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover', display: 'block',
            }}
          />

          {/* Overlay (hidden when playing) */}
          {!playing && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(13,27,62,0.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column',
            }}>
              {/* Fake top bar */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                height: 40, background: 'rgba(13,27,62,0.7)',
                display: 'flex', alignItems: 'center',
                padding: '0 16px', gap: 8,
                borderBottom: '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['#FF5F56', '#FFBD2E', '#27C93F'].map(c => (
                    <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                  ))}
                </div>
                <span style={{
                  fontSize: 11.5, color: 'rgba(255,255,255,0.5)',
                  fontFamily: 'monospace', marginLeft: 8,
                }}>
                  recording_session_01.mp4
                </span>
                <span style={{
                  marginLeft: 'auto', fontSize: 10, fontWeight: 700,
                  color: '#FF5F56', background: 'rgba(239,68,68,0.15)',
                  padding: '2px 9px', borderRadius: 99, letterSpacing: '0.06em',
                }}>
                  ● DEMO VIDEO
                </span>
              </div>

              {/* Play button */}
              <motion.div
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  width: 68, height: 68, borderRadius: '50%',
                  background: '#ffffff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
                  cursor: 'pointer',
                }}
              >
                <Play size={28} fill="#0D1B3E" color="#0D1B3E" />
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
