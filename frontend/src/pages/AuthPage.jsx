import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import styles from './AuthPage.module.css';

export default function AuthPage({ mode }) {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const isSignup = mode === 'signup';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (isSignup && !name)) {
      toast.error('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      if (isSignup) {
        await signUp(email, password, name);
        toast.success('Account created! Check your email to confirm.');
      } else {
        await signIn(email, password);
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      toast.error(err.message || 'Google sign-in failed.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Background */}
      <div className={styles.bg} />
      <div className={styles.bgGlow} />

      {/* Back to home */}
      <Link to="/" className={styles.backLink}>
        ← Beaver Agent
      </Link>

      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className={styles.cardHeader}>
          <div className={styles.logo}>🦫</div>
          <h1 className={styles.title}>
            {isSignup ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className={styles.sub}>
            {isSignup
              ? 'Start automating your inbox for free.'
              : 'Sign in to your Beaver Agent workspace.'}
          </p>
        </div>

        {/* Google OAuth */}
        <button
          className={styles.googleBtn}
          onClick={handleGoogle}
          disabled={googleLoading}
        >
          {googleLoading ? (
            <span className={styles.spinner} />
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
          )}
          Continue with Google
        </button>

        <div className={styles.divider}>
          <span>or continue with email</span>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {isSignup && (
            <div className={styles.field}>
              <label className={styles.label}>Full Name</label>
              <input
                className={styles.input}
                type="text"
                placeholder="Sarah Chen"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              className={styles.input}
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label className={styles.label}>Password</label>
              {!isSignup && (
                <Link to="/forgot-password" className={styles.forgotLink}>Forgot password?</Link>
              )}
            </div>
            <div className={styles.inputWrap}>
              <input
                className={styles.input}
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                className={styles.showPass}
                onClick={() => setShowPass(p => !p)}
                tabIndex={-1}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button className={styles.submitBtn} type="submit" disabled={loading}>
            {loading ? <span className={styles.spinner} /> : null}
            {isSignup ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p className={styles.switchText}>
          {isSignup ? 'Already have an account? ' : "Don't have an account? "}
          <Link to={isSignup ? '/login' : '/signup'} className={styles.switchLink}>
            {isSignup ? 'Sign in' : 'Sign up for free'}
          </Link>
        </p>

        {isSignup && (
          <p className={styles.terms}>
            By creating an account you agree to our{' '}
            <a href="#">Terms of Service</a> and{' '}
            <a href="#">Privacy Policy</a>.
          </p>
        )}
      </motion.div>
    </div>
  );
}
