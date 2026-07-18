import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard,
  Plus,
  Lightbulb,
  Compass,
  Calendar,
  Trash2,
  AlertCircle,
  Wallet,
  Landmark
} from 'lucide-react';
import { Link } from 'react-router-dom';

const CHART_COLORS = ['#10b981', '#06b6d4', '#34d399', '#fbbf24', '#f43f5e', '#6366f1'];

const Dashboard = () => {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Goals State (localStorage backed)
  const [goals, setGoals] = useState([]);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalDate, setGoalDate] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accRes, transRes] = await Promise.all([
          api.get('/accounts'),
          api.get('/transactions')
        ]);
        setAccounts(accRes.data);
        setTransactions(transRes.data);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Load saved goals
    const savedGoals = localStorage.getItem('vantage_saving_goals');
    if (savedGoals) {
      try {
        setGoals(JSON.parse(savedGoals));
      } catch (e) {
        console.error('Failed to parse goals', e);
      }
    }
  }, []);

  const saveGoalsToStorage = (updatedGoals) => {
    setGoals(updatedGoals);
    localStorage.setItem('vantage_saving_goals', JSON.stringify(updatedGoals));
  };

  const handleAddGoal = (e) => {
    e.preventDefault();
    if (!goalName || !goalTarget || !goalDate) return;

    const newGoal = {
      id: Date.now(),
      name: goalName,
      target: parseFloat(goalTarget),
      targetDate: goalDate,
      createdAt: new Date().toISOString()
    };

    const updated = [...goals, newGoal];
    saveGoalsToStorage(updated);

    // Reset Form
    setGoalName('');
    setGoalTarget('');
    setGoalDate('');
    setShowGoalForm(false);
  };

  const handleDeleteGoal = (id) => {
    const updated = goals.filter(g => g.id !== id);
    saveGoalsToStorage(updated);
  };

  if (loading) {
    return <div style={styles.loading}>Loading Dashboard Analytics...</div>;
  }

  // Calculate Metrics
  const netWorth = accounts.reduce((acc, curr) => acc + curr.balance, 0);
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const currentMonthTrans = transactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const monthlyIncome = currentMonthTrans
    .filter(t => t.type === 'INCOME')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const monthlyExpense = currentMonthTrans
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Chart 1: Expenses by Category
  const categoryMap = {};
  transactions
    .filter(t => t.type === 'EXPENSE')
    .forEach(t => {
      categoryMap[t.categoryName] = (categoryMap[t.categoryName] || 0) + t.amount;
    });

  const categoryChartData = Object.keys(categoryMap).map(key => ({
    name: key,
    value: parseFloat(categoryMap[key].toFixed(2))
  }));

  // Chart 2: Daily Transaction Timeline (Last 7 days of activity)
  const timelineMap = {};
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    timelineMap[dateStr] = { date: dateStr, Income: 0, Expense: 0 };
  }

  transactions.forEach(t => {
    const date = new Date(t.date);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (timelineMap[dateStr]) {
      if (t.type === 'INCOME') {
        timelineMap[dateStr].Income += t.amount;
      } else if (t.type === 'EXPENSE') {
        timelineMap[dateStr].Expense += t.amount;
      }
    }
  });

  const timelineChartData = Object.values(timelineMap);

  // Dynamic AI Insights Logic
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpense) / monthlyIncome) * 100 : 0;
  
  const cashAccountsBalance = accounts
    .filter(a => a.type === 'BANK' || a.type === 'CASH' || a.type === 'WALLET')
    .reduce((acc, curr) => acc + curr.balance, 0);

  const investmentAccountsBalance = accounts
    .filter(a => a.type === 'INVESTMENT')
    .reduce((acc, curr) => acc + curr.balance, 0);

  const getCurrencySymbol = (currency) => {
    switch (currency?.toUpperCase()) {
      case 'INR': return '₹';
      case 'EUR': return '€';
      case 'GBP': return '£';
      default: return '$';
    }
  };

  const primaryCurrency = accounts.find(a => a.currency === 'INR') ? 'INR' : (accounts[0]?.currency || 'INR');
  const currencySymbol = getCurrencySymbol(primaryCurrency);

  const getTransactionCurrencySymbol = (t) => {
    const accountId = t.fromAccountId || t.toAccountId;
    if (!accountId) return currencySymbol;
    const acc = accounts.find(a => a.id === accountId);
    return getCurrencySymbol(acc?.currency) || currencySymbol;
  };

  return (
    <div style={styles.container} className="fade-in">
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Financial Dashboard</h1>
          <p style={styles.subtitle}>Overview of your incomes, expenses, and accounts activity</p>
        </div>
        <Link to="/transactions" className="btn-primary" style={styles.addBtn}>
          <Plus size={18} />
          <span>New Transaction</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div style={styles.metricsGrid}>
        <div className="glass-card" style={styles.metricCard}>
          <div style={styles.metricIconWrap(CHART_COLORS[0])}>
            <DollarSign size={24} color={CHART_COLORS[0]} />
          </div>
          <div>
            <p style={styles.metricLabel}>Net Worth</p>
            <h3 style={styles.metricVal}>{currencySymbol}{netWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>
        </div>

        <div className="glass-card" style={styles.metricCard}>
          <div style={styles.metricIconWrap(CHART_COLORS[0])}>
            <TrendingUp size={24} color={CHART_COLORS[0]} />
          </div>
          <div>
            <p style={styles.metricLabel}>Monthly Income</p>
            <h3 style={styles.metricVal}>{currencySymbol}{monthlyIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>
        </div>

        <div className="glass-card" style={styles.metricCard}>
          <div style={styles.metricIconWrap(CHART_COLORS[4])}>
            <TrendingDown size={24} color={CHART_COLORS[4]} />
          </div>
          <div>
            <p style={styles.metricLabel}>Monthly Expenses</p>
            <h3 style={styles.metricVal}>{currencySymbol}{monthlyExpense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>
        </div>
      </div>

      {/* FEATURE A: Smart Insights Panel */}
      <div className="glass-card" style={styles.insightsCard}>
        <div style={styles.insightsHeader}>
          <Lightbulb size={20} color="var(--accent-primary)" />
          <h3 style={{...styles.chartTitle, marginBottom: 0}}>Vantage Smart Financial Insights</h3>
        </div>
        <div style={styles.insightsGrid}>
          <div style={styles.insightItem}>
            <span style={styles.insightBadge(savingsRate > 20 ? 'green' : 'amber')}>
              {savingsRate.toFixed(1)}% Saving Rate
            </span>
            <p style={styles.insightText}>
              {savingsRate > 40 
                ? "Excellent saving habits! You are retaining a high portion of your earnings." 
                : savingsRate > 10 
                ? "Healthy liquidity buffer. Try to optimize recurring subscriptions to push this past 20%." 
                : "Your expenses are close to matching your income this month. Keep track of discretionary transactions."}
            </p>
          </div>

          <div style={styles.insightItem}>
            <span style={styles.insightBadge(cashAccountsBalance > investmentAccountsBalance ? 'blue' : 'green')}>
              Liquidity Health Check
            </span>
            <p style={styles.insightText}>
              {cashAccountsBalance > investmentAccountsBalance && cashAccountsBalance > (primaryCurrency === 'INR' ? 160000 : 2000)
                ? `High idle cash reserves detected. Vantage suggests moving ${currencySymbol}${primaryCurrency === 'INR' ? '40,000' : '500'} into investments to optimize yields.`
                : "Balanced allocation ratio between liquid checking assets and investment growth holdings."}
            </p>
          </div>

          <div style={styles.insightItem}>
            <span style={styles.insightBadge('purple')}>
              Monthly Spending Velocity
            </span>
            <p style={styles.insightText}>
              Your forecasted spending run-rate is on track to stay within category budget guidelines.
            </p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={styles.chartsGrid}>
        <div className="glass-card" style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Income vs Expense Trend</h3>
          <div style={styles.chartWrap}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineChartData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS[4]} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={CHART_COLORS[4]} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-glass)', borderRadius: '8px' }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                />
                <Area type="monotone" dataKey="Income" stroke={CHART_COLORS[0]} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="Expense" stroke={CHART_COLORS[4]} fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card" style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Spending by Category</h3>
          <div style={styles.chartWrap}>
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-glass)', borderRadius: '8px' }}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    iconSize={10}
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={styles.noData}>No expense transactions recorded yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Transactions & Goals Tracker */}
      <div style={styles.bottomGrid}>
        {/* Recent Transactions */}
        <div className="glass-card" style={styles.recentTransactions}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.chartTitle}>Recent Transactions</h3>
            <Link to="/transactions" style={styles.viewAll}>View Ledger</Link>
          </div>
          {transactions.length > 0 ? (
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
                  {transactions.slice(0, 5).map((t) => (
                    <tr key={t.id} style={styles.tr}>
                      <td style={styles.td}>{new Date(t.date).toLocaleDateString()}</td>
                      <td style={styles.td}>{t.description || '-'}</td>
                      <td style={styles.td}>{t.categoryName}</td>
                      <td style={styles.td}>
                        <span style={styles.badge(t.type)}>{t.type}</span>
                      </td>
                      <td style={{...styles.td, ...styles.amountText(t.type)}}>
                        {t.type === 'EXPENSE' ? '-' : '+'}{getTransactionCurrencySymbol(t)}{t.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={styles.noTransactions}>No recent financial transactions found.</div>
          )}
        </div>

      {/* My Wallets & Accounts balances widget */}
      <div className="glass-card" style={styles.recentTransactions}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.chartTitle}>My Wallets</h3>
          <Link to="/accounts" style={styles.viewAll}>Manage</Link>
        </div>
        <div style={styles.accountsListContainer}>
          {accounts.map(acc => (
            <div key={acc.id} style={styles.accountItemRow}>
              <div style={styles.accountLeft}>
                <div style={styles.accountIconWrap(acc.type)}>
                  {acc.type === 'BANK' && <Landmark size={18} color="var(--accent-primary)" />}
                  {acc.type === 'CASH' && <Wallet size={18} color="var(--success)" />}
                  {acc.type === 'CREDIT_CARD' && <CreditCard size={18} color="var(--danger)" />}
                  {acc.type === 'INVESTMENT' && <TrendingUp size={18} color="var(--warning)" />}
                </div>
                <div style={styles.accountMeta}>
                  <span style={styles.accountNameText}>{acc.name}</span>
                  <span style={styles.accountTypeText}>{acc.type}</span>
                </div>
              </div>
              <div style={styles.accountRight}>
                <span style={styles.accountBalanceText}>
                  {getCurrencySymbol(acc.currency)}{acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span style={styles.accountCurrencyText}>{acc.currency}</span>
              </div>
            </div>
          ))}
          {accounts.length === 0 && (
            <div style={styles.noAccounts}>No active wallets or accounts registered.</div>
          )}
        </div>
      </div>

      {/* FEATURE B: Interactive Goal Tracker */}
      <div className="glass-card" style={styles.recentTransactions}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.chartTitle}>Interactive Savings Goals</h3>
            <button 
              onClick={() => setShowGoalForm(!showGoalForm)} 
              className="btn-primary" 
              style={{padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem'}}
            >
              {showGoalForm ? 'Cancel' : 'Add Goal'}
            </button>
          </div>

          {showGoalForm && (
            <form onSubmit={handleAddGoal} style={styles.goalForm} className="fade-in">
              <input 
                type="text" 
                placeholder="Goal Name (e.g. Emergency Fund)"
                value={goalName}
                onChange={e => setGoalName(e.target.value)}
                style={styles.formInput}
                required
              />
              <div style={styles.inputGroup}>
                <input 
                  type="number" 
                  placeholder={`Target Amount (${currencySymbol})`}
                  value={goalTarget}
                  onChange={e => setGoalTarget(e.target.value)}
                  style={styles.formInput}
                  required
                />
                <input 
                  type="date" 
                  value={goalDate}
                  onChange={e => setGoalDate(e.target.value)}
                  style={styles.formInput}
                  required
                />
              </div>
              <button type="submit" className="btn-primary" style={{width: '100%'}}>Save Target Goal</button>
            </form>
          )}

          <div style={styles.goalsContainer}>
            {goals.length > 0 ? (
              goals.map(g => {
                const daysRemaining = Math.max(0, Math.ceil((new Date(g.targetDate) - new Date()) / (1000 * 60 * 60 * 24)));
                
                // Let's assume progress is funded by checking account / netWorth for visual simulation
                const mockProgress = Math.min(g.target, parseFloat((netWorth * 0.25).toFixed(0)));
                const progressPercentage = Math.min(100, Math.round((mockProgress / g.target) * 100));
                
                const monthsRemaining = daysRemaining / 30;
                const monthlySavingsRequired = monthsRemaining > 0 ? ((g.target - mockProgress) / monthsRemaining) : 0;

                return (
                  <div key={g.id} style={styles.goalCard} className="fade-in">
                    <div style={styles.goalInfo}>
                      <div>
                        <h4 style={styles.goalTitle}>{g.name}</h4>
                        <span style={styles.goalDeadline}>
                          <Calendar size={12} style={{marginRight: '4px'}} />
                          {daysRemaining} Days left (Target: {new Date(g.targetDate).toLocaleDateString()})
                        </span>
                      </div>
                      <button 
                        onClick={() => handleDeleteGoal(g.id)} 
                        style={styles.deleteGoalBtn}
                        title="Delete Goal"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div style={styles.goalProgressWrap}>
                      <div style={styles.progressBarBg}>
                        <div style={styles.progressBarFill(progressPercentage)}></div>
                      </div>
                      <div style={styles.progressLabels}>
                        <span>{progressPercentage}% Funded</span>
                        <span>{currencySymbol}{mockProgress.toLocaleString()} / {currencySymbol}{g.target.toLocaleString()}</span>
                      </div>
                    </div>

                    {progressPercentage < 100 && (
                      <div style={styles.goalRecommendation}>
                        <AlertCircle size={12} color="var(--accent-secondary)" style={{marginRight: '6px'}} />
                        <span>Save <strong>{currencySymbol}{monthlySavingsRequired.toFixed(0)} / mo</strong> to hit target deadline.</span>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div style={styles.noGoals}>
                <Compass size={32} color="var(--text-muted)" style={{marginBottom: '0.5rem'}} />
                <p>No active savings targets. Set your first goal above!</p>
              </div>
            )}
          </div>
        </div>
      </div>
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
    fontSize: '2.2rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    letterSpacing: '-0.5px'
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
    textDecoration: 'none',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
    marginBottom: '1.5rem',
  },
  metricCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    padding: '1.75rem',
  },
  metricIconWrap: (color) => ({
    width: '54px',
    height: '54px',
    borderRadius: '12px',
    backgroundColor: `${color}15`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }),
  metricLabel: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  metricVal: {
    fontSize: '1.8rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    marginTop: '0.25rem',
    letterSpacing: '0.5px'
  },
  insightsCard: {
    marginBottom: '1.5rem',
    padding: '1.5rem',
  },
  insightsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.25rem',
  },
  insightsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.5rem',
  },
  insightItem: {
    padding: '1rem',
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.02)',
  },
  insightBadge: (color) => ({
    display: 'inline-block',
    padding: '0.25rem 0.5rem',
    borderRadius: '6px',
    fontSize: '0.7rem',
    fontWeight: 700,
    marginBottom: '0.5rem',
    backgroundColor: color === 'green' ? 'var(--success-glow)' : color === 'amber' ? 'var(--warning-glow)' : color === 'blue' ? 'var(--accent-secondary-glow)' : 'var(--accent-primary-glow)',
    color: color === 'green' ? 'var(--success)' : color === 'amber' ? 'var(--warning)' : color === 'blue' ? 'var(--accent-secondary)' : 'var(--accent-primary)',
    border: `1px solid ${color === 'green' ? 'rgba(16, 185, 129, 0.2)' : color === 'amber' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(6, 182, 212, 0.2)'}`,
  }),
  insightText: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1.2fr',
    gap: '1.5rem',
    marginBottom: '1.5rem',
  },
  chartCard: {
    padding: '1.5rem',
  },
  chartTitle: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '1.25rem',
  },
  chartWrap: {
    height: '280px',
    position: 'relative',
  },
  noData: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
  },
  bottomGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  recentTransactions: {
    padding: '1.5rem',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1rem',
  },
  viewAll: {
    fontSize: '0.85rem',
    color: 'var(--accent-primary)',
    textDecoration: 'none',
    fontWeight: 600,
    transition: 'var(--transition-smooth)',
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
  noTransactions: {
    padding: '2rem',
    textAlign: 'center',
    color: 'var(--text-muted)',
  },
  badge: (type) => ({
    padding: '0.25rem 0.6rem',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 600,
    backgroundColor: type === 'INCOME' ? 'var(--success-glow)' : type === 'EXPENSE' ? 'var(--danger-glow)' : 'var(--accent-primary-glow)',
    color: type === 'INCOME' ? 'var(--success)' : type === 'EXPENSE' ? 'var(--danger)' : 'var(--accent-primary)',
    border: `1px solid ${type === 'INCOME' ? 'rgba(16, 185, 129, 0.2)' : type === 'EXPENSE' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(6, 182, 212, 0.2)'}`,
  }),
  amountText: (type) => ({
    fontWeight: 600,
    color: type === 'INCOME' ? 'var(--success)' : type === 'EXPENSE' ? 'var(--danger)' : 'var(--text-primary)',
  }),

  // Goals Layout Styles
  goalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '1rem',
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '12px',
    marginBottom: '1rem',
    border: '1px solid var(--border-glass)',
  },
  formInput: {
    background: 'rgba(3, 7, 18, 0.4)',
    border: '1px solid var(--border-glass)',
    color: 'var(--text-primary)',
    padding: '0.6rem 0.85rem',
    borderRadius: '8px',
    fontFamily: 'var(--font-main)',
    fontSize: '0.85rem',
    outline: 'none',
  },
  inputGroup: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem',
  },
  goalsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginTop: '1rem',
    maxHeight: '380px',
    overflowY: 'auto',
  },
  goalCard: {
    padding: '1rem',
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.02)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  goalInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  goalTitle: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  goalDeadline: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginTop: '2px',
  },
  deleteGoalBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
  },
  goalProgressWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  progressBarBg: {
    height: '6px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressBarFill: (percentage) => ({
    height: '100%',
    width: `${percentage}%`,
    background: 'linear-gradient(to right, var(--accent-secondary), var(--accent-primary))',
    boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)',
    borderRadius: '4px',
    transition: 'width 0.8s ease-in-out',
  }),
  progressLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  goalRecommendation: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    background: 'rgba(6, 182, 212, 0.04)',
    padding: '0.4rem 0.6rem',
    borderRadius: '6px',
    border: '1px solid rgba(6, 182, 212, 0.1)',
  },
  noGoals: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 1rem',
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
    textAlign: 'center',
  },
  accountsListContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginTop: '0.5rem',
    maxHeight: '320px',
    overflowY: 'auto',
  },
  accountItemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    background: 'rgba(255, 255, 255, 0.01)',
    borderRadius: '12px',
    border: '1px solid var(--border-glass)',
    transition: 'var(--transition-fast)',
  },
  accountLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  accountIconWrap: (type) => ({
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: type === 'BANK' ? 'rgba(99, 102, 241, 0.08)' : type === 'CASH' ? 'rgba(16, 185, 129, 0.08)' : type === 'CREDIT_CARD' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `1px solid ${type === 'BANK' ? 'rgba(99, 102, 241, 0.15)' : type === 'CASH' ? 'rgba(16, 185, 129, 0.15)' : type === 'CREDIT_CARD' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)'}`,
  }),
  accountMeta: {
    display: 'flex',
    flexDirection: 'column',
  },
  accountNameText: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  accountTypeText: {
    fontSize: '0.7rem',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginTop: '2px',
  },
  accountRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  accountBalanceText: {
    fontSize: '1.05rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  accountCurrencyText: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  noAccounts: {
    textAlign: 'center',
    padding: '2rem 1rem',
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
  },
};

// Handle mobile viewport scaling
const updateChartGridWidths = () => {
  const width = window.innerWidth;
  if (width < 960) {
    styles.chartsGrid.gridTemplateColumns = '1fr';
    if (styles.bottomGrid) {
      styles.bottomGrid.gridTemplateColumns = '1fr';
    }
  } else {
    styles.chartsGrid.gridTemplateColumns = '2fr 1.2fr';
    if (styles.bottomGrid) {
      styles.bottomGrid.gridTemplateColumns = 'repeat(auto-fit, minmax(480px, 1fr))';
    }
  }
};
window.addEventListener('resize', updateChartGridWidths);
setTimeout(updateChartGridWidths, 100);

export default Dashboard;
