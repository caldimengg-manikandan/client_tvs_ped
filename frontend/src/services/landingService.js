import api from '../api/axiosConfig';

/* ─────────────────────────────────────────────
   LANDING PAGE — API SERVICE LAYER
   All calls have try/catch so the page
   renders even if the backend is offline.
───────────────────────────────────────────── */

/**
 * PUBLIC stats — /api/public/stats
 * No auth token required. Returns aggregated
 * counts directly from DB models.
 */
export const fetchPublicStats = async () => {
  try {
    const res = await api.get('/public/stats');
    return { data: res.data, error: null };
  } catch {
    return { data: null, error: 'offline' };
  }
};

// ── Keep the old exports so other components aren't broken ──

/** Dashboard KPIs (protected — used when user is logged in) */
export const fetchLandingStats = async () => {
  try {
    const res = await api.get('/dashboard/stats');
    const d   = res.data;
    return {
      data: {
        totalRequests : d?.kpiCards?.totalRequests ?? null,
        accepted      : d?.kpiCards?.accepted      ?? null,
        implemented   : d?.kpiCards?.implemented   ?? null,
        rejected      : d?.kpiCards?.rejected      ?? null,
      },
      error: null,
    };
  } catch {
    return { data: null, error: 'fallback' };
  }
};

/** Recent activity feed (protected) */
export const fetchRecentActivity = async () => {
  try {
    const res   = await api.get('/dashboard/recent-activity');
    const items = Array.isArray(res.data) ? res.data : res.data?.data || [];
    return { data: items, error: null };
  } catch {
    return { data: [], error: 'fallback' };
  }
};

/** Vendor scoring aggregate (protected) */
export const fetchVendorStats = async () => {
  try {
    const res     = await api.get('/vendor-scoring');
    const vendors = Array.isArray(res.data?.data) ? res.data.data : [];
    return {
      data: {
        totalVendors: vendors.length || null,
        avgScore: vendors.length
          ? (vendors.reduce((s, v) => s + (v.qcdScore || 0), 0) / vendors.length).toFixed(1)
          : null,
        topTier: vendors.filter(v => v.qcdScore >= 90).length || null,
      },
      error: vendors.length ? null : 'fallback',
    };
  } catch {
    return { data: { totalVendors: null, avgScore: null, topTier: null }, error: 'fallback' };
  }
};

/** Employee count (protected) */
export const fetchEmployeeStats = async () => {
  try {
    const res   = await api.get('/employees');
    const list  = Array.isArray(res.data) ? res.data : res.data?.data || [];
    return { data: { totalEmployees: list.length || null }, error: list.length ? null : 'fallback' };
  } catch {
    return { data: { totalEmployees: null }, error: 'fallback' };
  }
};

/** Asset count (protected) */
export const fetchAssetStats = async () => {
  try {
    const res    = await api.get('/asset-management');
    const assets = Array.isArray(res.data) ? res.data : res.data?.data || [];
    return {
      data: { totalAssets: assets.length, inService: null, maintenance: null, recentAsset: null },
      error: null,
    };
  } catch {
    return { data: { totalAssets: null }, error: 'fallback' };
  }
};
