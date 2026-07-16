import React, { useState, useEffect } from 'react';
import { 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  CartesianGrid
} from 'recharts';
import { 
  Percent,
  TrendingUp,
  DollarSign,
  Calendar,
  ArrowRight
} from 'lucide-react';

const CHART_COLORS = ['#10b981', '#06b6d4', '#4b5563'];

const InvestmentCalculator = () => {
  const [initialAmt, setInitialAmt] = useState(5000);
  const [monthlyContrib, setMonthlyContrib] = useState(200);
  const [rate, setRate] = useState(8);
  const [years, setYears] = useState(10);
  const [projectionData, setProjectionData] = useState([]);
  const [summary, setSummary] = useState({ endBalance: 0, totalInvested: 0, totalInterest: 0 });

  // Recalculate compound growth whenever inputs change
  useEffect(() => {
    let currentBalance = initialAmt;
    let totalInvested = initialAmt;
    const monthlyRate = (rate / 100) / 12;
    const data = [];

    for (let year = 1; year <= years; year++) {
      for (let month = 1; month <= 12; month++) {
        currentBalance = (currentBalance + monthlyContrib) * (1 + monthlyRate);
        totalInvested += monthlyContrib;
      }
      const interestEarned = currentBalance - totalInvested;
      data.push({
        year: `Year ${year}`,
        Balance: Math.round(currentBalance),
        Contributions: Math.round(totalInvested),
        Interest: Math.round(interestEarned)
      });
    }

    setProjectionData(data);
    setSummary({
      endBalance: currentBalance,
      totalInvested: totalInvested,
      totalInterest: currentBalance - totalInvested
    });
  }, [initialAmt, monthlyContrib, rate, years]);

  return (
    <div style={styles.container} className="fade-in">
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Investment Yield & Growth Calculator</h1>
          <p style={styles.subtitle}>Simulate compound interest projection and forecast long-term wealth portfolio growth</p>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div style={styles.layoutGrid}>
        {/* Left Side: Sliders Control Panel */}
        <div className="glass-card" style={styles.controlsCard}>
          <h3 style={styles.panelTitle}>Simulation Parameters</h3>

          <div style={styles.controlGroup}>
            <div style={styles.controlHeader}>
              <label style={styles.label}>Initial Principal ($)</label>
              <input 
                type="number" 
                value={initialAmt} 
                onChange={e => setInitialAmt(Math.max(0, parseInt(e.target.value) || 0))}
                style={styles.numInput}
              />
            </div>
            <input 
              type="range" 
              min="0" 
              max="100000" 
              step="500"
              value={initialAmt} 
              onChange={e => setInitialAmt(parseInt(e.target.value))}
              style={styles.slider}
            />
          </div>

          <div style={styles.controlGroup}>
            <div style={styles.controlHeader}>
              <label style={styles.label}>Monthly Contribution ($)</label>
              <input 
                type="number" 
                value={monthlyContrib} 
                onChange={e => setMonthlyContrib(Math.max(0, parseInt(e.target.value) || 0))}
                style={styles.numInput}
              />
            </div>
            <input 
              type="range" 
              min="0" 
              max="5000" 
              step="50"
              value={monthlyContrib} 
              onChange={e => setMonthlyContrib(parseInt(e.target.value))}
              style={styles.slider}
            />
          </div>

          <div style={styles.controlGroup}>
            <div style={styles.controlHeader}>
              <label style={styles.label}>Annual Expected Yield (%)</label>
              <input 
                type="number" 
                step="0.1"
                value={rate} 
                onChange={e => setRate(Math.max(0, parseFloat(e.target.value) || 0))}
                style={styles.numInput}
              />
            </div>
            <input 
              type="range" 
              min="1" 
              max="25" 
              step="0.5"
              value={rate} 
              onChange={e => setRate(parseFloat(e.target.value))}
              style={styles.slider}
            />
          </div>

          <div style={styles.controlGroup}>
            <div style={styles.controlHeader}>
              <label style={styles.label}>Investment Timeline (Years)</label>
              <input 
                type="number" 
                value={years} 
                onChange={e => setYears(Math.max(1, parseInt(e.target.value) || 1))}
                style={styles.numInput}
              />
            </div>
            <input 
              type="range" 
              min="1" 
              max="40" 
              step="1"
              value={years} 
              onChange={e => setYears(parseInt(e.target.value))}
              style={styles.slider}
            />
          </div>
        </div>

        {/* Right Side: Projections and Charts */}
        <div style={styles.resultsPanel}>
          {/* Stats Row */}
          <div style={styles.statsGrid}>
            <div className="glass-card" style={styles.statCard}>
              <p style={styles.statLabel}>Target End Balance</p>
              <h3 style={styles.statVal}>${Math.round(summary.endBalance).toLocaleString()}</h3>
            </div>
            <div className="glass-card" style={styles.statCard}>
              <p style={styles.statLabel}>Total Principal Savings</p>
              <h3 style={{...styles.statVal, color: 'var(--text-secondary)'}}>${Math.round(summary.totalInvested).toLocaleString()}</h3>
            </div>
            <div className="glass-card" style={styles.statCard}>
              <p style={styles.statLabel}>Total Compound Interest</p>
              <h3 style={{...styles.statVal, color: 'var(--accent-primary)'}}>${Math.round(summary.totalInterest).toLocaleString()}</h3>
            </div>
          </div>

          {/* Growth Chart */}
          <div className="glass-card" style={styles.chartCard}>
            <h3 style={styles.panelTitle}>Portfolio Valuation Path</h3>
            <div style={styles.chartWrap}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={projectionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="year" stroke="var(--text-muted)" fontSize={11} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickFormatter={val => `$${val.toLocaleString()}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-glass)', borderRadius: '8px' }}
                    labelStyle={{ color: 'var(--text-primary)' }}
                    formatter={val => [`$${val.toLocaleString()}`]}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  <Line type="monotone" dataKey="Balance" stroke={CHART_COLORS[0]} strokeWidth={3} activeDot={{ r: 6 }} name="Total Balance" />
                  <Line type="monotone" dataKey="Contributions" stroke={CHART_COLORS[1]} strokeWidth={2} name="Total Savings Principal" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Year-by-Year Details Ledger */}
      <div className="glass-card" style={styles.tableCard}>
        <h3 style={styles.panelTitle}>Year-by-Year Growth Table</h3>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Timeline</th>
                <th style={styles.th}>Total Savings Principal</th>
                <th style={styles.th}>Interest Earned</th>
                <th style={styles.th}>Total Value Balance</th>
              </tr>
            </thead>
            <tbody>
              {projectionData.map((row) => (
                <tr key={row.year} style={styles.tr}>
                  <td style={styles.td}>{row.year}</td>
                  <td style={styles.td}>${row.Contributions.toLocaleString()}</td>
                  <td style={{...styles.td, color: 'var(--accent-primary)', fontWeight: 600}}>${row.Interest.toLocaleString()}</td>
                  <td style={{...styles.td, fontWeight: 700}}>${row.Balance.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
  header: {
    marginBottom: '2rem',
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
  layoutGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: '1.5rem',
    marginBottom: '1.5rem',
  },
  controlsCard: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  panelTitle: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  controlGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  controlHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    fontWeight: 600,
  },
  numInput: {
    background: 'rgba(3, 7, 18, 0.4)',
    border: '1px solid var(--border-glass)',
    color: 'var(--text-primary)',
    padding: '0.4rem 0.60rem',
    borderRadius: '8px',
    fontFamily: 'var(--font-main)',
    fontSize: '0.85rem',
    outline: 'none',
    width: '100px',
    textAlign: 'right',
  },
  slider: {
    WebkitAppearance: 'none',
    width: '100%',
    height: '6px',
    borderRadius: '4px',
    background: 'rgba(255,255,255,0.06)',
    outline: 'none',
    cursor: 'pointer',
    margin: '10px 0',
  },
  resultsPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
  },
  statCard: {
    padding: '1.25rem',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  statVal: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: 'var(--success)',
    marginTop: '0.25rem',
    letterSpacing: '0.5px',
  },
  chartCard: {
    padding: '1.5rem',
    flex: 1,
  },
  chartWrap: {
    height: '280px',
    marginTop: '1rem',
  },
  tableCard: {
    padding: '1.5rem',
    marginBottom: '2rem',
  },
  tableWrap: {
    overflowX: 'auto',
    marginTop: '1rem',
    maxHeight: '350px',
    overflowY: 'auto',
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
    padding: '0.85rem 1rem',
    fontSize: '0.85rem',
    color: 'var(--text-primary)',
  },
};

// Handle mobile viewport scaling
const updateCalculatorLayout = () => {
  const width = window.innerWidth;
  if (width < 960) {
    styles.layoutGrid.gridTemplateColumns = '1fr';
    styles.statsGrid.gridTemplateColumns = '1fr';
  } else {
    styles.layoutGrid.gridTemplateColumns = '1fr 2fr';
    styles.statsGrid.gridTemplateColumns = 'repeat(3, 1fr)';
  }
};
window.addEventListener('resize', updateCalculatorLayout);
setTimeout(updateCalculatorLayout, 100);

export default InvestmentCalculator;
