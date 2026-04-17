import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { PlusSquare, MapPin, BarChart2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const STEPS = [
  {
    num: '01',
    icon: PlusSquare,
    color: '#1B3A7A',
    bg: '#EEF2FF',
    title: 'Add & Organise Assets',
    desc: 'Register physical assets with a unique auto-generated ID. Attach vendor details, department info, and plant location in one guided form. Documents are securely vaulted at creation.',
    points: ['Auto-increment AID', 'Vendor & dept binding', 'Sign-off PDF upload'],
  },
  {
    num: '02',
    icon: MapPin,
    color: '#0D9488',
    bg: '#F0FDFA',
    title: 'Monitor Usage & Lifecycle',
    desc: 'Track every asset across its full lifecycle — from allocation and sign-off to implementation and closure. Real-time grids keep your entire plant network in sync.',
    points: ['Live status pipeline', 'Multi-plant tracking', 'Employee allocation'],
  },
  {
    num: '03',
    icon: BarChart2,
    color: '#7C3AED',
    bg: '#FAF5FF',
    title: 'Generate Insights & Reports',
    desc: 'Analyse trends, vendor performance, and location-wise asset health through dynamic dashboards. Export executive PPT reports for weekly business reviews in one click.',
    points: ['KPI dashboards', 'Vendor QCD analysis', 'One-click PPT export'],
  },
];

export default function HowItWorks() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <section id="how-it-works" style={{
      background: '#0D1B3E',
      padding: '90px 24px',
    }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>

        {/* Header */}
        <div ref={ref} style={{ textAlign: 'center', marginBottom: 64 }}>
          <motion.span
            initial={{ opacity: 0, y: 10 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            style={{
              display: 'block', marginBottom: 14,
              fontSize: 11, fontWeight: 800, color: '#818CF8',
              letterSpacing: '0.12em', textTransform: 'uppercase',
            }}
          >
            How It Works
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 18 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.1 }}
            style={{
              margin: 0, marginBottom: 16,
              fontSize: 'clamp(26px,3.5vw,40px)', fontWeight: 900,
              color: '#ffffff', fontFamily: "'Outfit',sans-serif", letterSpacing: '-0.02em',
            }}
          >
            Up and running in three steps
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.2 }}
            style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, lineHeight: 1.7, maxWidth: 480, margin: '0 auto' }}
          >
            From first asset to full plant visibility — the platform is designed to deliver
            value from day one.
          </motion.p>
        </div>

        {/* Step cards */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20,
        }} className="hiw-grid">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 28 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.12 }}
                whileHover={{ y: -4 }}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 18, padding: '28px 24px',
                  transition: 'transform 0.2s',
                  position: 'relative', overflow: 'hidden',
                }}
              >
                {/* Step number watermark */}
                <div style={{
                  position: 'absolute', top: -10, right: 14,
                  fontSize: 80, fontWeight: 900, color: 'rgba(255,255,255,0.03)',
                  fontFamily: "'Outfit',sans-serif", lineHeight: 1, userSelect: 'none',
                }}>
                  {step.num}
                </div>

                <div style={{
                  width: 48, height: 48, borderRadius: 13,
                  background: step.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 20,
                }}>
                  <Icon size={22} color={step.color} />
                </div>

                <div style={{
                  fontSize: 10.5, fontWeight: 800, color: step.color,
                  letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8,
                }}>
                  Step {step.num}
                </div>

                <h3 style={{
                  margin: 0, marginBottom: 12, fontSize: 18, fontWeight: 800,
                  color: '#ffffff', fontFamily: "'Outfit',sans-serif", lineHeight: 1.3,
                }}>
                  {step.title}
                </h3>

                <p style={{
                  margin: 0, marginBottom: 20,
                  fontSize: 13.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75,
                }}>
                  {step.desc}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {step.points.map((pt, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: step.color, flexShrink: 0,
                      }} />
                      <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>
                        {pt}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.5 }}
          style={{ textAlign: 'center', marginTop: 48 }}
        >
          <motion.button
            id="hiw-cta"
            whileHover={{ scale: 1.04, boxShadow: '0 10px 32px rgba(255,255,255,0.12)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(isAuthenticated ? '/' : '/login')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '13px 32px', borderRadius: 10, border: 'none',
              background: '#ffffff', color: '#0D1B3E',
              fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 20px rgba(255,255,255,0.1)',
            }}
          >
            {isAuthenticated ? 'Open Dashboard' : 'Get Started Now'}
            <ArrowRight size={17} />
          </motion.button>
        </motion.div>
      </div>

      <style>{`
        @media(max-width:768px){ .hiw-grid{ grid-template-columns:1fr !important; } }
        @media(max-width:1024px) and (min-width:769px){ .hiw-grid{ grid-template-columns:1fr 1fr !important; } }
      `}</style>
    </section>
  );
}
