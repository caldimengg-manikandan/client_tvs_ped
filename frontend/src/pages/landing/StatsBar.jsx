import React from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';

/* ── Individual stat cell ── */
const StatItem = ({ value, suffix = '', label, color, delay, isLoading }) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.4 });
  const numVal        = parseFloat(value) || 0;
  const hasData       = value !== null && value !== undefined;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      style={{
        flex: '1 1 160px', textAlign: 'center',
        padding: '32px 20px',
        borderRight: '1px solid #E8ECF4',
      }}
    >
      <div style={{
        fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 900, lineHeight: 1,
        fontFamily: "'Outfit', sans-serif", color,
        marginBottom: 8, letterSpacing: '-0.03em',
        minHeight: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isLoading ? (
          /* Skeleton pulse */
          <div style={{
            width: 80, height: 40, borderRadius: 8,
            background: '#EEF2FF',
            animation: 'sb-pulse 1.3s ease infinite',
          }} />
        ) : !hasData ? (
          <span style={{ color: '#CBD5E0', fontSize: 28 }}>—</span>
        ) : (
          inView
            ? <><CountUp end={numVal} duration={2.2} decimals={numVal % 1 !== 0 ? 1 : 0} separator="," />{suffix}</>
            : <span>0{suffix}</span>
        )}
      </div>

      <div style={{
        fontSize: 12, fontWeight: 600, letterSpacing: '0.06em',
        textTransform: 'uppercase', color: '#94A3B8', lineHeight: 1.4,
      }}>
        {label}
      </div>
    </motion.div>
  );
};

/* ── Section ── */
export default function StatsBar({ publicStats }) {
  const isLoading = publicStats === null;

  const stats = [
    {
      value:  isLoading ? null : publicStats?.totalRequests,
      suffix: '+',
      label:  'MH Requests Processed',
      color:  '#1B3A7A',
    },
    {
      value:  isLoading ? null : publicStats?.implemented,
      suffix: '+',
      label:  'Implementations Completed',
      color:  '#4F46E5',
    },
    {
      value:  isLoading ? null : publicStats?.totalVendors,
      suffix: '',
      label:  'Registered Vendors',
      color:  '#0D9488',
    },
    {
      value:  isLoading ? null : (publicStats?.avgScore != null ? parseFloat(publicStats.avgScore) : null),
      suffix: '%',
      label:  'Avg. Vendor QCD Score',
      color:  '#7C3AED',
    },
    {
      value:  isLoading ? null : publicStats?.totalEmployees,
      suffix: '+',
      label:  'Active Employees',
      color:  '#D97706',
    },
  ];

  return (
    <section id="stats-bar" style={{
      background:    '#ffffff',
      borderTop:     '1px solid #E8ECF4',
      borderBottom:  '1px solid #E8ECF4',
    }}>
      <div style={{
        maxWidth: 1180, margin: '0 auto',
        display: 'flex', flexWrap: 'wrap', alignItems: 'stretch',
      }}>
        {stats.map((s, i) => (
          <StatItem
            key={i}
            {...s}
            isLoading={isLoading}
            delay={i * 0.07}
          />
        ))}
      </div>

      <style>{`
        @keyframes sb-pulse {
          0%,100% { opacity: 1; } 50% { opacity: 0.45; }
        }
      `}</style>
    </section>
  );
}
