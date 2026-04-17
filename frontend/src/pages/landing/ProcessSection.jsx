import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  FileText, MapPin, FolderOpen, Search, ArrowRight,
} from 'lucide-react';

/* ── Step data matching the "Automated Data Flow" design ── */
const STEPS = [
  {
    num: '01',
    icon: FileText,
    title: 'Asset Registration',
    desc: 'Assign a unique auto-generated Asset ID (AID) and link directly to Vendor Master profiles.',
    color: '#1B3A7A',
    lineColor: '#EF4444',
  },
  {
    num: '02',
    icon: MapPin,
    title: 'Location Allocation',
    desc: 'Automatically fetch associated Plant Locations and assign assets to verified user branches.',
    color: '#1B3A7A',
    lineColor: '#1B3A7A',
  },
  {
    num: '03',
    icon: FolderOpen,
    title: 'Document Vault',
    desc: 'Securely upload sign-off validation and mechanical drawings directly into the cloud bucket.',
    color: '#1B3A7A',
    lineColor: '#EF4444',
  },
  {
    num: '04',
    icon: Search,
    title: 'Tracking & Audit',
    desc: 'Monitor asset health through real-time grids, full search, pagination, and multi-field filters.',
    color: '#1B3A7A',
    lineColor: '#1B3A7A',
  },
];

const StepCard = ({ step, index, total }) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.15 });
  const Icon = step.icon;
  const isLast = index === total - 1;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
      style={{ flex: '1 1 0', minWidth: 0, position: 'relative' }}
    >
      {/* Connector line between steps */}
      {!isLast && (
        <div style={{
          position: 'absolute',
          top: 28, left: '60%', right: '-40%', zIndex: 0,
          height: 2, background: step.lineColor,
          opacity: 0.7,
        }} />
      )}

      {/* Icon circle */}
      <div style={{
        width: 56, height: 56, borderRadius: 14,
        background: '#F8FAFD', border: '1.5px solid #E2E8F0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20, position: 'relative', zIndex: 1,
        boxShadow: '0 2px 12px rgba(13,27,62,0.06)',
      }}>
        <Icon size={22} color="#1B3A7A" />
      </div>

      {/* Step label */}
      <div style={{
        fontSize: 10, fontWeight: 800, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#94A3B8', marginBottom: 6,
      }}>
        STEP {step.num}
      </div>

      {/* Title */}
      <h3 style={{
        margin: 0, marginBottom: 8,
        fontSize: 15, fontWeight: 800, color: '#0D1B3E',
        fontFamily: "'Outfit', sans-serif", lineHeight: 1.3,
      }}>
        {step.title}
      </h3>

      {/* Description */}
      <p style={{
        margin: 0, fontSize: 13.5, color: '#64748B', lineHeight: 1.7,
      }}>
        {step.desc}
      </p>
    </motion.div>
  );
};

export default function ProcessSection() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section id="process" style={{
      background: '#ffffff',
      padding: '90px 24px',
      borderTop: '1px solid #E8ECF4',
    }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>

        {/* Header */}
        <div ref={ref} style={{ textAlign: 'center', marginBottom: 64 }}>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
          >
            <span style={{
              fontSize: 11, fontWeight: 800, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: '#4F46E5',
              display: 'block', marginBottom: 14,
            }}>
              SYSTEM BLUEPRINT
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            style={{
              margin: 0, marginBottom: 16,
              fontSize: 'clamp(26px, 3.5vw, 40px)',
              fontWeight: 900, color: '#0D1B3E',
              fontFamily: "'Outfit', sans-serif",
              letterSpacing: '-0.02em',
            }}
          >
            Automated Data Flow
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.2 }}
            style={{
              color: '#64748B', fontSize: 16, lineHeight: 1.7,
              maxWidth: 560, margin: '0 auto',
            }}
          >
            A meticulously designed workflow that guarantees physical equipment{' '}
            <span style={{ color: '#4F46E5', fontWeight: 500 }}>seamlessly synchronizes</span>{' '}
            with{' '}
            <span style={{ color: '#0D9488', fontWeight: 500 }}>digital governance</span>.
          </motion.p>
        </div>

        {/* Steps row */}
        <div style={{
          display: 'flex', gap: 32, alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}>
          {STEPS.map((step, i) => (
            <StepCard key={step.num} step={step} index={i} total={STEPS.length} />
          ))}
        </div>
      </div>
    </section>
  );
}
