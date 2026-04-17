import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { ChevronDown } from 'lucide-react';

/* FAQ content — structured around real system capabilities */
const FAQ_ITEMS = [
  {
    id: 'q1',
    q: 'What is a Material Handling (MH) Request?',
    a: 'An MH Request is a formal workflow initiated when a plant needs to add, move, or modify a physical asset. It passes through multi-stage approval — from submission to vendor assignment, implementation sign-off, and final closure in the system.',
  },
  {
    id: 'q2',
    q: 'How does the Vendor Scoring system work?',
    a: 'Vendors are evaluated automatically on Quality, Cost, and Delivery (QCD) metrics derived from historical request data. The platform calculates a composite score per vendor and surfaces loading analysis so procurement teams can make data-driven decisions.',
  },
  {
    id: 'q3',
    q: 'Who can access the portal?',
    a: 'Access is role-based (RBAC). Admins have full access. Standard users have permission-gated access to specific modules (Dashboard, MH Requests, Asset Summary, etc.) as configured by an administrator.',
  },
  {
    id: 'q4',
    q: 'Is the dashboard data real-time?',
    a: 'Yes. All KPIs, request pipelines, and asset tracking data are fetched directly from the backend MongoDB database on every page load. There is no caching layer introducing stale data.',
  },
  {
    id: 'q5',
    q: 'What file types are supported for asset documents?',
    a: 'Sign-off documents accept PDF and Word formats (doc/docx). Engineering drawings accept PNG, JPG, JPEG, WEBP, PDF, and Word formats. All uploads are limited to 10MB per file.',
  },
  {
    id: 'q6',
    q: 'Can I export reports?',
    a: 'Yes. The dashboard includes a PPT export feature for executive reporting. The Report Settings module allows scheduling automated report delivery to configured email recipients.',
  },
];

const FAQItem = ({ item, isOpen, onToggle }) => (
  <div style={{
    borderBottom: '1px solid #E8ECF4',
    background: isOpen ? '#FAFBFF' : '#ffffff',
    transition: 'background 0.2s',
  }}>
    <button
      id={`faq-${item.id}`}
      onClick={onToggle}
      style={{
        width: '100%', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 16,
        padding: '20px 24px', background: 'none', border: 'none',
        cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
      }}
    >
      <span style={{ fontSize: 15, fontWeight: 600, color: '#0D1B3E', lineHeight: 1.4 }}>
        {item.q}
      </span>
      <motion.div
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ duration: 0.22 }}
        style={{ flexShrink: 0 }}
      >
        <ChevronDown size={18} color={isOpen ? '#1B3A7A' : '#94A3B8'} />
      </motion.div>
    </button>
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="content"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          style={{ overflow: 'hidden' }}
        >
          <div style={{ padding: '0 24px 20px', fontSize: 14, color: '#4A5568', lineHeight: 1.75 }}>
            {item.a}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export default function FAQSection() {
  const [openId, setOpenId] = useState('q1');
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section id="faq" style={{
      background: '#F8FAFD',
      padding: '90px 24px',
      borderTop: '1px solid #E8ECF4',
    }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        <div ref={ref} style={{ textAlign: 'center', marginBottom: 52 }}>
          <motion.span
            initial={{ opacity: 0, y: 10 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            style={{
              display: 'block', marginBottom: 14,
              fontSize: 11, fontWeight: 800, color: '#4F46E5',
              letterSpacing: '0.12em', textTransform: 'uppercase',
            }}
          >
            Common Questions
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 18 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.1 }}
            style={{
              margin: 0, marginBottom: 14,
              fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 900, color: '#0D1B3E',
              fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em',
            }}
          >
            Frequently Asked Questions
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.15 }}
            style={{ color: '#64748B', fontSize: 15, lineHeight: 1.7, maxWidth: 480, margin: '0 auto' }}
          >
            Everything you need to know about the platform. Can't find your answer?
            Reach out to your system administrator.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2 }}
          style={{
            background: '#ffffff', border: '1px solid #E8ECF4',
            borderRadius: 16, overflow: 'hidden',
            boxShadow: '0 2px 12px rgba(13,27,62,0.04)',
          }}
        >
          {FAQ_ITEMS.map(item => (
            <FAQItem
              key={item.id}
              item={item}
              isOpen={openId === item.id}
              onToggle={() => setOpenId(openId === item.id ? null : item.id)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
