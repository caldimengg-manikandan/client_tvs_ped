import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Quote, ChevronLeft, ChevronRight, Star } from 'lucide-react';

/* ─── Data ─── */
const FEATURED = {
  text: 'The MH Request workflow has reduced our processing time from 2 weeks to under 4 days. Automated approvals and real-time tracking have completely transformed how our operations team collaborates — this is the single best investment we made this year.',
  name: 'Ravi Shankar',
  title: 'Plant Manager — Hosur',
  dept: 'Manufacturing Operations',
  initials: 'RS',
  color: '#1B3A7A',
  metric: '70% faster approvals',
};

const STACK = [
  { name: 'Priya Nair',         title: 'Head of Procurement',    dept: 'Supply Chain',           initials: 'PN', color: '#4F46E5', metric: '18% cost reduction',   rating: 5,
    text: 'Vendor scoring and loading analysis are game-changers. Data-driven insights let us negotiate better contracts instantly.' },
  { name: 'Karthik Subramaniam',title: 'Engineering Manager',     dept: 'Product Engineering',    initials: 'KS', color: '#0D9488', metric: '100% audit trail',     rating: 5,
    text: 'Design release sign-offs are now digitized and fully auditable. Zero email chains.' },
  { name: 'Anitha Krishnan',    title: 'HR Business Partner',     dept: 'Human Resources',        initials: 'AK', color: '#7C3AED', metric: '4 plants unified',     rating: 5,
    text: 'A single source of truth across all plants. Role-based access solved everything.' },
  { name: 'Senthil Kumar',      title: 'Asset Coordinator',       dept: 'Facilities & Assets',    initials: 'SK', color: '#D97706', metric: '342 assets tracked',   rating: 5,
    text: 'From spreadsheet chaos to live lifecycle tracking — a complete upgrade.' },
  { name: 'Deepak Menon',       title: 'Chief Financial Officer', dept: 'Finance & Strategy',     initials: 'DM', color: '#059669', metric: '3 hrs saved/week',    rating: 5,
    text: 'The PPT export alone saves 3 hours every week. Leadership reviews now run from data.' },
];

const METRICS = [
  { value: '70%',    label: 'Faster Approvals',   color: '#1B3A7A' },
  { value: '18%',    label: 'Cost Reduction',      color: '#4F46E5' },
  { value: '342+',   label: 'Assets Tracked',      color: '#0D9488' },
  { value: '4',      label: 'Plants Unified',       color: '#7C3AED' },
];

const LOCATIONS = ['Hosur Plant', 'Chennai HQ', 'Mysuru Plant', 'Pune Facility'];

/* ─── Sub-components ─── */
const Stars = ({ n = 5, color }) => (
  <div style={{ display: 'flex', gap: 3 }}>
    {Array.from({ length: n }).map((_, i) => (
      <Star key={i} size={13} color={color} fill={color} />
    ))}
  </div>
);

const Avatar = ({ initials, color, size = 44 }) => (
  <div style={{
    width: size, height: size, borderRadius: Math.round(size * 0.28),
    background: `${color}14`, border: `1.5px solid ${color}28`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size * 0.3, fontWeight: 900, color, flexShrink: 0,
  }}>
    {initials}
  </div>
);

/* Compact side card */
const CompactCard = ({ t, active, onClick }) => (
  <motion.div
    whileHover={{ x: 4 }}
    onClick={onClick}
    style={{
      padding: '14px 16px', borderRadius: 12,
      border: `1.5px solid ${active ? t.color + '50' : '#E8ECF4'}`,
      background: active ? `${t.color}06` : '#ffffff',
      cursor: 'pointer',
      transition: 'border-color 0.2s, background 0.2s',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <Avatar initials={t.initials} color={t.color} size={36} />
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0D1B3E', lineHeight: 1.2 }}>{t.name}</div>
          <div style={{ fontSize: 10.5, color: '#94A3B8' }}>{t.dept}</div>
        </div>
      </div>
      <span style={{
        fontSize: 10, fontWeight: 800, color: t.color,
        background: `${t.color}10`, border: `1px solid ${t.color}20`,
        padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap',
      }}>
        {t.metric}
      </span>
    </div>
    {active && (
      <p style={{ margin: 0, fontSize: 12, color: '#64748B', lineHeight: 1.6, paddingLeft: 45 }}>
        "{t.text}"
      </p>
    )}
  </motion.div>
);

/* ─── Main section ─── */
export default function TestimonialsSection() {
  const [active, setActive] = useState(0);
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section id="testimonials" style={{
      background: '#ffffff',
      padding: '90px 24px',
      borderTop: '1px solid #E8ECF4',
    }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>

        {/* Header */}
        <div ref={ref} style={{ textAlign: 'center', marginBottom: 56 }}>
          <motion.span
            initial={{ opacity: 0, y: 10 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            style={{
              display: 'block', marginBottom: 14,
              fontSize: 11, fontWeight: 800, color: '#1B3A7A',
              letterSpacing: '0.12em', textTransform: 'uppercase',
            }}
          >
            Team Insights
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 18 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.1 }}
            style={{
              margin: 0, marginBottom: 12,
              fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 900, color: '#0D1B3E',
              fontFamily: "'Outfit',sans-serif", letterSpacing: '-0.02em',
            }}
          >
            Trusted by teams across every plant
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.18 }}
            style={{ color: '#64748B', fontSize: 15, lineHeight: 1.7, maxWidth: 460, margin: '0 auto' }}
          >
            From shop floor to C-suite — real feedback from the people using this
            platform every day.
          </motion.p>
        </div>

        {/* ── Metric strip ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2 }}
          style={{
            display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
            border: '1px solid #E8ECF4', borderRadius: 14,
            overflow: 'hidden', marginBottom: 40,
          }}
          className="metric-strip"
        >
          {METRICS.map((m, i) => (
            <div
              key={i}
              style={{
                padding: '22px 20px', textAlign: 'center',
                borderRight: i < METRICS.length - 1 ? '1px solid #E8ECF4' : 'none',
                background: '#FAFBFF',
              }}
            >
              <div style={{
                fontSize: 30, fontWeight: 900, color: m.color,
                fontFamily: "'Outfit',sans-serif", letterSpacing: '-0.03em',
                marginBottom: 4,
              }}>
                {m.value}
              </div>
              <div style={{ fontSize: 11.5, color: '#94A3B8', fontWeight: 600, letterSpacing: '0.04em' }}>
                {m.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* ── Featured quote (left) + compact stack (right) ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 24, alignItems: 'start',
        }} className="test-grid">

          {/* Featured quote */}
          <motion.div
            initial={{ opacity: 0, y: 22 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.25 }}
            style={{
              background: '#0D1B3E',
              borderRadius: 18, padding: '36px 32px',
              position: 'relative', overflow: 'hidden',
            }}
          >
            {/* Quote icon bg */}
            <div style={{
              position: 'absolute', top: -16, right: -16,
              opacity: 0.06, pointerEvents: 'none',
            }}>
              <Quote size={120} color="#ffffff" />
            </div>

            <Stars n={5} color="#FBBF24" />

            <p style={{
              margin: '20px 0 28px', fontSize: 17, color: 'rgba(255,255,255,0.88)',
              lineHeight: 1.75, fontStyle: 'italic', position: 'relative', zIndex: 1,
            }}>
              "{FEATURED.text}"
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Avatar initials={FEATURED.initials} color="#FBBF24" size={48} />
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: '#ffffff' }}>{FEATURED.name}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{FEATURED.title}</div>
                <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{FEATURED.dept}</div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <span style={{
                  padding: '6px 14px', borderRadius: 8,
                  background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.2)',
                  fontSize: 12, fontWeight: 800, color: '#FBBF24',
                }}>
                  {FEATURED.metric}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Compact testimonial stack */}
          <motion.div
            initial={{ opacity: 0, y: 22 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            {STACK.map((t, i) => (
              <CompactCard
                key={t.name}
                t={t}
                active={active === i}
                onClick={() => setActive(active === i ? -1 : i)}
              />
            ))}
          </motion.div>
        </div>

        {/* Location strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.45 }}
          style={{ textAlign: 'center', marginTop: 44 }}
        >
          <div style={{
            fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: '#CBD5E0', marginBottom: 16,
          }}>
            Deployed Across All Manufacturing Facilities
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 10 }}>
            {LOCATIONS.map((loc, i) => (
              <span key={i} style={{
                padding: '7px 18px', borderRadius: 8,
                background: '#F8FAFD', border: '1px solid #E8ECF4',
                fontSize: 12.5, fontWeight: 600, color: '#4A5568',
                boxShadow: '0 1px 6px rgba(13,27,62,0.04)',
              }}>
                📍 {loc}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      <style>{`
        @media(max-width:900px){ .test-grid{ grid-template-columns:1fr !important; } }
        @media(max-width:600px){ .metric-strip{ grid-template-columns:1fr 1fr !important; } }
      `}</style>
    </section>
  );
}
