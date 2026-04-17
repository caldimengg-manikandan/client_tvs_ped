import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { ArrowRight, LayoutDashboard, Shield, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function CTASection() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <section id="cta" style={{
      background: '#ffffff',
      borderTop: '1px solid #E8ECF4',
      padding: '90px 24px',
    }}>
      <div ref={ref} style={{
        maxWidth: 760, margin: '0 auto', textAlign: 'center',
      }}>
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          style={{
            display: 'inline-block', marginBottom: 20,
            fontSize: 11, fontWeight: 800, color: '#4F46E5',
            letterSpacing: '0.12em', textTransform: 'uppercase',
          }}
        >
          Get Started Today
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1 }}
          style={{
            margin: 0, marginBottom: 18,
            fontSize: 'clamp(28px, 4vw, 48px)',
            fontWeight: 900, color: '#0D1B3E',
            fontFamily: "'Outfit', sans-serif",
            letterSpacing: '-0.02em', lineHeight: 1.15,
          }}
        >
          Start Driving{' '}
          <span style={{ color: '#1B3A7A' }}>Factory Intelligence</span>{' '}
          Today
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          style={{
            color: '#64748B', fontSize: 16,
            lineHeight: 1.75, maxWidth: 480, margin: '0 auto 40px',
          }}
        >
          Join teams already using the portal to streamline manufacturing workflows,
          reduce cycle times, and make data-driven decisions — from anywhere.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
          style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}
        >
          <motion.button
            id="cta-primary"
            whileHover={{ scale: 1.04, boxShadow: '0 10px 32px rgba(27,58,122,0.32)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(isAuthenticated ? '/' : '/login')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '14px 32px', borderRadius: 10, border: 'none',
              background: '#1B3A7A',
              color: '#fff', fontSize: 15, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 18px rgba(27,58,122,0.25)',
            }}
          >
            <LayoutDashboard size={18} />
            {isAuthenticated ? 'Open Dashboard' : 'Access the Portal'}
            <ArrowRight size={17} />
          </motion.button>

          <motion.button
            id="cta-secondary"
            whileHover={{ background: '#F0F4FF', borderColor: '#C7D2FE' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => document.getElementById('architecture')?.scrollIntoView({ behavior: 'smooth' })}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '14px 28px', borderRadius: 10,
              border: '1.5px solid #CBD5E0', background: '#ffffff',
              color: '#2D3748', fontSize: 15, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'background 0.18s, border-color 0.18s',
            }}
          >
            Explore Architecture
          </motion.button>
        </motion.div>

        {/* Trust row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.45 }}
          style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 24 }}
        >
          {[
            { icon: Shield, text: 'SSL Encrypted' },
            { icon: LayoutDashboard, text: 'Enterprise Platform' },
            { icon: Zap, text: 'Zero Downtime SLA' },
          ].map(({ icon: Icon, text }, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              fontSize: 13, color: '#94A3B8', fontWeight: 500,
            }}>
              <Icon size={14} color="#CBD5E0" />
              {text}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
