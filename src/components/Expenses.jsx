import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingExpense, setEditingExpense] = useState(null)
  const [expandedGroups, setExpandedGroups] = useState({})
  const [dateFilter, setDateFilter] = useState('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '',
    amount: '',
    notes: '',
    group_name: ''
  })

  // Fetch expenses and set up real-time subscription
  useEffect(() => {
    fetchExpenses()

    const channel = supabase
      .channel('expenses_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses'
        },
        (payload) => {
          console.log('Real-time change detected:', payload)
          fetchExpenses()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchExpenses() {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false })
      
      if (error) throw error
      
      setExpenses(data || [])
      const uniqueGroups = [...new Set(data?.map(e => e.group_name).filter(Boolean))]
      setGroups(uniqueGroups)
    } catch (error) {
      alert('Error loading expenses: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase
        .from('expenses')
        .insert([{
          date: formData.date,
          category: formData.category,
          amount: parseFloat(formData.amount),
          notes: formData.notes,
          group_name: formData.group_name,
          user_id: user.id
        }])
      
      if (error) throw error
      
      setFormData({
        date: new Date().toISOString().split('T')[0],
        category: '',
        amount: '',
        notes: '',
        group_name: ''
      })
    } catch (error) {
      alert('Error adding expense: ' + error.message)
    }
  }

  async function handleUpdate(e) {
    e.preventDefault()
    
    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          date: editingExpense.date,
          category: editingExpense.category,
          amount: parseFloat(editingExpense.amount),
          notes: editingExpense.notes,
          group_name: editingExpense.group_name
        })
        .eq('id', editingExpense.id)
      
      if (error) throw error
      
      setEditingExpense(null)
    } catch (error) {
      alert('Error updating expense: ' + error.message)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this expense?')) return
    
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    } catch (error) {
      alert('Error deleting expense: ' + error.message)
    }
  }

  function getFilteredExpenses() {
    const now = new Date()
    let startDate = null
    
    switch(dateFilter) {
      case 'last7':
        startDate = new Date(now.setDate(now.getDate() - 7))
        break
      case 'last30':
        startDate = new Date(now.setDate(now.getDate() - 30))
        break
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const endDate = new Date(now.getFullYear(), now.getMonth(), 0)
        return expenses.filter(e => new Date(e.date) >= startDate && new Date(e.date) <= endDate)
      case 'custom':
        if (customStartDate && customEndDate) {
          return expenses.filter(e => 
            new Date(e.date) >= new Date(customStartDate) && 
            new Date(e.date) <= new Date(customEndDate)
          )
        }
        return expenses
      default:
        return expenses
    }
    
    return startDate ? expenses.filter(e => new Date(e.date) >= startDate) : expenses
  }

  function groupExpensesByGroupAndMonth(expenses) {
    const grouped = {}
    
    expenses.forEach(expense => {
      const groupName = expense.group_name || 'Uncategorized'
      const date = new Date(expense.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!grouped[groupName]) {
        grouped[groupName] = {}
      }
      if (!grouped[groupName][monthKey]) {
        grouped[groupName][monthKey] = []
      }
      grouped[groupName][monthKey].push(expense)
    })
    
    return grouped
  }

  function calculateAnalytics(expenses) {
    const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0)
    const count = expenses.length
    
    const groupTotals = {}
    expenses.forEach(e => {
      const group = e.group_name || 'Uncategorized'
      groupTotals[group] = (groupTotals[group] || 0) + parseFloat(e.amount)
    })
    
    const sortedGroups = Object.entries(groupTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
    
    const oldestDate = expenses.length > 0 ? new Date(Math.min(...expenses.map(e => new Date(e.date)))) : new Date()
    const newestDate = expenses.length > 0 ? new Date(Math.max(...expenses.map(e => new Date(e.date)))) : new Date()
    const daysDiff = Math.max(1, Math.ceil((newestDate - oldestDate) / (1000 * 60 * 60 * 24)))
    const avgPerDay = total / daysDiff
    
    return { total, count, avgPerDay, topGroups: sortedGroups, groupTotals }
  }

  const filteredExpenses = getFilteredExpenses()
  const groupedExpenses = groupExpensesByGroupAndMonth(filteredExpenses)
  const analytics = calculateAnalytics(filteredExpenses)

  if (loading) return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
      Loading...
    </div>
  )

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
          💸 Daily Expenses
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>
          Track and manage your daily spending
        </p>
      </div>

      {/* Analytics Dashboard */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600', marginBottom: '8px' }}>
            TOTAL SPENT
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#2563eb' }}>
            ₹{analytics.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600', marginBottom: '8px' }}>
            TOTAL EXPENSES
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#059669' }}>
            {analytics.count}
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600', marginBottom: '8px' }}>
            AVG PER DAY
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#dc2626' }}>
            ₹{analytics.avgPerDay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Date Filter */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        marginBottom: '32px'
      }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>
          📅 Filter by Date Range
        </h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {['all', 'last7', 'last30', 'thisMonth', 'lastMonth', 'custom'].map(filter => (
            <button
              key={filter}
              onClick={() => setDateFilter(filter)}
              style={{
                padding: '8px 16px',
                backgroundColor: dateFilter === filter ? '#2563eb' : '#f3f4f6',
                color: dateFilter === filter ? 'white' : '#374151',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '13px',
                transition: 'all 0.2s'
              }}
            >
              {filter === 'all' && 'All Time'}
              {filter === 'last7' && 'Last 7 Days'}
              {filter === 'last30' && 'Last 30 Days'}
              {filter === 'thisMonth' && 'This Month'}
              {filter === 'lastMonth' && 'Last Month'}
              {filter === 'custom' && 'Custom Range'}
            </button>
          ))}
          
          {dateFilter === 'custom' && (
            <>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '13px'
                }}
              />
              <span style={{ color: '#6b7280' }}>to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '13px'
                }}
              />
            </>
          )}
        </div>
      </div>

      {/* Add Expense Form */}
      <form onSubmit={handleSubmit} style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        marginBottom: '32px'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>
          ➕ Add New Expense
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>
              Group/Category
            </label>
            <input
              type="text"
              list="groups"
              value={formData.group_name}
              onChange={(e) => setFormData({...formData, group_name: e.target.value})}
              placeholder="Enter or select group"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
            <datalist id="groups">
              {groups.map(group => (
                <option key={group} value={group} />
              ))}
            </datalist>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>
              Sub-Category
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              placeholder="e.g., Groceries, Fuel"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>
              Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              required
              placeholder="0.00"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>
              Notes
            </label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Optional notes..."
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          style={{
            marginTop: '20px',
            padding: '10px 24px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
        >
          Add Expense
        </button>
      </form>

      {/* Expenses List by Group */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>
          All Expenses {filteredExpenses.length > 0 && `(${filteredExpenses.length})`}
        </h2>

        {Object.keys(groupedExpenses).length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            padding: '60px 40px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
            <p style={{ color: '#6b7280', fontSize: '16px' }}>
              No expenses yet. Add your first expense above!
            </p>
          </div>
        ) : (
          Object.entries(groupedExpenses).map(([groupName, months]) => {
            const groupTotal = Object.values(months).flat().reduce((sum, e) => sum + parseFloat(e.amount), 0)
            const groupCount = Object.values(months).flat().length
            const isExpanded = expandedGroups[groupName]

            return (
              <div key={groupName} style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                marginBottom: '16px',
                overflow: 'hidden',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
              }}>
                {/* Group Header */}
                <div
                  onClick={() => setExpandedGroups({...expandedGroups, [groupName]: !isExpanded})}
                  style={{
                    padding: '20px 24px',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'white', marginBottom: '4px' }}>
                      {groupName}
                    </h3>
                    <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.9)' }}>
                      {groupCount} expense{groupCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: 'white' }}>
                      ₹{groupTotal.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.9)' }}>
                      {isExpanded ? '▼ Hide' : '▶ Show'}
                    </div>
                  </div>
                </div>

                {/* Group Content */}
                {isExpanded && (
                  <div style={{ padding: '0' }}>
                    {Object.entries(months).sort(([a], [b]) => b.localeCompare(a)).map(([monthKey, monthExpenses]) => {
                      const monthTotal = monthExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0)
                      const monthName = new Date(monthKey + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

                      return (
                        <div key={monthKey} style={{ borderTop: '1px solid #e5e7eb' }}>
                          <div style={{
                            padding: '16px 24px',
                            backgroundColor: '#f9fafb',
                            fontWeight: '600',
                            fontSize: '14px',
                            color: '#374151',
                            display: 'flex',
                            justifyContent: 'space-between'
                          }}>
                            <span>{monthName}</span>
                            <span>₹{monthTotal.toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            {monthExpenses.map(expense => (
                              <div key={expense.id}>
                                {editingExpense?.id === expense.id ? (
                                  <form onSubmit={handleUpdate} style={{
                                    padding: '16px 24px',
                                    backgroundColor: '#fef3c7',
                                    borderTop: '1px solid #fcd34d'
                                  }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                                      <input
                                        type="date"
                                        value={editingExpense.date}
                                        onChange={(e) => setEditingExpense({...editingExpense, date: e.target.value})}
                                        style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }}
                                      />
                                      <input
                                        type="text"
                                        value={editingExpense.category || ''}
                                        onChange={(e) => setEditingExpense({...editingExpense, category: e.target.value})}
                                        placeholder="Category"
                                        style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }}
                                      />
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={editingExpense.amount}
                                        onChange={(e) => setEditingExpense({...editingExpense, amount: e.target.value})}
                                        required
                                        style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }}
                                      />
                                      <input
                                        type="text"
                                        value={editingExpense.notes || ''}
                                        onChange={(e) => setEditingExpense({...editingExpense, notes: e.target.value})}
                                        placeholder="Notes"
                                        style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }}
                                      />
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                      <button type="submit" style={{
                                        padding: '6px 16px',
                                        backgroundColor: '#059669',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: '600'
                                      }}>
                                        Save
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingExpense(null)}
                                        style={{
                                          padding: '6px 16px',
                                          backgroundColor: '#6b7280',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '6px',
                                          cursor: 'pointer',
                                          fontSize: '13px',
                                          fontWeight: '600'
                                        }}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </form>
                                ) : (
                                  <div style={{
                                    padding: '16px 24px',
                                    borderTop: '1px solid #e5e7eb',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                                          {new Date(expense.date).toLocaleDateString('en-IN')}
                                        </span>
                                        {expense.category && (
                                          <span style={{
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            color: '#2563eb',
                                            backgroundColor: '#dbeafe',
                                            padding: '2px 8px',
                                            borderRadius: '4px'
                                          }}>
                                            {expense.category}
                                          </span>
                                        )}
                                      </div>
                                      {expense.notes && (
                                        <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                                          {expense.notes}
                                        </p>
                                      )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                      <span style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>
                                        ₹{parseFloat(expense.amount).toLocaleString('en-IN')}
                                      </span>
                                      <button
                                        onClick={() => setEditingExpense(expense)}
                                        style={{
                                          padding: '6px 12px',
                                          backgroundColor: '#3b82f6',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '6px',
                                          cursor: 'pointer',
                                          fontSize: '12px',
                                          fontWeight: '600'
                                        }}
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDelete(expense.id)}
                                        style={{
                                          padding: '6px 12px',
                                          backgroundColor: '#ef4444',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '6px',
                                          cursor: 'pointer',
                                          fontSize: '12px',
                                          fontWeight: '600'
                                        }}
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}