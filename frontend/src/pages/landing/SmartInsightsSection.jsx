import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  Activity, CheckCircle2, Clock, AlertTriangle,
  FileText, Package, Users, TrendingUp, RefreshCw,
} from 'lucide-react';
import { fetchRecentActivity } from '../../services/landingService';

/* ── Map backend action types to UI ── */
const ACTION_MAP = {
  'Asset Request Created':   { icon: FileText,      color: '#4F46E5', bg: '#EEF2FF' },
  'Asset Request Updated':   { icon: RefreshCw,     color: '#0D9488', bg: '#F0FDFA' },
  'Asset Request Accepted':  { icon: CheckCircle2,  color: '#38A169', bg: '#F0FFF4' },
  'Asset Request Rejected':  { icon: AlertTriangle, color: '#E53E3E', bg: '#FFF5F5' },
  'Asset Implemented':       { icon: Package,       color: '#1B3A7A', bg: '#EEF2FF' },
  'New Employee Added':      { icon: Users,         color: '#7C3AED', bg: '#FAF5FF' },
  'Vendor Updated':          { icon: TrendingUp,    color: '#D97706', bg: '#FFFBEB' },
  default:                   { icon: Activity,      color: '#94A3B8', bg: '#F8FAFD' },
};

const getMapping = (action) => ACTION_MAP[action] || ACTION_MAP.default;

const timeAgo = (dateStr) => {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

/* ── Skeleton row ── */
const SkeletonRow = () => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '14px 20px', borderBottom: '1px solid #F0F4FF',
  }}>
    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F0F4FF', flexShrink: 0 }} />
    <div style={{ flex: 1 }}>
      <div style={{ height: 12, width: '55%', background: '#F0F4FF', borderRadius: 4, marginBottom: 6 }} />
      <div style={{ height: 10, width: '35%', background: '#F5F7FA', borderRadius: 4 }} />
    </div>
    <div style={{ height: 10, width: 48, background: '#F5F7FA', borderRadius: 4 }} />
  </div>
);

/* ── Single activity row ── */
const ActivityRow = ({ item, index }) => {
  const map = getMapping(item.action || item.type);
  const Icon = map.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 14,
        padding: '14px 20px',
        borderBottom: '1px solid #F0F4FF',
        transition: 'background 0.15s',
        cursor: 'default',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#FAFBFF')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: map.bg, border: `1px solid ${map.color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={16} color={map.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 700, color: '#0D1B3E',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {item.action || item.type || 'System event'}
        </div>
        <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 2 }}>
          {item.description || item.message || item.user?.name || 'User action'}
        </div>
      </div>
      <div style={{
        fontSize: 10.5, color: '#CBD5E0', fontWeight: 600,
        whiteSpace: 'nowrap', flexShrink: 0, marginTop: 2,
      }}>
        {timeAgo(item.createdAt || item.timestamp)}
      </div>
    </motion.div>
  );
};

/* ── Summary stat ── */
const QuickStat = ({ icon: Icon, value, label, color }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '16px 20px',
    borderRight: '1px solid #E8ECF4',
  }}>
    <div style={{
      width: 36, height: 36, borderRadius: 10,
      background: `${color}12`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginBottom: 8,
    }}>
      <Icon size={17} color={color} />
    </div>
    <div style={{
      fontSize: 22, fontWeight: 900, color: '#0D1B3E',
      fontFamily: "'Outfit', sans-serif", lineHeight: 1, marginBottom: 4,
    }}>
      {value ?? '—'}
    </div>
    <div style={{ fontSize: 10.5, color: '#94A3B8', fontWeight: 600, textAlign: 'center', letterSpacing: '0.04em' }}>
      {label}
    </div>
  </div>
);

export default function SmartInsightsSection({ liveStats }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(false);
  const [ref, inView]               = useInView({ triggerOnce: true, threshold: 0.1 });

  useEffect(() => {
    fetchRecentActivity().then(({ data, error: err }) => {
      setActivities(Array.isArray(data) ? data.slice(0, 8) : []);
      setError(err === 'fallback');
      setLoading(false);
    });
  }, []);

  const stats = [
    { icon: FileText,      value: liveStats?.totalRequests?.toLocaleString(), label: 'Total Requests',  color: '#4F46E5' },
    { icon: CheckCircle2,  value: liveStats?.accepted?.toLocaleString(),      label: 'Accepted',        color: '#38A169' },
    { icon: Package,       value: liveStats?.implemented?.toLocaleString(),   label: 'Implemented',     color: '#1B3A7A' },
    { icon: AlertTriangle, value: liveStats?.rejected?.toLocaleString(),      label: 'Rejected',        color: '#E53E3E' },
  ];

  return (
    <section id="insights" style={{
      background: '#ffffff',
      borderTop: '1px solid #E8ECF4',
      padding: '90px 24px',
    }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>

        {/* Header */}
        <div ref={ref} style={{ marginBottom: 48 }}>
          <motion.span
            initial={{ opacity: 0, y: 10 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            style={{
              display: 'block', marginBottom: 12,
              fontSize: 11, fontWeight: 800, color: '#4F46E5',
              letterSpacing: '0.12em', textTransform: 'uppercase',
            }}
          >
            Live System Intelligence
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 18 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.1 }}
            style={{
              margin: 0, marginBottom: 10,
              fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 900, color: '#0D1B3E',
              fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em',
            }}
          >
            Real‑Time Activity Feed
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.15 }}
            style={{ color: '#64748B', fontSize: 15, lineHeight: 1.7, maxWidth: 480 }}
          >
            This is a live window into the system — every event you see is streamed
            directly from your manufacturing operations backend.
          </motion.p>
        </div>

        {/* 2-col layout */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 360px',
          gap: 24, alignItems: 'start',
        }} className="insights-grid">

          {/* ── Activity feed ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2 }}
            style={{
              background: '#ffffff', border: '1px solid #E8ECF4',
              borderRadius: 16, overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(13,27,62,0.04)',
            }}
          >
            {/* Feed header */}
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid #E8ECF4',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#FAFBFF',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', background: '#38A169',
                  display: 'inline-block', animation: 'hero-pulse 2s ease infinite',
                }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0D1B3E' }}>
                  Recent System Events
                </span>
              </div>
              <span style={{
                fontSize: 10.5, color: error ? '#E53E3E' : '#38A169',
                background: error ? '#FFF5F5' : '#F0FFF4',
                border: `1px solid ${error ? '#FED7D7' : '#C6F6D5'}`,
                padding: '2px 10px', borderRadius: 99, fontWeight: 700,
              }}>
                {error ? 'Demo data' : 'Live'}
              </span>
            </div>

            {loading
              ? [0, 1, 2, 3, 4].map(i => <SkeletonRow key={i} />)
              : activities.length > 0
                ? activities.map((item, i) => <ActivityRow key={item._id || i} item={item} index={i} />)
                : (
                  <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                    <Activity size={32} color="#E2E8F0" style={{ marginBottom: 12 }} />
                    <div style={{ fontSize: 14, color: '#94A3B8', fontWeight: 500 }}>
                      No recent activity found.<br />Events will appear here as the system is used.
                    </div>
                  </div>
                )
            }
          </motion.div>

          {/* ── Stat sidebar ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.25 }}
              style={{
                background: '#ffffff', border: '1px solid #E8ECF4',
                borderRadius: 16, overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(13,27,62,0.04)',
              }}
            >
              <div style={{
                padding: '14px 18px', borderBottom: '1px solid #E8ECF4',
                fontSize: 12, fontWeight: 800, color: '#0D1B3E',
                letterSpacing: '0.06em', textTransform: 'uppercase',
                background: '#FAFBFF',
              }}>
                System Metrics
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                {stats.map((s, i) => <QuickStat key={i} {...s} />)}
              </div>
            </motion.div>

            {/* System health card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.32 }}
              style={{
                background: '#F0FFF4', border: '1px solid #C6F6D5',
                borderRadius: 16, padding: '20px 18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
                <CheckCircle2 size={16} color="#38A169" />
                <span style={{ fontSize: 13, fontWeight: 800, color: '#276749' }}>
                  All Systems Operational
                </span>
              </div>
              {[
                'Request Processing Engine',
                'Vendor Scoring Service',
                'Asset Sync Pipeline',
                'Authentication Layer',
              ].map((service, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: 12, color: '#276749', marginBottom: 6, fontWeight: 500,
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: '#38A169', flexShrink: 0,
                  }} />
                  {service}
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes hero-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(1.4); }
        }
        @media (max-width: 900px) {
          .insights-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
