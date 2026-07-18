import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  CreditCard, 
  ArrowLeftRight, 
  PieChart, 
  LogOut, 
  Coins,
  Tag,
  Percent,
  Receipt,
  Wallet
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Accounts', path: '/accounts', icon: CreditCard },
    { name: 'Wallet Manager', path: '/wallets', icon: Wallet },
    { name: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
    { name: 'Budgets', path: '/budgets', icon: PieChart },
    { name: 'Expenses & Bills', path: '/expenses', icon: Receipt },
    { name: 'Categories', path: '/categories', icon: Tag },
  ];

  return (
    <div style={styles.sidebar}>
      <div style={styles.brand}>
        <Coins size={32} color="var(--accent-primary)" />
        <span style={styles.brandText}>Vantage Finance</span>
      </div>

      <nav style={styles.nav}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              style={({ isActive }) => ({
                ...styles.navLink,
                ...(isActive ? styles.navLinkActive : {}),
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon 
                    size={20} 
                    color={isActive ? 'white' : 'var(--text-secondary)'} 
                    style={styles.icon}
                  />
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {user && (
        <div style={styles.footer}>
          <div style={styles.userProfile}>
            <div style={styles.avatar}>
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div style={styles.userInfo}>
              <span style={styles.username}>{user.username}</span>
              <span style={styles.email}>{user.email}</span>
            </div>
          </div>
          <button onClick={logout} style={styles.logoutBtn}>
            <LogOut size={18} style={styles.icon} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  sidebar: {
    width: '260px',
    height: 'calc(100vh - 2rem)',
    background: 'var(--bg-glass)',
    backdropFilter: 'blur(25px)',
    border: '1px solid var(--border-glass)',
    position: 'fixed',
    top: '1rem',
    left: '1rem',
    borderRadius: '24px',
    boxShadow: 'var(--shadow-premium)',
    display: 'flex',
    flexDirection: 'column',
    padding: '2.25rem 1.5rem',
    zIndex: 100,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '3rem',
  },
  brandText: {
    fontSize: '1.25rem',
    fontWeight: 700,
    letterSpacing: '0.5px',
    background: 'linear-gradient(to right, var(--text-primary), var(--accent-secondary))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    flex: 1,
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.75rem 1rem',
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    borderRadius: '10px',
    fontSize: '0.95rem',
    fontWeight: 500,
    transition: 'var(--transition-smooth)',
  },
  navLinkActive: {
    background: 'linear-gradient(135deg, var(--accent-primary) 0%, #047857 100%)',
    color: 'white',
    boxShadow: '0 8px 20px var(--accent-primary-glow)',
  },
  icon: {
    transition: 'var(--transition-smooth)',
  },
  footer: {
    marginTop: 'auto',
    borderTop: '1px solid var(--border-glass)',
    paddingTop: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 700,
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '150px',
  },
  username: {
    fontWeight: 600,
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
  },
  email: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.6rem',
    background: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: 'var(--danger)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 600,
    transition: 'var(--transition-smooth)',
  },
};

export default Sidebar;
