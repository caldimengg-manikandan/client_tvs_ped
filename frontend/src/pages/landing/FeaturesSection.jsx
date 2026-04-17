import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { CheckCircle, Server, GitBranch, FileCheck, Lock } from 'lucide-react';

const ARCH_ITEMS = [
  {
    id: 'asset-reg',
    icon: Server,
    title: 'Asset Registration Node',
    desc: 'Robust entity creation binding metadata directly to verified entities. Intelligent Auto-Increment IDs eliminate naming collisions across multiple plants.',
    points: ['Auto-Gen AID', 'Vendor Scoring Synergy', 'Mandatory Field Guardrails'],
    color: '#1B3A7A',
  },
  {
    id: 'alloc-trace',
    icon: GitBranch,
    title: 'Allocation & Tracing',
    desc: 'Deploy physical assets utilizing the Employee Master synchronization. Dynamic grid mapping maintains constant state awareness of unit locations.',
    points: ['Token-based Dept Sync', 'Live AG Grid Rendering', 'Mutable Location States'],
    color: '#4F46E5',
  },
  {
    id: 'doc-handling',
    icon: FileCheck,
    title: 'Document Handling',
    desc: 'Industrial-grade blob storage for validation documents. Supports technical filetypes with stringent Multer buffer checks (10MB limits, whitelist processing).',
    points: ['Sign-off PDFs', 'CAD Drawing Archival', 'Destructive Sync Safety'],
    color: '#0D9488',
  },
  {
    id: 'rbac',
    icon: Lock,
    title: 'Role-Based Access Control',
    desc: 'Security-first architecture wrapped in strict JWT middlewares. Action endpoints exclusively trigger via validated assetSummary permissions.',
    points: ['Granular Edit/Delete', 'Protected API Routes', 'Token Lifecycle Mgmt'],
    color: '#7C3AED',
  },
];

const ArchCard = ({ item, index }) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.12 });
  const Icon = item.icon;

  return (
    <motion.div
      ref={ref}
      id={`arch-${item.id}`}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: (index % 2) * 0.12, ease: 'easeOut' }}
      style={{
        padding: '28px 28px 24px',
        borderBottom: '1px solid #E8ECF4',
        borderRight: index % 2 === 0 ? '1px solid #E8ECF4' : 'none',
      }}
    >
      {/* Icon */}
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: `${item.color}10`, border: `1px solid ${item.color}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 18,
      }}>
        <Icon size={20} color={item.color} />
      </div>

      {/* Title */}
      <h3 style={{
        margin: 0, marginBottom: 10,
        fontSize: 16, fontWeight: 800, color: '#0D1B3E',
        fontFamily: "'Outfit', sans-serif", lineHeight: 1.3,
      }}>
        {item.title}
      </h3>

      {/* Description */}
      <p style={{
        margin: 0, marginBottom: 20,
        fontSize: 13.5, color: '#64748B', lineHeight: 1.7,
      }}>
        {item.desc}
      </p>

      {/* Checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {item.points.map((pt, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle size={14} color="#38A169" />
            <span style={{
              fontSize: 13, color: '#2D7D9A',
              fontWeight: 500, textDecoration: 'underline',
              textDecorationColor: 'rgba(45,125,154,0.3)',
              textUnderlineOffset: 3,
            }}>
              {pt}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default function FeaturesSection() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section id="architecture" style={{
      background: '#F8FAFD',
      padding: '90px 24px',
    }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>

        {/* Header */}
        <div ref={ref} style={{ marginBottom: 52 }}>
          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            style={{
              margin: 0, marginBottom: 12,
              fontSize: 'clamp(24px, 3.5vw, 38px)',
              fontWeight: 900, color: '#0D1B3E',
              fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em',
            }}
          >
            Core System Architecture
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            style={{ color: '#64748B', fontSize: 16, lineHeight: 1.7, maxWidth: 560 }}
          >
            Built on a resilient <span style={{ color: '#4F46E5', fontWeight: 500 }}>Node.js backplane</span> with{' '}
            <span style={{ color: '#4F46E5', fontWeight: 500 }}>dynamic React rendering</span>.{' '}
            <br />
            Engineered specifically for{' '}
            <span style={{ color: '#0D9488', fontWeight: 500 }}>complex manufacturing environments</span>.
          </motion.p>
        </div>

        {/* 2×2 grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          border: '1px solid #E8ECF4',
          borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 2px 16px rgba(13,27,62,0.05)',
          background: '#ffffff',
        }}
        className="arch-grid"
        >
          {ARCH_ITEMS.map((item, i) => (
            <ArchCard key={item.id} item={item} index={i} />
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 700px) {
          .arch-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
