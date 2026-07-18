import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { Plus, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';

const getCurrencySymbol = (currency) => {
  switch (currency?.toUpperCase()) {
    case 'INR': return '₹';
    case 'EUR': return '€';
    case 'GBP': return '£';
    default: return '$';
  }
};

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [limitAmount, setLimitAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [error, setError] = useState('');

  const fetchAllData = async () => {
    try {
      const [budRes, catRes, accRes] = await Promise.all([
        api.get('/budgets'),
        api.get('/categories'),
        api.get('/accounts')
      ]);
      setBudgets(budRes.data);
      setAccounts(accRes.data);
      const expenseCategories = catRes.data.filter(c => c.type === 'EXPENSE');
      setCategories(expenseCategories);
      if (expenseCategories.length > 0) {
        setCategoryId(expenseCategories[0].id);
      }
    } catch (err) {
      console.error('Failed to load budget data', err);
    } finally {
      setLoading(false);
    }
  };

  const primaryCurrency = accounts.find(a => a.currency === 'INR') ? 'INR' : (accounts[0]?.currency || 'INR');
  const currencySymbol = getCurrencySymbol(primaryCurrency);

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await api.post('/budgets', {
        limitAmount: parseFloat(limitAmount),
        startDate,
        categoryId: parseInt(categoryId),
      });
      setIsModalOpen(false);
      setLimitAmount('');
      setStartDate('');
      fetchAllData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create budget limit');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this budget?')) {
      try {
        await api.delete(`/budgets/${id}`);
        fetchAllData();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete budget');
      }
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading Budgets...</div>;
  }

  return (
    <div style={styles.container} className="fade-in">
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Category Budgets</h1>
          <p style={styles.subtitle}>Set expense limits per category and track your spending goals</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={styles.addBtn}>
          <Plus size={18} />
          <span>Add Budget</span>
        </button>
      </div>

      <div style={styles.grid}>
        {budgets.map((b) => {
          const percentage = Math.min((b.currentAmount / b.limitAmount) * 100, 100);
          const isOver = b.currentAmount > b.limitAmount;
          const isWarning = b.currentAmount / b.limitAmount > 0.8 && !isOver;

          return (
            <div key={b.id} className="glass-card" style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <h3 style={styles.catName}>{b.categoryName}</h3>
                  <p style={styles.dates}>
                    Starts: {new Date(b.startDate).toLocaleDateString()}
                  </p>
                </div>
                <button onClick={() => handleDelete(b.id)} style={styles.deleteBtn}>
                  <Trash2 size={16} />
                </button>
              </div>

              <div style={styles.gaugeContainer}>
                <div style={styles.gaugeLabels}>
                  <span>Spent: <strong>{currencySymbol}{b.currentAmount.toFixed(2)}</strong></span>
                  <span>Limit: <strong>{currencySymbol}{b.limitAmount.toFixed(2)}</strong></span>
                </div>
                
                <div style={styles.progressBarBg}>
                  <div style={styles.progressBarFill(percentage, isOver, isWarning)} />
                </div>
                
                <div style={styles.statusBar}>
                  {isOver ? (
                    <span style={styles.alertText(true)}>
                      <AlertTriangle size={14} style={{ marginRight: '4px' }} />
                      Limit Exceeded! Over by {currencySymbol}{(b.currentAmount - b.limitAmount).toFixed(2)}
                    </span>
                  ) : isWarning ? (
                    <span style={styles.alertText(false)}>
                      <AlertTriangle size={14} style={{ marginRight: '4px' }} />
                      Nearing Limit! (80%+ Used)
                    </span>
                  ) : (
                    <span style={styles.safeText}>
                      <CheckCircle size={14} style={{ marginRight: '4px' }} />
                      On Track
                    </span>
                  )}
                  <span style={styles.percentText}>{percentage.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          );
        })}

        {budgets.length === 0 && (
          <div style={styles.noBudgets}>
            <p>No budget limits have been configured for your categories yet.</p>
            <button onClick={() => setIsModalOpen(true)} className="btn-secondary" style={{ marginTop: '1rem' }}>
              Create Your First Budget
            </button>
          </div>
        )}
      </div>

      {/* Add Budget Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Set Budget Limit">
        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.errorAlert}>{error}</div>}

          <div style={styles.formGroup}>
            <label style={styles.label}>Select Category</label>
            <select 
              value={categoryId} 
              onChange={(e) => setCategoryId(e.target.value)} 
              className="glass-input" 
              style={styles.select}
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Budget Limit Amount ({currencySymbol})</label>
            <input 
              type="number" 
              step="0.01"
              value={limitAmount} 
              onChange={(e) => setLimitAmount(e.target.value)} 
              className="glass-input" 
              placeholder="5000.00"
              required 
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Start Date</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              className="glass-input" 
              required 
            />
          </div>

          <div style={styles.actions}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Set Budget
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  card: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.5rem',
  },
  catName: {
    fontSize: '1.15rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  dates: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '0.15rem',
  },
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
  gaugeContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  gaugeLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  progressBarBg: {
    width: '100%',
    height: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '10px',
    overflow: 'hidden',
    border: '1px solid var(--border-glass)',
  },
  progressBarFill: (percentage, isOver, isWarning) => ({
    width: `${percentage}%`,
    height: '100%',
    borderRadius: '10px',
    background: isOver 
      ? 'linear-gradient(90deg, var(--danger) 0%, #ff6b6b 100%)' 
      : isWarning 
      ? 'linear-gradient(90deg, var(--warning) 0%, #ffb830 100%)' 
      : 'linear-gradient(90deg, var(--success) 0%, #34d399 100%)',
    boxShadow: isOver 
      ? '0 0 10px rgba(239, 68, 68, 0.3)' 
      : isWarning 
      ? '0 0 10px rgba(245, 158, 11, 0.3)' 
      : '0 0 10px rgba(16, 185, 129, 0.3)',
    transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
  }),
  statusBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '0.25rem',
  },
  alertText: (isOver) => ({
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: isOver ? 'var(--danger)' : 'var(--warning)',
  }),
  safeText: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--success)',
  },
  percentText: {
    fontSize: '0.8rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  noBudgets: {
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
  formRow: {
    display: 'flex',
    gap: '1rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    flex: 1,
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

export default Budgets;
