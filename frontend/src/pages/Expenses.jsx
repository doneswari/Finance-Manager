import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { 
  Plus, 
  Trash2, 
  Calendar, 
  CreditCard, 
  RefreshCw, 
  CheckCircle, 
  Receipt, 
  DollarSign,
  Search,
  Tag
} from 'lucide-react';

const getCurrencySymbol = (currency) => {
  switch (currency?.toUpperCase()) {
    case 'INR': return '₹';
    case 'EUR': return '€';
    case 'GBP': return '£';
    default: return '$';
  }
};

const Expenses = () => {
  const [transactions, setTransactions] = useState([]);
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('daily'); // 'daily', 'bills', 'reimbursements'

  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Search/Filters for Daily Expenses
  const [searchTerm, setSearchTerm] = useState('');

  // Daily Expense Form State
  const [expDescription, setExpDescription] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState('');
  const [expCategoryId, setExpCategoryId] = useState('');
  const [expFromAccountId, setExpFromAccountId] = useState('');
  const [expIsReimbursable, setExpIsReimbursable] = useState(false);

  // Recurring Bill Form State
  const [billName, setBillName] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billNextDueDate, setBillNextDueDate] = useState('');
  const [billFrequency, setBillFrequency] = useState('MONTHLY');
  const [billCategoryId, setBillCategoryId] = useState('');
  const [billFromAccountId, setBillFromAccountId] = useState('');

  const primaryCurrency = accounts.find(a => a.currency === 'INR') ? 'INR' : (accounts[0]?.currency || 'INR');
  const currencySymbol = getCurrencySymbol(primaryCurrency);

  const getAccountCurrencySymbol = (accountId) => {
    const acc = accounts.find(a => a.id === accountId);
    return getCurrencySymbol(acc?.currency) || currencySymbol;
  };

  const fetchAllData = async () => {
    try {
      const [recRes, transRes, catRes, accRes] = await Promise.all([
        api.get('/recurring-expenses'),
        api.get('/transactions'),
        api.get('/categories'),
        api.get('/accounts')
      ]);

      setRecurringExpenses(recRes.data);
      setTransactions(transRes.data);
      setCategories(catRes.data);
      setAccounts(accRes.data);

      const expenseCats = catRes.data.filter(c => c.type === 'EXPENSE');
      if (expenseCats.length > 0) {
        setExpCategoryId(expenseCats[0].id);
        setBillCategoryId(expenseCats[0].id);
      }
      if (accRes.data.length > 0) {
        setExpFromAccountId(accRes.data[0].id);
        setBillFromAccountId(accRes.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load expense data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Handle logging a new daily expense
  const handleCreateExpense = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const payload = {
      description: expDescription,
      amount: parseFloat(expAmount),
      date: expDate ? new Date(expDate).toISOString() : new Date().toISOString(),
      type: 'EXPENSE',
      categoryId: parseInt(expCategoryId),
      fromAccountId: parseInt(expFromAccountId),
      isReimbursable: expIsReimbursable,
      reimbursementStatus: expIsReimbursable ? 'PENDING' : null
    };

    try {
      await api.post('/transactions', payload);
      setIsExpenseModalOpen(false);
      setExpDescription('');
      setExpAmount('');
      setExpDate('');
      setExpIsReimbursable(false);
      fetchAllData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to log expense');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle deleting a daily expense transaction
  const handleDeleteExpense = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense transaction? Account balance will be restored.')) {
      try {
        await api.delete(`/transactions/${id}`);
        fetchAllData();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete transaction');
      }
    }
  };

  // Handle creating a scheduled recurring bill
  const handleCreateBill = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const payload = {
      name: billName,
      amount: parseFloat(billAmount),
      nextDueDate: billNextDueDate,
      frequency: billFrequency,
      categoryId: parseInt(billCategoryId),
      fromAccountId: parseInt(billFromAccountId)
    };

    try {
      await api.post('/recurring-expenses', payload);
      setIsBillModalOpen(false);
      setBillName('');
      setBillAmount('');
      setBillNextDueDate('');
      setBillFrequency('MONTHLY');
      fetchAllData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule bill');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle deleting a scheduled bill
  const handleDeleteBill = async (id) => {
    if (window.confirm('Are you sure you want to remove this recurring bill?')) {
      try {
        await api.delete(`/recurring-expenses/${id}`);
        fetchAllData();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete recurring bill');
      }
    }
  };

  // Handle paying a bill
  const handlePayBill = async (id) => {
    try {
      await api.post(`/recurring-expenses/${id}/pay`);
      alert('Bill marked as paid! A corresponding expense transaction has been recorded, and the next due date was advanced.');
      fetchAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to pay bill');
    }
  };

  // Update reimbursement status on a transaction
  const handleUpdateReimbursementStatus = async (transaction, newStatus) => {
    try {
      const payload = {
        ...transaction,
        reimbursementStatus: newStatus
      };
      await api.put(`/transactions/${transaction.id}`, payload);
      fetchAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  // Calculations
  const dailyExpenses = transactions.filter(t => t.type === 'EXPENSE');

  const currentMonthExpenses = dailyExpenses.filter(t => {
    const d = new Date(t.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const totalSpentThisMonth = currentMonthExpenses.reduce((sum, t) => sum + t.amount, 0);

  const activeBillsTotalMonthly = recurringExpenses.reduce((sum, b) => {
    let monthlyEquivalent = b.amount;
    if (b.frequency === 'DAILY') monthlyEquivalent = b.amount * 30;
    else if (b.frequency === 'WEEKLY') monthlyEquivalent = b.amount * 4.3;
    else if (b.frequency === 'YEARLY') monthlyEquivalent = b.amount / 12;
    return sum + monthlyEquivalent;
  }, 0);

  const reimbursableTransactions = transactions.filter(t => t.isReimbursable);
  const pendingReimbursementsTotal = reimbursableTransactions
    .filter(t => t.reimbursementStatus !== 'REIMBURSED')
    .reduce((sum, t) => sum + t.amount, 0);

  // Filtering daily expenses list
  const filteredDailyExpenses = dailyExpenses.filter(t => {
    const matchesSearch = !searchTerm || 
      (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      t.categoryName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return <div style={styles.loading}>Loading Expense & Bills...</div>;
  }

  return (
    <div style={styles.container} className="fade-in">
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Expenses & Bills</h1>
          <p style={styles.subtitle}>Audit monthly spending logs, subscriptions, and reimbursable claims</p>
        </div>
        <div>
          {activeTab === 'daily' && (
            <button onClick={() => setIsExpenseModalOpen(true)} className="btn-primary" style={styles.addBtn}>
              <Plus size={18} />
              <span>Log Daily Expense</span>
            </button>
          )}
          {activeTab === 'bills' && (
            <button onClick={() => setIsBillModalOpen(true)} className="btn-primary" style={styles.addBtn}>
              <Plus size={18} />
              <span>Add Recurring Bill</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div style={styles.metricsGrid}>
        <div className="glass-card" style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <DollarSign size={22} color="var(--danger)" />
            <span style={styles.metricLabel}>Spent (Current Month)</span>
          </div>
          <span style={styles.metricValue}>{currencySymbol}{totalSpentThisMonth.toFixed(2)}</span>
          <span style={styles.metricMeta}>{currentMonthExpenses.length} expense entries recorded</span>
        </div>

        <div className="glass-card" style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <RefreshCw size={22} color="var(--accent-secondary)" />
            <span style={styles.metricLabel}>Monthly Subs Burden</span>
          </div>
          <span style={styles.metricValue}>{currencySymbol}{activeBillsTotalMonthly.toFixed(2)}/mo</span>
          <span style={styles.metricMeta}>{recurringExpenses.length} recurring schedules</span>
        </div>

        <div className="glass-card" style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <Receipt size={22} color="var(--accent-primary)" />
            <span style={styles.metricLabel}>Pending Claims</span>
          </div>
          <span style={styles.metricValue}>{currencySymbol}{pendingReimbursementsTotal.toFixed(2)}</span>
          <span style={styles.metricMeta}>
            {reimbursableTransactions.filter(t => t.reimbursementStatus !== 'REIMBURSED').length} open reimbursements
          </span>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div style={styles.tabBar}>
        <button 
          onClick={() => setActiveTab('daily')} 
          style={{ ...styles.tabBtn, ...(activeTab === 'daily' ? styles.tabBtnActive : {}) }}
        >
          Daily Expenses Log
        </button>
        <button 
          onClick={() => setActiveTab('bills')} 
          style={{ ...styles.tabBtn, ...(activeTab === 'bills' ? styles.tabBtnActive : {}) }}
        >
          Subscriptions & Recurring Bills
        </button>
        <button 
          onClick={() => setActiveTab('reimbursements')} 
          style={{ ...styles.tabBtn, ...(activeTab === 'reimbursements' ? styles.tabBtnActive : {}) }}
        >
          Reimbursement Claims
        </button>
      </div>

      {/* Tab 1: Daily Expenses Log */}
      {activeTab === 'daily' && (
        <div style={styles.tabContent}>
          {/* Filters */}
          <div className="glass-card" style={styles.filterCard}>
            <div style={styles.searchWrap}>
              <Search size={18} style={styles.searchIcon} />
              <input 
                type="text" 
                placeholder="Search by description or category..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="glass-input" 
                style={styles.searchInput}
              />
            </div>
          </div>

          {filteredDailyExpenses.length === 0 ? (
            <div className="glass-card" style={styles.emptyState}>
              <Receipt size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
              <h3>No expenses logged</h3>
              <p>Click "Log Daily Expense" to add your first day-to-day transaction.</p>
            </div>
          ) : (
            <div style={styles.expensesList}>
              {filteredDailyExpenses.map((t) => (
                <div key={t.id} className="glass-card" style={styles.expenseItem}>
                  <div style={styles.expenseMain}>
                    <div style={styles.expenseIcon}>
                      <DollarSign size={20} color="var(--danger)" />
                    </div>
                    <div>
                      <h4 style={styles.expenseDesc}>{t.description || 'General Expense'}</h4>
                      <div style={styles.expenseMeta}>
                        <span style={styles.metaBadge}>
                          <Tag size={12} style={{ marginRight: '4px' }} />
                          {t.categoryName}
                        </span>
                        <span style={styles.metaText}>
                          <CreditCard size={12} style={{ marginRight: '4px' }} />
                          {t.fromAccountName}
                        </span>
                        <span style={styles.metaText}>
                          <Calendar size={12} style={{ marginRight: '4px' }} />
                          {new Date(t.date).toLocaleDateString()}
                        </span>
                        {t.isReimbursable && (
                          <span style={styles.reimburseIndicator(t.reimbursementStatus)}>
                            Reimbursable ({t.reimbursementStatus})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={styles.expenseRight}>
                    <span style={styles.expenseAmount}>
                      -{getAccountCurrencySymbol(t.fromAccountId)}{t.amount.toFixed(2)}
                    </span>
                    <button onClick={() => handleDeleteExpense(t.id)} style={styles.deleteBtn} title="Delete expense">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Subscriptions & Recurring Bills */}
      {activeTab === 'bills' && (
        <div style={styles.tabContent}>
          {recurringExpenses.length === 0 ? (
            <div className="glass-card" style={styles.emptyState}>
              <Receipt size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
              <h3>No scheduled bills found</h3>
              <p>Add recurring subscriptions (e.g. Netflix, Rent, internet) to track upcoming due dates.</p>
            </div>
          ) : (
            <div style={styles.billsGrid}>
              {recurringExpenses.map((bill) => {
                const isOverdue = new Date(bill.nextDueDate) < new Date();
                return (
                  <div key={bill.id} className="glass-card" style={styles.billCard}>
                    <div style={styles.billHeader}>
                      <h4 style={styles.billName}>{bill.name}</h4>
                      <span style={styles.frequencyBadge(bill.frequency)}>{bill.frequency}</span>
                    </div>
                    
                    <div style={styles.billDetails}>
                      <div style={styles.detailRow}>
                        <CreditCard size={14} color="var(--text-secondary)" />
                        <span>Paid from: <strong>{bill.fromAccountName}</strong></span>
                      </div>
                      <div style={styles.detailRow}>
                        <Calendar size={14} color="var(--text-secondary)" />
                        <span>Next due: <strong style={{ color: isOverdue ? 'var(--danger)' : 'var(--text-primary)' }}>
                          {new Date(bill.nextDueDate).toLocaleDateString()} {isOverdue && '(Overdue)'}
                        </strong></span>
                      </div>
                      {bill.lastPaidDate && (
                        <div style={styles.detailRow}>
                          <CheckCircle size={14} color="var(--success)" />
                          <span>Last paid: <strong>{new Date(bill.lastPaidDate).toLocaleDateString()}</strong></span>
                        </div>
                      )}
                    </div>

                    <div style={styles.billFooter}>
                      <span style={styles.billAmount}>
                        {getAccountCurrencySymbol(bill.fromAccountId)}{bill.amount.toFixed(2)}
                      </span>
                      <div style={styles.billActions}>
                        <button 
                          onClick={() => handlePayBill(bill.id)} 
                          className="btn-primary" 
                          style={styles.payBtn}
                        >
                          Mark Paid
                        </button>
                        <button onClick={() => handleDeleteBill(bill.id)} style={styles.deleteBtn} title="Delete bill">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Reimbursements Tracker */}
      {activeTab === 'reimbursements' && (
        <div style={styles.tabContent}>
          <div className="glass-card" style={styles.tableCard}>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thRow}>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Description</th>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Account Paid From</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reimbursableTransactions.map((t) => (
                    <tr key={t.id} style={styles.tr}>
                      <td style={styles.td}>{new Date(t.date).toLocaleDateString()}</td>
                      <td style={styles.td}>{t.description}</td>
                      <td style={styles.td}>{t.categoryName}</td>
                      <td style={styles.td}>{t.fromAccountName}</td>
                      <td style={{ ...styles.td, fontWeight: 600 }}>
                        {getAccountCurrencySymbol(t.fromAccountId)}{t.amount.toFixed(2)}
                      </td>
                      <td style={styles.td}>
                        <span style={styles.statusBadge(t.reimbursementStatus)}>
                          {t.reimbursementStatus}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <select 
                          value={t.reimbursementStatus || 'PENDING'}
                          onChange={(e) => handleUpdateReimbursementStatus(t, e.target.value)}
                          className="glass-input"
                          style={styles.statusSelect}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="SUBMITTED">Submitted</option>
                          <option value="REIMBURSED">Reimbursed</option>
                        </select>
                      </td>
                    </tr>
                  ))}

                  {reimbursableTransactions.length === 0 && (
                    <tr>
                      <td colSpan="7" style={styles.noData}>
                        No reimbursable business expenses found. Mark transaction logs as "Reimbursable" to track claims.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Log Daily Expense */}
      <Modal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} title="Log Daily Expense">
        <form onSubmit={handleCreateExpense} style={styles.form}>
          {error && <div style={styles.errorAlert}>{error}</div>}

          <div style={styles.formGroup}>
            <label style={styles.label}>Expense Item / Description</label>
            <input 
              type="text" 
              value={expDescription} 
              onChange={(e) => setExpDescription(e.target.value)} 
              className="glass-input" 
              placeholder="e.g. Grocery shopping, Gas fill up, Dinner"
              required 
            />
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Amount</label>
              <input 
                type="number" 
                step="0.01"
                value={expAmount} 
                onChange={(e) => setExpAmount(e.target.value)} 
                className="glass-input" 
                placeholder="0.00"
                required 
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Date</label>
              <input 
                type="date" 
                value={expDate} 
                onChange={(e) => setExpDate(e.target.value)} 
                className="glass-input" 
              />
            </div>
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Expense Category</label>
              <select 
                value={expCategoryId} 
                onChange={(e) => setExpCategoryId(e.target.value)} 
                className="glass-input" 
                style={styles.select}
                required
              >
                {categories.filter(c => c.type === 'EXPENSE').map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Pay From Account</label>
              <select 
                value={expFromAccountId} 
                onChange={(e) => setExpFromAccountId(e.target.value)} 
                className="glass-input" 
                style={styles.select}
                required
              >
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({getCurrencySymbol(a.currency)}{a.balance.toFixed(2)})</option>
                ))}
              </select>
            </div>
          </div>

          <div style={styles.checkboxGroup}>
            <input 
              type="checkbox" 
              id="reimbursable"
              checked={expIsReimbursable} 
              onChange={(e) => setExpIsReimbursable(e.target.checked)} 
              style={styles.checkbox}
            />
            <label htmlFor="reimbursable" style={styles.checkboxLabel}>
              Mark as reimbursable (Business/Work Expense)
            </label>
          </div>

          <div style={styles.actions}>
            <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Logging...' : 'Record Expense'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Schedule New Bill / Subscription */}
      <Modal isOpen={isBillModalOpen} onClose={() => setIsBillModalOpen(false)} title="Schedule New Bill / Subscription">
        <form onSubmit={handleCreateBill} style={styles.form}>
          {error && <div style={styles.errorAlert}>{error}</div>}

          <div style={styles.formGroup}>
            <label style={styles.label}>Bill / Subscription Name</label>
            <input 
              type="text" 
              value={billName} 
              onChange={(e) => setBillName(e.target.value)} 
              className="glass-input" 
              placeholder="e.g. Netflix, Rent, Utility Bill"
              required 
            />
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Amount</label>
              <input 
                type="number" 
                step="0.01"
                value={billAmount} 
                onChange={(e) => setBillAmount(e.target.value)} 
                className="glass-input" 
                placeholder="0.00"
                required 
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Frequency</label>
              <select 
                value={billFrequency} 
                onChange={(e) => setBillFrequency(e.target.value)} 
                className="glass-input" 
                style={styles.select}
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>First / Next Due Date</label>
            <input 
              type="date" 
              value={billNextDueDate} 
              onChange={(e) => setBillNextDueDate(e.target.value)} 
              className="glass-input" 
              required 
            />
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Expense Category</label>
              <select 
                value={billCategoryId} 
                onChange={(e) => setBillCategoryId(e.target.value)} 
                className="glass-input" 
                style={styles.select}
                required
              >
                {categories.filter(c => c.type === 'EXPENSE').map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Pay From Account</label>
              <select 
                value={billFromAccountId} 
                onChange={(e) => setBillFromAccountId(e.target.value)} 
                className="glass-input" 
                style={styles.select}
                required
              >
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({getCurrencySymbol(a.currency)}{a.balance.toFixed(2)})</option>
                ))}
              </select>
            </div>
          </div>

          <div style={styles.actions}>
            <button type="button" onClick={() => setIsBillModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Scheduling...' : 'Schedule Bill'}
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
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2.5rem',
  },
  metricCard: {
    padding: '1.5rem',
  },
  metricHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.75rem',
  },
  metricLabel: {
    fontSize: '0.85rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
  },
  metricValue: {
    fontSize: '1.8rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    display: 'block',
    letterSpacing: '-0.5px',
  },
  metricMeta: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '0.4rem',
    display: 'block',
  },
  tabBar: {
    display: 'flex',
    borderBottom: '1px solid var(--border-glass)',
    marginBottom: '2rem',
    gap: '1.5rem',
  },
  tabBtn: {
    padding: '0.75rem 0.5rem',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
    position: 'relative',
    bottom: '-1px',
  },
  tabBtnActive: {
    color: 'var(--accent-primary)',
    borderBottom: '2px solid var(--accent-primary)',
  },
  tabContent: {
    width: '100%',
  },
  filterCard: {
    padding: '1rem',
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
  },
  searchWrap: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: '1rem',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
  },
  searchInput: {
    paddingLeft: '2.75rem',
    width: '100%',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 2rem',
    textAlign: 'center',
    color: 'var(--text-muted)',
  },
  expensesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginBottom: '2rem',
  },
  expenseItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1.25rem 1.5rem',
    transition: 'var(--transition-smooth)',
  },
  expenseMain: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  expenseIcon: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    background: 'rgba(239, 68, 68, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseDesc: {
    fontSize: '1.05rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  expenseMeta: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.85rem',
    marginTop: '0.35rem',
  },
  metaBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '0.75rem',
    color: 'var(--accent-primary)',
    background: 'rgba(16, 185, 129, 0.08)',
    padding: '0.2rem 0.5rem',
    borderRadius: '6px',
    fontWeight: 500,
  },
  metaText: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  reimburseIndicator: (status) => ({
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '0.7rem',
    fontWeight: 600,
    padding: '0.15rem 0.4rem',
    borderRadius: '4px',
    color: status === 'REIMBURSED' 
      ? 'var(--success)' 
      : status === 'SUBMITTED' 
      ? 'var(--warning)' 
      : 'var(--accent-secondary)',
    background: status === 'REIMBURSED' 
      ? 'rgba(16, 185, 129, 0.08)' 
      : status === 'SUBMITTED' 
      ? 'rgba(245, 158, 11, 0.08)' 
      : 'rgba(6, 182, 212, 0.08)',
  }),
  expenseRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  },
  expenseAmount: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--danger)',
    letterSpacing: '-0.3px',
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
  billsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  billCard: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '220px',
  },
  billHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1rem',
  },
  billName: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  frequencyBadge: (freq) => ({
    padding: '0.2rem 0.5rem',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    color: 'var(--accent-secondary)',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
  }),
  billDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
    marginBottom: '1.5rem',
  },
  detailRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  billFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTop: '1px solid var(--border-glass)',
    paddingTop: '1rem',
    marginTop: 'auto',
  },
  billAmount: {
    fontSize: '1.3rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  billActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  payBtn: {
    padding: '0.5rem 1rem',
    fontSize: '0.85rem',
    borderRadius: '8px',
  },
  tableCard: {
    padding: '1rem',
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
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tr: {
    borderBottom: '1px solid var(--border-glass)',
    transition: 'var(--transition-fast)',
  },
  td: {
    padding: '1rem',
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
    verticalAlign: 'middle',
  },
  noData: {
    padding: '3rem',
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '0.95rem',
  },
  statusBadge: (status) => ({
    display: 'inline-flex',
    padding: '0.25rem 0.5rem',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: status === 'REIMBURSED' 
      ? 'var(--success)' 
      : status === 'SUBMITTED' 
      ? 'var(--warning)' 
      : 'var(--accent-secondary)',
    backgroundColor: status === 'REIMBURSED' 
      ? 'rgba(16, 185, 129, 0.1)' 
      : status === 'SUBMITTED' 
      ? 'rgba(245, 158, 11, 0.1)' 
      : 'rgba(6, 182, 212, 0.1)',
  }),
  statusSelect: {
    padding: '0.35rem 0.75rem',
    fontSize: '0.85rem',
    borderRadius: '8px',
    maxWidth: '130px',
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
  checkboxGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '0.25rem',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
  },
  checkboxLabel: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    userSelect: 'none',
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

export default Expenses;
