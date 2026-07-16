import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Coins } from 'lucide-react';

const Auth = () => {
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    if (isLogin) {
      const res = await login(username, password);
      if (!res.success) {
        setError(res.message);
      }
    } else {
      const res = await signup(username, email, password);
      if (res.success) {
        setSuccessMsg('Account created successfully! Please log in.');
        setIsLogin(true);
        setPassword('');
      } else {
        setError(res.message);
      }
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.authBox} className="glass-card fade-in">
        <div style={styles.brand}>
          <Coins size={42} color="var(--accent-primary)" />
          <h2 style={styles.logoText}>Vantage Finance</h2>
          <p style={styles.tagline}>Take control of your financial destiny</p>
        </div>

        <div style={styles.tabs}>
          <button 
            onClick={() => { setIsLogin(true); setError(''); setSuccessMsg(''); }}
            style={{...styles.tab, ...(isLogin ? styles.activeTab : {})}}
          >
            Login
          </button>
          <button 
            onClick={() => { setIsLogin(false); setError(''); setSuccessMsg(''); }}
            style={{...styles.tab, ...(!isLogin ? styles.activeTab : {})}}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.errorAlert}>{error}</div>}
          {successMsg && <div style={styles.successAlert}>{successMsg}</div>}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              className="glass-input" 
              placeholder="Enter your username"
              required 
            />
          </div>

          {!isLogin && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="glass-input" 
                placeholder="you@example.com"
                required 
              />
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="glass-input" 
              placeholder="••••••••"
              required 
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={styles.submitBtn}>
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100%',
    padding: '1.5rem',
    backgroundImage: 'linear-gradient(rgba(5, 8, 12, 0.75), rgba(5, 8, 12, 0.75)), url("/vantage_login_bg.png")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  },
  authBox: {
    width: '100%',
    maxWidth: '430px',
    padding: '2.5rem',
  },
  brand: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  logoText: {
    fontSize: '1.5rem',
    fontWeight: 800,
    marginTop: '0.75rem',
    letterSpacing: '0.5px',
    background: 'linear-gradient(to right, #ffffff, var(--accent-secondary))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  tagline: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    marginTop: '0.25rem',
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid var(--border-glass)',
    marginBottom: '1.5rem',
  },
  tab: {
    flex: 1,
    padding: '0.75rem',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
    textAlign: 'center',
  },
  activeTab: {
    color: 'var(--accent-primary)',
    borderBottom: '2px solid var(--accent-primary)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
  },
  submitBtn: {
    marginTop: '0.5rem',
    padding: '0.85rem',
  },
  errorAlert: {
    padding: '0.75rem 1rem',
    background: 'var(--danger-glow)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: 'var(--danger)',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: 500,
  },
  successAlert: {
    padding: '0.75rem 1rem',
    background: 'var(--success-glow)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: 'var(--success)',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: 500,
  },
};

export default Auth;
