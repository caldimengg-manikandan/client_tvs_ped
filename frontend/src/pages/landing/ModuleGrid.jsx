import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FileText, TrendingUp, Users, Package,
  BarChart3, Settings, ArrowRight, Lock,
} from 'lucide-react';

const MODULES = [
  {
    id: 'mh-requests',
    icon: FileText,
    color: '#1B3A7A',
    bg: '#EEF2FF',
    label: 'MH Request Management',
    desc: 'Multi-stage approval workflows with priority tagging and part-level tracking.',
    href: '/mh-requests',
    permission: 'assetRequest',
  },
  {
    id: 'vendor-master',
    icon: TrendingUp,
    color: '#0D9488',
    bg: '#F0FDFA',
    label: 'Vendor Intelligence',
    desc: 'QCD scoring engine, loading analysis, and performance benchmarking.',
    href: '/vendor-master',
    permission: 'vendorMaster',
  },
  {
    id: 'employee-master',
    icon: Users,
    color: '#7C3AED',
    bg: '#FAF5FF',
    label: 'Employee Master',
    desc: 'Cross-plant employee registry with department and designation management.',
    href: '/employee-master',
    permission: 'employeeMaster',
  },
  {
    id: 'asset-summary',
    icon: Package,
    color: '#D97706',
    bg: '#FFFBEB',
    label: 'Asset Summary',
    desc: 'Browse and filter the full asset registry with status, location, and document links.',
    href: '/asset-summary',
    permission: 'assetSummary',
  },
  {
    id: 'dashboard',
    icon: BarChart3,
    color: '#E53E3E',
    bg: '#FFF5F5',
    label: 'Live Analytics Dashboard',
    desc: 'KPI cards, trend charts, and plant-wise breakdowns updated in real-time.',
    href: '/',
    permission: 'dashboard',
  },
  {
    id: 'settings',
    icon: Settings,
    color: '#4A5568',
    bg: '#F7FAFC',
    label: 'Settings & Reports',
    desc: 'Configure automated report delivery, manage report settings and schedules.',
    href: '/settings',
    permission: null,
  },
];

const ModuleCard = ({ mod, index, onNavigate }) => {
  const Icon = mod.icon;
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 22 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, delay: (index % 3) * 0.08 }}
      whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(13,27,62,0.10)' }}
      onClick={() => onNavigate(mod.href)}
      style={{
        background: '#ffffff', border: '1px solid #E8ECF4',
        borderRadius: 16, padding: '24px',
        cursor: 'pointer',
        boxShadow: '0 2px 10px rgba(13,27,62,0.04)',
        transition: 'box-shadow 0.2s, transform 0.2s',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Icon */}
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: mod.bg, border: `1px solid ${mod.color}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
      }}>
        <Icon size={20} color={mod.color} />
      </div>

      <div style={{ flex: 1 }}>
        <h3 style={{
          margin: 0, marginBottom: 8, fontSize: 15, fontWeight: 800,
          color: '#0D1B3E', fontFamily: "'Outfit',sans-serif", lineHeight: 1.3,
        }}>
          {mod.label}
        </h3>
        <p style={{ margin: 0, fontSize: 13, color: '#64748B', lineHeight: 1.65 }}>
          {mod.desc}
        </p>
      </div>

      {/* Open link */}
      <div style={{
        marginTop: 18, display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 12.5, fontWeight: 700, color: mod.color,
      }}>
        Open Module <ArrowRight size={13} />
      </div>
    </motion.div>
  );
};

export default function ModuleGrid() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const navigate = useNavigate();
  const { isAuthenticated, hasPermission } = useAuth();

  const handleNavigate = (href) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: href } } });
    } else {
      navigate(href);
    }
  };

  return (
    <section id="modules" style={{
      background: '#F8FAFD',
      padding: '90px 24px',
      borderTop: '1px solid #E8ECF4',
    }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>

        {/* Header */}
        <div ref={ref} style={{ textAlign: 'center', marginBottom: 52 }}>
          <motion.span
            initial={{ opacity: 0, y: 10 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            style={{
              display: 'block', marginBottom: 14,
              fontSize: 11, fontWeight: 800, color: '#1B3A7A',
              letterSpacing: '0.12em', textTransform: 'uppercase',
            }}
          >
            Platform Modules
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 18 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.1 }}
            style={{
              margin: 0, marginBottom: 14,
              fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 900, color: '#0D1B3E',
              fontFamily: "'Outfit',sans-serif", letterSpacing: '-0.02em',
            }}
          >
            Everything Your Factory{' '}
            <span style={{ color: '#1B3A7A' }}>Operations Needs</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.15 }}
            style={{ color: '#64748B', fontSize: 16, lineHeight: 1.7, maxWidth: 520, margin: '0 auto' }}
          >
            Six integrated modules designed to eliminate silos and surface real-time
            intelligence across your manufacturing value chain.
            {!isAuthenticated && (
              <span style={{ color: '#4F46E5', fontWeight: 500 }}> Sign in to access.</span>
            )}
          </motion.p>
        </div>

        {/* Module grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18,
        }} className="module-grid">
          {MODULES.map((mod, i) => (
            <ModuleCard key={mod.id} mod={mod} index={i} onNavigate={handleNavigate} />
          ))}
        </div>

        {/* Auth nudge */}
        {!isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.4 }}
            style={{
              marginTop: 32, textAlign: 'center',
              padding: '16px 24px', borderRadius: 12,
              background: '#EEF2FF', border: '1px solid #C7D2FE',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <Lock size={15} color="#4F46E5" />
            <span style={{ fontSize: 14, color: '#4338CA', fontWeight: 600 }}>
              Modules require authentication
            </span>
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/login')}
              style={{
                padding: '8px 20px', borderRadius: 8,
                background: '#1B3A7A', border: 'none',
                color: '#fff', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Sign In to Access
            </motion.button>
          </motion.div>
        )}
      </div>

      <style>{`
        @media(max-width:768px){ .module-grid{ grid-template-columns:1fr !important; } }
        @media(max-width:1024px) and (min-width:769px){ .module-grid{ grid-template-columns:1fr 1fr !important; } }
      `}</style>
    </section>
  );
}
