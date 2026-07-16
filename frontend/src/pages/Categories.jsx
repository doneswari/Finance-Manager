import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Trash2, Lock, Tag } from 'lucide-react';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState('EXPENSE');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to load categories', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.post('/categories', {
        name,
        type,
        isDefault: false
      });
      setSuccess(`Custom category "${name}" added successfully!`);
      setName('');
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create category');
    }
  };

  const handleDelete = async (id, catName) => {
    if (window.confirm(`Are you sure you want to delete the custom category "${catName}"?`)) {
      try {
        await api.delete(`/categories/${id}`);
        fetchCategories();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete category');
      }
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading Category Manager...</div>;
  }

  const expenseCategories = categories.filter(c => c.type === 'EXPENSE');
  const incomeCategories = categories.filter(c => c.type === 'INCOME');

  return (
    <div style={styles.container} className="fade-in">
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Category Manager</h1>
          <p style={styles.subtitle}>Configure custom categories to classify your income streams and expense logs</p>
        </div>
      </div>

      <div style={styles.layoutGrid}>
        {/* Left Column: Create Form */}
        <div className="glass-card" style={styles.formCard}>
          <h3 style={styles.sectionTitle}>Add Custom Category</h3>
          <form onSubmit={handleSubmit} style={styles.form}>
            {error && <div style={styles.errorAlert}>{error}</div>}
            {success && <div style={styles.successAlert}>{success}</div>}

            <div style={styles.formGroup}>
              <label style={styles.label}>Category Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="glass-input" 
                placeholder="e.g. Subscriptions, Coffee, Gym"
                required 
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Category Flow Type</label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value)} 
                className="glass-input" 
                style={styles.select}
              >
                <option value="EXPENSE">Expense Category</option>
                <option value="INCOME">Income Category</option>
              </select>
            </div>

            <button type="submit" className="btn-primary" style={styles.submitBtn}>
              <Plus size={16} style={{ marginRight: '6px' }} />
              Create Category
            </button>
          </form>
        </div>

        {/* Right Column: Categories List */}
        <div style={styles.listsContainer}>
          <div className="glass-card" style={styles.listCard}>
            <h3 style={styles.sectionTitle}>Expense Categories ({expenseCategories.length})</h3>
            <div style={styles.badgeGrid}>
              {expenseCategories.map((c) => (
                <div key={c.id} style={styles.badgeItem(c.isDefault)}>
                  <div style={styles.badgeLabel}>
                    <Tag size={12} style={{ marginRight: '6px', opacity: 0.6 }} />
                    <span>{c.name}</span>
                  </div>
                  {c.isDefault ? (
                    <Lock size={12} style={styles.lockIcon} title="System Default Category" />
                  ) : (
                    <button onClick={() => handleDelete(c.id, c.name)} style={styles.deleteBtn}>
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card" style={styles.listCard}>
            <h3 style={styles.sectionTitle}>Income Categories ({incomeCategories.length})</h3>
            <div style={styles.badgeGrid}>
              {incomeCategories.map((c) => (
                <div key={c.id} style={styles.badgeItem(c.isDefault)}>
                  <div style={styles.badgeLabel}>
                    <Tag size={12} style={{ marginRight: '6px', opacity: 0.6 }} />
                    <span>{c.name}</span>
                  </div>
                  {c.isDefault ? (
                    <Lock size={12} style={styles.lockIcon} title="System Default Category" />
                  ) : (
                    <button onClick={() => handleDelete(c.id, c.name)} style={styles.deleteBtn}>
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
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
    marginBottom: '2rem',
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
  layoutGrid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 2fr',
    gap: '1.5rem',
    alignItems: 'start',
  },
  formCard: {
    padding: '1.75rem',
  },
  sectionTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '1.25rem',
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '0.5rem',
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
  submitBtn: {
    marginTop: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  listCard: {
    padding: '1.5rem',
  },
  badgeGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  badgeItem: (isDefault) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.5rem 0.85rem',
    borderRadius: '10px',
    backgroundColor: isDefault ? 'rgba(255, 255, 255, 0.03)' : 'rgba(99, 102, 241, 0.08)',
    border: `1px solid ${isDefault ? 'var(--border-glass)' : 'rgba(99, 102, 241, 0.2)'}`,
    fontSize: '0.9rem',
    fontWeight: 500,
    color: isDefault ? 'var(--text-secondary)' : 'var(--text-primary)',
    minWidth: '120px',
    transition: 'var(--transition-fast)',
  }),
  badgeLabel: {
    display: 'flex',
    alignItems: 'center',
  },
  lockIcon: {
    color: 'var(--text-muted)',
    marginLeft: '8px',
  },
  deleteBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '2px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: '8px',
    transition: 'var(--transition-fast)',
  },
  errorAlert: {
    padding: '0.75rem 1rem',
    background: 'var(--danger-glow)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: 'var(--danger)',
    borderRadius: '8px',
    fontSize: '0.85rem',
  },
  successAlert: {
    padding: '0.75rem 1rem',
    background: 'var(--success-glow)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: 'var(--success)',
    borderRadius: '8px',
    fontSize: '0.85rem',
  },
};

// Handle mobile viewport scaling
const updateGridWidths = () => {
  const width = window.innerWidth;
  if (width < 850) {
    styles.layoutGrid.gridTemplateColumns = '1fr';
  } else {
    styles.layoutGrid.gridTemplateColumns = '1.2fr 2fr';
  }
};
window.addEventListener('resize', updateGridWidths);
updateGridWidths();

export default Categories;
