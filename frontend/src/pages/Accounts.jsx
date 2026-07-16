import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { Plus, Trash2, Landmark, Wallet, CreditCard, BarChart2 } from 'lucide-react';

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState('BANK');
  const [balance, setBalance] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [error, setError] = useState('');

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/accounts');
      setAccounts(response.data);
    } catch (err) {
      console.error('Failed to load accounts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await api.post('/accounts', {
        name,
        type,
        balance: parseFloat(balance),
        currency,
      });
      setIsModalOpen(false);
      setName('');
      setBalance('');
      fetchAccounts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create account');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this account? All associated transactions will also be lost.')) {
      try {
        await api.delete(`/accounts/${id}`);
        fetchAccounts();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete account');
      }
    }
  };

  const getAccountIcon = (type) => {
    switch (type) {
      case 'BANK': return <Landmark size={24} color="var(--accent-primary)" />;
      case 'CASH': return <Wallet size={24} color="var(--success)" />;
      case 'CREDIT_CARD': return <CreditCard size={24} color="var(--danger)" />;
      case 'INVESTMENT': return <BarChart2 size={24} color="var(--warning)" />;
      default: return <Landmark size={24} color="var(--text-secondary)" />;
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading Accounts...</div>;
  }

  return (
    <div style={styles.container} className="fade-in">
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>My Accounts</h1>
          <p style={styles.subtitle}>Manage your bank accounts, cash wallets, credit cards, and investments</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={styles.addBtn}>
          <Plus size={18} />
          <span>Add Account</span>
        </button>
      </div>

      <div style={styles.grid}>
        {accounts.map((acc) => (
          <div key={acc.id} className="glass-card" style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.iconWrap(acc.type)}>
                {getAccountIcon(acc.type)}
              </div>
              <button onClick={() => handleDelete(acc.id)} style={styles.deleteBtn}>
                <Trash2 size={16} />
              </button>
            </div>
            
            <div style={styles.cardBody}>
              <h3 style={styles.accName}>{acc.name}</h3>
              <p style={styles.accType}>{acc.type.replace('_', ' ')}</p>
              <h2 style={styles.accBalance}>
                ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span style={styles.currency}> {acc.currency}</span>
              </h2>
            </div>
          </div>
        ))}

        {accounts.length === 0 && (
          <div style={styles.noAccounts}>
            <p>You have not registered any financial accounts yet.</p>
            <button onClick={() => setIsModalOpen(true)} className="btn-secondary" style={{ marginTop: '1rem' }}>
              Create Your First Account
            </button>
          </div>
        )}
      </div>

      {/* Add Account Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Account">
        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.errorAlert}>{error}</div>}

          <div style={styles.formGroup}>
            <label style={styles.label}>Account Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="glass-input" 
              placeholder="e.g. Chase checking, Cash wallet"
              required 
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Account Type</label>
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value)} 
              className="glass-input" 
              style={styles.select}
            >
              <option value="BANK">Bank Account</option>
              <option value="CASH">Cash Wallet</option>
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="INVESTMENT">Investment Account</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Initial Balance</label>
            <input 
              type="number" 
              step="0.01"
              value={balance} 
              onChange={(e) => setBalance(e.target.value)} 
              className="glass-input" 
              placeholder="0.00"
              required 
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Currency</label>
            <input 
              type="text" 
              value={currency} 
              onChange={(e) => setCurrency(e.target.value)} 
              className="glass-input" 
              placeholder="USD"
              required 
            />
          </div>

          <div style={styles.actions}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '60vh',
    fontSize: '1.2rem',
    color: 'var(--text-secondary)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    marginTop: '0.25rem',
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  card: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '180px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.5rem',
  },
  iconWrap: (type) => ({
    width: '46px',
    height: '46px',
    borderRadius: '10px',
    backgroundColor: type === 'BANK' ? 'rgba(99, 102, 241, 0.08)' : type === 'CASH' ? 'rgba(16, 185, 129, 0.08)' : type === 'CREDIT_CARD' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `1px solid ${type === 'BANK' ? 'rgba(99, 102, 241, 0.15)' : type === 'CASH' ? 'rgba(16, 185, 129, 0.15)' : type === 'CREDIT_CARD' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)'}`,
  }),
  deleteBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '6px',
    transition: 'var(--transition-fast)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
  },
  accName: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  accType: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginTop: '0.15rem',
  },
  accBalance: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginTop: '1rem',
  },
  currency: {
    fontSize: '0.9rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
  },
  noAccounts: {
    gridColumn: '1 / -1',
    padding: '4rem 2rem',
    textAlign: 'center',
    color: 'var(--text-muted)',
    background: 'var(--bg-glass)',
    borderRadius: '16px',
    border: '1px dashed var(--border-glass)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
  },
  select: {
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='white' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    paddingRight: '30px',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    marginTop: '0.75rem',
  },
  errorAlert: {
    padding: '0.75rem 1rem',
    background: 'var(--danger-glow)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: 'var(--danger)',
    borderRadius: '8px',
    fontSize: '0.85rem',
  },
};

export default Accounts;
