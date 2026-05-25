import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import EmailInput from '../components/EmailInput';
import ResultDisplay from '../components/ResultDisplay';
import styles from './AppPage.module.css';

export default function AppPage() {
  const { user } = useAuth();
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamState, setStreamState] = useState(null);

  const [threadId] = useState(() => {
    const saved = sessionStorage.getItem('beaver_thread_id');
    if (saved) return saved;
    const newId = crypto.randomUUID();
    sessionStorage.setItem('beaver_thread_id', newId);
    return newId;
  });

  const handleResult = (data) => {
    setResult(data);
    setHistory(prev => [...prev, data]);
    setStreamState(null); // Clear stream state when complete
  };

  const handleStreamEvent = (event) => {
    setStreamState(event);
  };

  return (
    <div className={styles.layout}>
      {/* Product top bar */}
      <header className={styles.topBar}>
        <Link to="/dashboard" className={styles.topBarLogo}>
          🦫 <span>Beaver Agent</span>
        </Link>
        <nav className={styles.topBarNav}>
          <Link to="/dashboard" className={styles.topBarLink}>Dashboard</Link>
          <Link to="/app" className={`${styles.topBarLink} ${styles.topBarLinkActive}`}>Email Processor</Link>
          <Link to="/settings" className={styles.topBarLink}>Settings</Link>
        </nav>
        <div className={styles.topBarUser}>
          <div className={styles.userAvatar}>
            {user?.email?.[0]?.toUpperCase() || '?'}
          </div>
        </div>
      </header>

      {/* Existing app content */}
      <div className={styles.appContent}>
        <Sidebar history={history} onSelectHistory={setResult} />
        <main className={styles.main}>
          <div className={styles.content}>
            <div className={styles.left}>
              <EmailInput
                onResult={handleResult}
                onLoading={setIsLoading}
                onStreamEvent={handleStreamEvent}
                threadId={threadId}
              />
              {isLoading && (
                <div className={styles.loadingOverlay}>
                  <div className={styles.loader}>
                    <div className={styles.pulse} />
                    <div className={styles.pulse} style={{ animationDelay: '0.2s' }} />
                    <div className={styles.pulse} style={{ animationDelay: '0.4s' }} />
                  </div>
                  <div className={styles.loadingText}>
                    {streamState?.node 
                      ? `Agent Active: ${streamState.node.toUpperCase()}...` 
                      : 'Agents are starting...'}
                  </div>
                  {streamState?.state?.messages && (
                    <div className={styles.streamMessages}>
                      {streamState.state.messages.map((m, i) => (
                        <div key={i} className={styles.streamMessageItem}>
                          {m.content || m}
                        </div>
                      )).slice(-3)}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className={styles.right}>
              <ResultDisplay result={result} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
