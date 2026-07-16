import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { 
  Plus, 
  Trash2, 
  Download, 
  FileSpreadsheet, 
  FileText,
  Search,
  Filter,
  ArrowRight
} from 'lucide-react';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState('EXPENSE');
  const [categoryId, setCategoryId] = useState('');
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');

  // Filtering State
  const [selectedAccount, setSelectedAccount] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAllData = async () => {
    try {
      const [transRes, accRes, catRes] = await Promise.all([
        api.get('/transactions'),
        api.get('/accounts'),
        api.get('/categories')
      ]);
      setTransactions(transRes.data);
      setAccounts(accRes.data);
      setCategories(catRes.data);
      
      // Select first options by default in form
      if (catRes.data.length > 0) setCategoryId(catRes.data[0].id);
      if (accRes.data.length > 0) {
        setFromAccountId(accRes.data[0].id);
        setToAccountId(accRes.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load transaction ledger data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const payload = {
      description,
      amount: parseFloat(amount),
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
      type,
      categoryId: parseInt(categoryId),
    };

    if (type === 'EXPENSE') {
      payload.fromAccountId = parseInt(fromAccountId);
    } else if (type === 'INCOME') {
      payload.toAccountId = parseInt(toAccountId);
    } else if (type === 'TRANSFER') {
      payload.fromAccountId = parseInt(fromAccountId);
      payload.toAccountId = parseInt(toAccountId);
    }

    try {
      await api.post('/transactions', payload);
      setIsModalOpen(false);
      setDescription('');
      setAmount('');
      setDate('');
      fetchAllData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record transaction');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction? The account balance will be adjusted back.')) {
      try {
        await api.delete(`/transactions/${id}`);
        fetchAllData();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete transaction');
      }
    }
  };

  const downloadReport = async (format) => {
    try {
      const response = await api.get(`/reports/${format}`, { responseType: 'blob' });
      const blob = new Blob([response.data], { 
        type: format === 'excel' 
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          : 'application/pdf' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions.${format === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download report', err);
      alert('Failed to generate report export');
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    const matchesAccount = !selectedAccount || 
      t.fromAccountId === parseInt(selectedAccount) || 
      t.toAccountId === parseInt(selectedAccount);
    
    const matchesSearch = !searchTerm || 
      (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      t.categoryName.toLowerCase().includes(searchTerm.toLowerCase());
      
    return matchesAccount && matchesSearch;
  });

  if (loading) {
    return <div style={styles.loading}>Loading Ledger...</div>;
  }

  return (
    <div style={styles.container} className="fade-in">
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Transaction Ledger</h1>
          <p style={styles.subtitle}>Audit, create, filter, and export cash ledger logs</p>
        </div>
        <div style={styles.headerActions}>
          <button onClick={() => downloadReport('excel')} className="btn-secondary" style={styles.exportBtn}>
            <FileSpreadsheet size={16} color="#10b981" />
            <span>Excel</span>
          </button>
          <button onClick={() => downloadReport('pdf')} className="btn-secondary" style={styles.exportBtn}>
            <FileText size={16} color="#ef4444" />
            <span>PDF</span>
          </button>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={styles.addBtn}>
            <Plus size={18} />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="glass-card" style={styles.filterCard}>
        <div style={styles.filterGroup}>
          <div style={styles.searchWrap}>
            <Search size={18} style={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search description, category..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input" 
              style={styles.searchInput}
            />
          </div>
          
          <div style={styles.selectWrap}>
            <Filter size={16} style={styles.filterIcon} />
            <select 
              value={selectedAccount} 
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="glass-input"
              style={styles.filterSelect}
            >
              <option value="">All Accounts</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="glass-card" style={styles.tableCard}>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Description</th>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Accounts Involved</th>
                <th style={styles.th}>Amount</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((t) => (
                <tr key={t.id} style={styles.tr}>
                  <td style={styles.td}>{new Date(t.date).toLocaleDateString()}</td>
                  <td style={styles.td}>{t.description || '-'}</td>
                  <td style={styles.td}>{t.categoryName}</td>
                  <td style={styles.td}>
                    <span style={styles.badge(t.type)}>{t.type}</span>
                  </td>
                  <td style={styles.td}>
                    {t.type === 'EXPENSE' && <span>{t.fromAccountName}</span>}
                    {t.type === 'INCOME' && <span>{t.toAccountName}</span>}
                    {t.type === 'TRANSFER' && (
                      <span style={styles.transferFlow}>
                        {t.fromAccountName} <ArrowRight size={14} style={{ margin: '0 4px' }} /> {t.toAccountName}
                      </span>
                    )}
                  </td>
                  <td style={{...styles.td, ...styles.amountText(t.type)}}>
                    {t.type === 'EXPENSE' ? '-' : '+'}${t.amount.toFixed(2)}
                  </td>
                  <td style={styles.td}>
                    <button onClick={() => handleDelete(t.id)} style={styles.deleteBtn}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan="7" style={styles.noTransactions}>No financial transactions match your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record New Transaction">
        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.errorAlert}>{error}</div>}

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Transaction Type</label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value)} 
                className="glass-input" 
                style={styles.select}
              >
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
                <option value="TRANSFER">Transfer</option>
              </select>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Category</label>
              <select 
                value={categoryId} 
                onChange={(e) => setCategoryId(e.target.value)} 
                className="glass-input" 
                style={styles.select}
              >
                {categories.filter(c => type === 'TRANSFER' || c.type === type).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={styles.formRow}>
            {type !== 'INCOME' && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Source Account (From)</label>
                <select 
                  value={fromAccountId} 
                  onChange={(e) => setFromAccountId(e.target.value)} 
                  className="glass-input" 
                  style={styles.select}
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            )}

            {type !== 'EXPENSE' && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Destination Account (To)</label>
                <select 
                  value={toAccountId} 
                  onChange={(e) => setToAccountId(e.target.value)} 
                  className="glass-input" 
                  style={styles.select}
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Amount</label>
            <input 
              type="number" 
              step="0.01"
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              className="glass-input" 
              placeholder="0.00"
              required 
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Date</label>
            <input 
              type="datetime-local" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              className="glass-input" 
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <input 
              type="text" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              className="glass-input" 
              placeholder="e.g. Grocery store, Monthly check"
            />
          </div>

          <div style={styles.actions}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Transaction
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
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  exportBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.65rem 1rem',
  },
  filterCard: {
    padding: '1.25rem',
    marginBottom: '1.5rem',
  },
  filterCardMobile: {},
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  searchWrap: {
    position: 'relative',
    flex: 1,
    minWidth: '260px',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-muted)',
  },
  searchInput: {
    paddingLeft: '38px',
  },
  selectWrap: {
    position: 'relative',
    width: '200px',
  },
  filterIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-muted)',
  },
  filterSelect: {
    paddingLeft: '34px',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='white' height='20' viewBox='0 0 24 24' width='20' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
  },
  tableCard: {
    padding: '0.5rem',
    marginBottom: '2rem',
  },
  tableWrap: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  thRow: {
    borderBottom: '1px solid var(--border-glass)',
  },
  th: {
    padding: '1rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tr: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
    transition: 'var(--transition-fast)',
  },
  td: {
    padding: '1rem',
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
  },
  transferFlow: {
    display: 'inline-flex',
    alignItems: 'center',
    color: 'var(--text-primary)',
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
  noTransactions: {
    padding: '4rem 2rem',
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '0.95rem',
  },
  badge: (type) => ({
    padding: '0.25rem 0.6rem',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 600,
    backgroundColor: type === 'INCOME' ? 'var(--success-glow)' : type === 'EXPENSE' ? 'var(--danger-glow)' : 'var(--accent-primary-glow)',
    color: type === 'INCOME' ? 'var(--success)' : type === 'EXPENSE' ? 'var(--danger)' : 'var(--accent-primary)',
    border: `1px solid ${type === 'INCOME' ? 'rgba(16, 185, 129, 0.2)' : type === 'EXPENSE' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.2)'}`,
  }),
  amountText: (type) => ({
    fontWeight: 600,
    color: type === 'INCOME' ? 'var(--success)' : type === 'EXPENSE' ? 'var(--danger)' : 'var(--text-primary)',
  }),
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

export default Transactions;
