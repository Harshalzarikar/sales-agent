import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import styles from './DashboardPage.module.css';

const CATEGORY_COLORS = {
  Lead: '#22d3a5',
  Complaint: '#f59e0b',
  Spam: '#f87171',
};

const PLAN_LIMITS = { free: 50, pro: 1000, enterprise: Infinity };

// Mock volume data — replace with real API call
const generateVolumeData = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map(day => ({
    day,
    leads: Math.floor(Math.random() * 30) + 5,
    complaints: Math.floor(Math.random() * 10),
    spam: Math.floor(Math.random() * 8),
  }));
};

function StatCard({ label, value, sub, color, icon }) {
  return (
    <motion.div
      className={styles.statCard}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
    >
      <div className={styles.statIcon} style={{ background: `${color}15`, color }}>
        {icon}
      </div>
      <div>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statLabel}>{label}</div>
        {sub && <div className={styles.statSub}>{sub}</div>}
      </div>
    </motion.div>
  );
}

function NavItem({ icon, label, to, active }) {
  return (
    <Link to={to} className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}>
      <span className={styles.navIcon}>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [volumeData] = useState(generateVolumeData());
  const [plan] = useState('free'); // Will come from DB in full implementation

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/history?limit=50');
      setHistory(res.data || []);
    } catch {
      // Backend may not have user-filtered history yet — use empty state
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    toast.success('Signed out successfully.');
  };

  // Derived stats
  const total = history.length;
  const leads = history.filter(r => r.category === 'Lead').length;
  const complaints = history.filter(r => r.category === 'Complaint').length;
  const spam = history.filter(r => r.category === 'Spam').length;
  const avgMs = total > 0
    ? Math.round(history.reduce((s, r) => s + (r.time_ms || 0), 0) / total)
    : 0;

  const usagePercent = Math.min((total / PLAN_LIMITS[plan]) * 100, 100);

  const pieData = [
    { name: 'Leads', value: leads || 1, color: CATEGORY_COLORS.Lead },
    { name: 'Complaints', value: complaints || 0, color: CATEGORY_COLORS.Complaint },
    { name: 'Spam', value: spam || 0, color: CATEGORY_COLORS.Spam },
  ].filter(d => d.value > 0);

  return (
    <div className={styles.layout}>
      {/* ── SIDEBAR ── */}
      <aside className={styles.sidebar}>
        <Link to="/" className={styles.sidebarLogo}>
          <span>🦫</span>
          <span className={styles.sidebarLogoText}>Beaver Agent</span>
        </Link>

        <nav className={styles.nav}>
          <NavItem icon="📊" label="Dashboard" to="/dashboard" active />
          <NavItem icon="📨" label="Email Processor" to="/app" />
          <NavItem icon="⚙️" label="Settings" to="/settings" />
        </nav>

        {/* Usage card */}
        <div className={styles.usageCard}>
          <div className={styles.usageHeader}>
            <span className={styles.usagePlan}>{plan.toUpperCase()}</span>
            <Link to="/settings" className={styles.upgradeLink}>Upgrade →</Link>
          </div>
          <div className={styles.usageBar}>
            <div
              className={styles.usageFill}
              style={{ width: `${usagePercent}%`, background: usagePercent > 80 ? '#f59e0b' : 'var(--accent)' }}
            />
          </div>
          <div className={styles.usageNumbers}>
            {total} / {PLAN_LIMITS[plan] === Infinity ? '∞' : PLAN_LIMITS[plan]} emails
          </div>
        </div>

        {/* User */}
        <div className={styles.userSection}>
          <div className={styles.userAvatar}>
            {user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{user?.user_metadata?.full_name || 'User'}</div>
            <div className={styles.userEmail}>{user?.email}</div>
          </div>
          <button className={styles.signOutBtn} onClick={handleSignOut} title="Sign out">↩</button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className={styles.main}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>Dashboard</h1>
            <p className={styles.pageSub}>Your email pipeline at a glance</p>
          </div>
          <Link to="/app" className={styles.processBtn}>
            + Process Email
          </Link>
        </div>

        {/* Stats row */}
        <div className={styles.statsGrid}>
          <StatCard icon="📨" label="Total Processed" value={total} color="var(--accent)" />
          <StatCard icon="🎯" label="Leads" value={leads} sub="sales opportunities" color="var(--lead)" />
          <StatCard icon="⚠️" label="Complaints" value={complaints} sub="needing attention" color="var(--complaint)" />
          <StatCard icon="⚡" label="Avg Speed" value={avgMs > 0 ? `${avgMs}ms` : '—'} sub="pipeline latency" color="#a78bfa" />
        </div>

        {/* Charts row */}
        <div className={styles.chartsGrid}>
          {/* Volume chart */}
          <div className={styles.chartCard}>
            <div className={styles.chartTitle}>Email Volume — This Week</div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={volumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gLead" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3a5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22d3a5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                />
                <Area type="monotone" dataKey="leads" stroke="#22d3a5" fill="url(#gLead)" strokeWidth={2} name="Leads" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Category breakdown */}
          <div className={styles.chartCard}>
            <div className={styles.chartTitle}>Category Breakdown</div>
            {total > 0 ? (
              <div className={styles.pieWrap}>
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className={styles.pieLegend}>
                  {pieData.map(d => (
                    <div key={d.name} className={styles.legendItem}>
                      <div className={styles.legendDot} style={{ background: d.color }} />
                      <span className={styles.legendName}>{d.name}</span>
                      <span className={styles.legendVal}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.chartEmpty}>Process emails to see breakdown</div>
            )}
          </div>
        </div>

        {/* History table */}
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <div className={styles.chartTitle}>Recent Emails</div>
            <Link to="/app" className={styles.viewAllLink}>+ New</Link>
          </div>

          {loading ? (
            <div className={styles.tableEmpty}><span className={styles.spinner} /></div>
          ) : history.length === 0 ? (
            <div className={styles.tableEmpty}>
              <div className={styles.emptyIcon}>📭</div>
              <div className={styles.emptyText}>No emails processed yet</div>
              <Link to="/app" className={styles.emptyLink}>Process your first email →</Link>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Company</th>
                  <th>Draft Preview</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map((r, i) => (
                  <tr key={i} className={styles.tableRow}>
                    <td>
                      <span
                        className={styles.badge}
                        style={{
                          color: CATEGORY_COLORS[r.category] || 'var(--text-secondary)',
                          background: `${CATEGORY_COLORS[r.category] || '#666'}15`,
                        }}
                      >
                        {r.category}
                      </span>
                    </td>
                    <td className={styles.tableCompany}>{r.company || '—'}</td>
                    <td className={styles.tableDraft}>
                      {r.draft?.slice(0, 80)}…
                    </td>
                    <td className={styles.tableDate}>
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
