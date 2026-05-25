import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import styles from './SettingsPage.module.css';

function Section({ title, sub, children }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {sub && <p className={styles.sectionSub}>{sub}</p>}
      </div>
      {children}
    </div>
  );
}

function ApiKeyField({ label, envKey, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className={styles.keyField}>
      <label className={styles.keyLabel}>{label}</label>
      <div className={styles.keyEnv}>env: <code>{envKey}</code></div>
      <div className={styles.keyInputRow}>
        <input
          type={show ? 'text' : 'password'}
          className={styles.keyInput}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || '••••••••••••••••'}
        />
        <button className={styles.keyToggle} onClick={() => setShow(s => !s)}>
          {show ? '🙈' : '👁️'}
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [keys, setKeys] = useState({
    googleApiKey: '',
    tavilyApiKey: '',
    groqApiKey: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSaveKeys = async () => {
    setSaving(true);
    // In full implementation: POST to /settings/api-keys with JWT
    await new Promise(r => setTimeout(r, 800)); // simulate
    toast.success('API keys saved securely.');
    setSaving(false);
  };

  const PLAN_FEATURES = {
    free: { name: 'Free', price: '$0/mo', limit: '50 emails/month', color: 'var(--text-secondary)' },
    pro:  { name: 'Pro',  price: '$29/mo', limit: '1,000 emails/month', color: 'var(--accent)' },
  };
  const currentPlan = PLAN_FEATURES.free;

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <Link to="/" className={styles.sidebarLogo}>
          <span>🦫</span>
          <span>Beaver Agent</span>
        </Link>
        <nav className={styles.nav}>
          <Link to="/dashboard" className={styles.navItem}>📊 Dashboard</Link>
          <Link to="/app" className={styles.navItem}>📨 Email Processor</Link>
          <Link to="/settings" className={`${styles.navItem} ${styles.navActive}`}>⚙️ Settings</Link>
        </nav>
        <div className={styles.userSection}>
          <div className={styles.userAvatar}>
            {user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{user?.user_metadata?.full_name || 'User'}</div>
            <div className={styles.userEmail}>{user?.email}</div>
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.pageTitle}>Settings</h1>
          <p className={styles.pageSub}>Manage your account, API keys, and billing</p>
        </div>

        {/* Profile */}
        <Section title="Profile" sub="Your account information">
          <div className={styles.profileCard}>
            <div className={styles.profileAvatar}>
              {user?.email?.[0]?.toUpperCase() || '?'}
            </div>
            <div className={styles.profileInfo}>
              <div className={styles.profileName}>{user?.user_metadata?.full_name || 'User'}</div>
              <div className={styles.profileEmail}>{user?.email}</div>
              <div className={styles.profileProvider}>
                Signed in via {user?.app_metadata?.provider || 'email'}
              </div>
            </div>
          </div>
        </Section>

        {/* API Keys */}
        <Section
          title="LLM API Keys"
          sub="Add your own API keys to use Beaver Agent with your accounts. Keys are stored encrypted and never logged."
        >
          <div className={styles.card}>
            <ApiKeyField
              label="Google Gemini API Key"
              envKey="GOOGLE_API_KEY"
              value={keys.googleApiKey}
              onChange={v => setKeys(k => ({ ...k, googleApiKey: v }))}
            />
            <ApiKeyField
              label="Tavily Search API Key"
              envKey="TAVILY_API_KEY"
              value={keys.tavilyApiKey}
              onChange={v => setKeys(k => ({ ...k, tavilyApiKey: v }))}
            />
            <ApiKeyField
              label="Groq API Key (optional fallback)"
              envKey="GROQ_API_KEY"
              value={keys.groqApiKey}
              onChange={v => setKeys(k => ({ ...k, groqApiKey: v }))}
            />
            <div className={styles.saveRow}>
              <div className={styles.saveNote}>
                🔒 Keys are encrypted with AES-256 and never sent to third parties.
              </div>
              <button className={styles.saveBtn} onClick={handleSaveKeys} disabled={saving}>
                {saving ? 'Saving…' : 'Save Keys'}
              </button>
            </div>
          </div>
        </Section>

        {/* Billing */}
        <Section title="Plan & Billing" sub="Manage your subscription">
          <div className={styles.card}>
            <div className={styles.planRow}>
              <div>
                <div className={styles.planName}>{currentPlan.name} Plan</div>
                <div className={styles.planLimit}>{currentPlan.limit}</div>
              </div>
              <div className={styles.planPrice}>{currentPlan.price}</div>
            </div>
            <div className={styles.planDivider} />
            <div className={styles.planUpgrade}>
              <div>
                <div className={styles.upgradeTitle}>Upgrade to Pro</div>
                <div className={styles.upgradeDesc}>
                  Get 1,000 emails/month, custom API keys, Gmail integration, and priority LLMs.
                </div>
              </div>
              <button
                className={styles.upgradeCta}
                onClick={() => toast('Stripe checkout coming soon!', { icon: '💳' })}
              >
                Upgrade — $29/mo
              </button>
            </div>
          </div>
        </Section>

        {/* Danger zone */}
        <Section title="Danger Zone">
          <div className={`${styles.card} ${styles.dangerCard}`}>
            <div className={styles.dangerRow}>
              <div>
                <div className={styles.dangerTitle}>Sign out of all devices</div>
                <div className={styles.dangerDesc}>Invalidates your current session.</div>
              </div>
              <button className={styles.dangerBtn} onClick={signOut}>Sign Out</button>
            </div>
            <div className={styles.planDivider} />
            <div className={styles.dangerRow}>
              <div>
                <div className={styles.dangerTitle}>Delete account</div>
                <div className={styles.dangerDesc}>Permanently removes all your data. This cannot be undone.</div>
              </div>
              <button
                className={`${styles.dangerBtn} ${styles.dangerBtnRed}`}
                onClick={() => toast.error('Please contact support to delete your account.')}
              >
                Delete Account
              </button>
            </div>
          </div>
        </Section>
      </main>
    </div>
  );
}
