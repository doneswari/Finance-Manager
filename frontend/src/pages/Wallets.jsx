import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { 
  Plus, 
  Trash2, 
  ArrowRight, 
  DollarSign, 
  Wallet, 
  Landmark, 
  RefreshCw, 
  Send, 
  CheckCircle,
  CreditCard 
} from 'lucide-react';

const getCurrencySymbol = (currency) => {
  switch (currency?.toUpperCase()) {
    case 'INR': return '₹';
    case 'EUR': return '€';
    case 'GBP': return '£';
    default: return '$';
  }
};

const Wallets = () => {
  const [wallets, setWallets] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // New Wallet form state
  const [walletName, setWalletName] = useState('');
  const [walletType, setWalletType] = useState('WALLET'); // 'CASH' or 'WALLET'
  const [initialBalance, setInitialBalance] = useState('');
  const [walletCurrency, setWalletCurrency] = useState('INR');
  
  // Load Wallet form state
  const [sourceBankId, setSourceBankId] = useState('');
  const [loadAmount, setLoadAmount] = useState('');

  const fetchAllData = async () => {
    try {
      const [accRes, transRes, catRes] = await Promise.all([
        api.get('/accounts'),
        api.get('/transactions'),
        api.get('/categories')
      ]);

      // Filter Cash and Digital Wallets
      const walletList = accRes.data.filter(a => a.type === 'CASH' || a.type === 'WALLET');
      setWallets(walletList);

      // Filter Bank Accounts for source transfer loading
      const banks = accRes.data.filter(a => a.type === 'BANK');
      setBankAccounts(banks);
      if (banks.length > 0) setSourceBankId(banks[0].id);

      setTransactions(transRes.data);
      setCategories(catRes.data);

      if (walletList.length > 0 && !selectedWallet) {
        setSelectedWallet(walletList[0]);
      } else if (walletList.length > 0 && selectedWallet) {
        // Update currently selected wallet with fresh data
        const updated = walletList.find(w => w.id === selectedWallet.id);
        setSelectedWallet(updated || walletList[0]);
      }
    } catch (err) {
      console.error('Failed to load wallet manager data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleCreateWallet = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await api.post('/accounts', {
        name: walletName,
        type: walletType,
        balance: parseFloat(initialBalance),
        currency: walletCurrency
      });

      setIsAddModalOpen(false);
      setWalletName('');
      setInitialBalance('');
      fetchAllData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create wallet');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoadWallet = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    // Find utilities or transfer category
    const transferCat = categories.find(c => c.name.toLowerCase().includes('utilities') || c.name.toLowerCase().includes('other')) || categories[0];

    const payload = {
      description: `Loaded Wallet: ${selectedWallet.name}`,
      amount: parseFloat(loadAmount),
      date: new Date().toISOString(),
      type: 'TRANSFER',
      categoryId: transferCat ? transferCat.id : 1,
      fromAccountId: parseInt(sourceBankId),
      toAccountId: parseInt(selectedWallet.id)
    };

    try {
      await api.post('/transactions', payload);
      setIsLoadModalOpen(false);
      setLoadAmount('');
      alert(`Wallet loaded successfully! Transfer of ${getCurrencySymbol(selectedWallet?.currency)}${payload.amount.toFixed(2)} recorded.`);
      fetchAllData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to transfer funds to wallet');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWallet = async (id) => {
    if (window.confirm('Are you sure you want to remove this wallet? All associated transactions will also be lost.')) {
      try {
        await api.delete(`/accounts/${id}`);
        setSelectedWallet(null);
        fetchAllData();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete wallet');
      }
    }
  };

  // Get transactions associated with the selected wallet
  const selectedWalletTransactions = selectedWallet
    ? transactions.filter(t => t.fromAccountId === selectedWallet.id || t.toAccountId === selectedWallet.id)
    : [];

  const totalWalletBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  if (loading) {
    return <div style={styles.loading}>Opening Wallet Case...</div>;
  }

  return (
    <div style={styles.container} className="fade-in">
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Wallet Manager</h1>
          <p style={styles.subtitle}>Manage cash wallets, e-wallets, load funds, and track transaction history</p>
        </div>
        <div style={styles.headerActions}>
          {selectedWallet && (
            <button 
              onClick={() => setIsLoadModalOpen(true)} 
              className="btn-primary" 
              style={{ ...styles.addBtn, background: 'linear-gradient(135deg, var(--accent-secondary) 0%, #0891b2 100%)', boxShadow: '0 8px 20px rgba(6, 182, 212, 0.2)' }}
            >
              <Send size={18} />
              <span>Load Selected Wallet</span>
            </button>
          )}
          <button onClick={() => setIsAddModalOpen(true)} className="btn-primary" style={styles.addBtn}>
            <Plus size={18} />
            <span>Add Balance</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={styles.metricsGrid}>
        <div className="glass-card" style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <Wallet size={24} color="var(--success)" />
            <span style={styles.metricLabel}>Total Wallet Balance</span>
          </div>
          <span style={styles.metricValue}>
            {getCurrencySymbol(wallets[0]?.currency || 'INR')}{totalWalletBalance.toFixed(2)}
          </span>
          <span style={styles.metricMeta}>{wallets.length} active digital/cash wallets</span>
        </div>
      </div>

      {/* Cards case & transactions grid */}
      <div style={styles.mainGrid}>
        {/* Left Side: Wallets list styled as cards */}
        <div style={styles.walletsCol}>
          <h3 style={styles.sectionTitle}>My Cards & Wallets</h3>
          {wallets.length === 0 ? (
            <div className="glass-card" style={styles.emptyState}>
              <Wallet size={40} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
              <p>No active wallets found. Add a Cash or Digital wallet to begin.</p>
            </div>
          ) : (
            <div style={styles.cardStack}>
              {wallets.map((w, idx) => {
                const isSelected = selectedWallet && selectedWallet.id === w.id;
                // Alternate gradients for visual aesthetics
                const cardGradient = w.type === 'CASH'
                  ? 'linear-gradient(135deg, #064e3b 0%, #10b981 100%)' // Emerald
                  : idx % 2 === 0
                  ? 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' // Blue
                  : 'linear-gradient(135deg, #581c87 0%, #8b5cf6 100%)'; // Purple

                return (
                  <div 
                    key={w.id} 
                    onClick={() => setSelectedWallet(w)}
                    style={{
                      ...styles.creditCardLayout,
                      background: cardGradient,
                      ...(isSelected ? styles.creditCardSelected : {})
                    }}
                  >
                    <div style={styles.cardHeaderRow}>
                      <div style={styles.chip}></div>
                      <span style={styles.cardTypeText}>{w.type === 'CASH' ? 'CASH WALLET' : 'E-WALLET'}</span>
                    </div>

                    <div style={styles.cardNumber}>
                      ••••  ••••  ••••  {w.id * 179 % 10000 || '8839'}
                    </div>

                    <div style={styles.cardFooterRow}>
                      <div>
                        <div style={styles.cardLabel}>WALLET NAME</div>
                        <div style={styles.cardOwner}>{w.name}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={styles.cardLabel}>BALANCE</div>
                        <div style={styles.cardBalance}>{getCurrencySymbol(w.currency)}{w.balance.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Wallet details & history */}
        <div style={styles.detailsCol}>
          {selectedWallet ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="glass-card" style={styles.walletDetailsHeaderCard}>
                <div style={styles.detailsHeaderInfo}>
                  <div>
                    <h3 style={styles.detailsTitle}>{selectedWallet.name}</h3>
                    <p style={styles.detailsSubtitle}>Type: {selectedWallet.type} | Currency: {selectedWallet.currency}</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteWallet(selectedWallet.id)} 
                    style={styles.deleteWalletBtn}
                    title="Delete Wallet"
                  >
                    <Trash2 size={18} />
                    <span>Delete Wallet</span>
                  </button>
                </div>
              </div>

              {/* Wallet Ledger */}
              <div className="glass-card" style={styles.ledgerCard}>
                <h4 style={styles.ledgerTitle}>Recent Wallet Activity</h4>
                <div style={styles.tableWrap}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.thRow}>
                        <th style={styles.th}>Date</th>
                        <th style={styles.th}>Description</th>
                        <th style={styles.th}>Category</th>
                        <th style={styles.th}>Type</th>
                        <th style={styles.th}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedWalletTransactions.map((t) => {
                        const isIncome = t.toAccountId === selectedWallet.id;
                        const isExpense = t.fromAccountId === selectedWallet.id;
                        let displayType = t.type;
                        if (t.type === 'TRANSFER') {
                          displayType = isIncome ? 'LOAD' : 'SPEND';
                        }
                        
                        return (
                          <tr key={t.id} style={styles.tr}>
                            <td style={styles.td}>{new Date(t.date).toLocaleDateString()}</td>
                            <td style={styles.td}>{t.description}</td>
                            <td style={styles.td}>{t.categoryName}</td>
                            <td style={styles.td}>
                              <span style={styles.badge(isIncome ? 'INCOME' : 'EXPENSE', displayType)}>
                                {displayType}
                              </span>
                            </td>
                            <td style={{
                              ...styles.td,
                              fontWeight: 600,
                              color: isIncome ? 'var(--success)' : 'var(--danger)'
                            }}>
                              {isIncome ? '+' : '-'}{getCurrencySymbol(selectedWallet.currency)}{t.amount.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}

                      {selectedWalletTransactions.length === 0 && (
                        <tr>
                          <td colSpan="5" style={styles.noTransactions}>
                            No transactions recorded for this wallet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card" style={styles.selectPromptCard}>
              <Wallet size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
              <h3>Select a Wallet</h3>
              <p>Choose a wallet card from the left side to check its balance details and view logs.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Wallet Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Create Cash or Digital Wallet">
        <form onSubmit={handleCreateWallet} style={styles.form}>
          {error && <div style={styles.errorAlert}>{error}</div>}

          <div style={styles.formGroup}>
            <label style={styles.label}>Wallet Name</label>
            <input 
              type="text" 
              value={walletName} 
              onChange={(e) => setWalletName(e.target.value)} 
              className="glass-input" 
              placeholder="e.g. PayPal, Venmo, Pocket Cash"
              required 
            />
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Wallet Type</label>
              <select 
                value={walletType} 
                onChange={(e) => setWalletType(e.target.value)} 
                className="glass-input" 
                style={styles.select}
              >
                <option value="WALLET">Digital Wallet (e.g. PayPal)</option>
                <option value="CASH">Cash Wallet (Physical cash)</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Currency</label>
              <select 
                value={walletCurrency} 
                onChange={(e) => setWalletCurrency(e.target.value)} 
                className="glass-input" 
                style={styles.select}
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Initial Balance</label>
            <input 
              type="number" 
              step="0.01"
              value={initialBalance} 
              onChange={(e) => setInitialBalance(e.target.value)} 
              className="glass-input" 
              placeholder="0.00"
              required 
            />
          </div>

          <div style={styles.actions}>
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Wallet'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Load Wallet Modal */}
      <Modal isOpen={isLoadModalOpen} onClose={() => setIsLoadModalOpen(false)} title="Load Wallet (Bank Transfer)">
        {selectedWallet && (
          <form onSubmit={handleLoadWallet} style={styles.form}>
            {error && <div style={styles.errorAlert}>{error}</div>}

            <div style={styles.loadDirectionRow}>
              <div style={styles.loadEntityCard}>
                <Landmark size={20} color="var(--accent-primary)" />
                <span style={{ fontWeight: 600 }}>Bank Account</span>
              </div>
              <ArrowRight size={20} color="var(--text-secondary)" />
              <div style={{ ...styles.loadEntityCard, borderColor: 'var(--success)' }}>
                <Wallet size={20} color="var(--success)" />
                <span style={{ fontWeight: 600 }}>{selectedWallet.name}</span>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Select Source Bank Account</label>
              <select 
                value={sourceBankId} 
                onChange={(e) => setSourceBankId(e.target.value)} 
                className="glass-input" 
                style={styles.select}
                required
              >
                {bankAccounts.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({getCurrencySymbol(b.currency)}{b.balance.toFixed(2)})</option>
                ))}
              </select>
              {bankAccounts.length === 0 && (
                <span style={{ fontSize: '0.8rem', color: 'var(--danger)', marginTop: '4px' }}>
                  No active Bank accounts found. Create a Bank account first to load money!
                </span>
              )}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Load Amount ({getCurrencySymbol(selectedWallet?.currency)})</label>
              <input 
                type="number" 
                step="0.01"
                value={loadAmount} 
                onChange={(e) => setLoadAmount(e.target.value)} 
                className="glass-input" 
                placeholder="0.00"
                required 
              />
            </div>

            <div style={styles.actions}>
              <button type="button" onClick={() => setIsLoadModalOpen(false)} className="btn-secondary">
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={submitting || bankAccounts.length === 0}
              >
                {submitting ? 'Transferring...' : 'Transfer Funds'}
              </button>
            </div>
          </form>
        )}
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
    marginBottom: '2.5rem',
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
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    marginBottom: '2.5rem',
  },
  metricCard: {
    padding: '1.5rem 1.75rem',
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '400px',
  },
  metricHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.75rem',
  },
  metricLabel: {
    fontSize: '0.9rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
  },
  metricValue: {
    fontSize: '2.2rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '0.25rem',
  },
  metricMeta: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 2fr',
    gap: '2rem',
    alignItems: 'start',
    marginBottom: '4rem',
  },
  walletsCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  sectionTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  cardStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  creditCardLayout: {
    padding: '1.5rem',
    borderRadius: '16px',
    height: '190px',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxShadow: 'var(--shadow-premium)',
    cursor: 'pointer',
    position: 'relative',
    transition: 'var(--transition-smooth)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    opacity: 0.85,
  },
  creditCardSelected: {
    transform: 'scale(1.025) translateY(-4px)',
    border: '1.5px solid var(--accent-primary)',
    boxShadow: '0 12px 30px rgba(16, 185, 129, 0.25)',
    opacity: 1,
  },
  cardHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chip: {
    width: '32px',
    height: '24px',
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '4px',
    position: 'relative',
    backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0) 20%, rgba(255,255,255,0.15) 30%, transparent 60%)',
  },
  cardNumber: {
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: '1.15rem',
    fontWeight: 700,
    letterSpacing: '2px',
    margin: '1.25rem 0',
  },
  cardFooterRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardLabel: {
    fontSize: '0.65rem',
    color: 'rgba(255, 255, 255, 0.65)',
    fontWeight: 600,
    letterSpacing: '0.5px',
    marginBottom: '2px',
  },
  cardOwner: {
    fontSize: '0.85rem',
    fontWeight: 600,
    letterSpacing: '0.5px',
  },
  cardBalance: {
    fontSize: '1.25rem',
    fontWeight: 700,
  },
  detailsCol: {
    flex: 1,
  },
  walletDetailsHeaderCard: {
    padding: '1.5rem',
  },
  detailsHeaderInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  detailsTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  detailsSubtitle: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    marginTop: '0.2rem',
  },
  deleteWalletBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: 'var(--danger)',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.85rem',
    transition: 'var(--transition-fast)',
  },
  ledgerCard: {
    padding: '1.5rem',
  },
  ledgerTitle: {
    fontSize: '1.05rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '1rem',
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
    padding: '0.75rem 1rem',
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
  badge: (type, label) => ({
    padding: '0.2rem 0.5rem',
    borderRadius: '6px',
    fontSize: '0.7rem',
    fontWeight: 700,
    backgroundColor: label === 'LOAD' ? 'rgba(16, 185, 129, 0.1)' : type === 'INCOME' ? 'var(--success-glow)' : 'var(--danger-glow)',
    color: label === 'LOAD' ? 'var(--success)' : type === 'INCOME' ? 'var(--success)' : 'var(--danger)',
    border: `1px solid ${label === 'LOAD' ? 'rgba(16, 185, 129, 0.2)' : type === 'INCOME' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
  }),
  noTransactions: {
    padding: '3rem 1rem',
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
  },
  selectPromptCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '6rem 2rem',
    color: 'var(--text-muted)',
  },
  emptyState: {
    padding: '3rem 1.5rem',
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
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
  loadDirectionRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    margin: '0.5rem 0',
  },
  loadEntityCard: {
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: '1px solid var(--border-glass)',
    backgroundColor: 'rgba(255,255,255,0.01)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
  },
};

export default Wallets;
