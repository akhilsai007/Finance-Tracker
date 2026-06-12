import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function OutstandingBalances() {
  const [rentals, setRentals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRentals()

    const channel = supabase
      .channel('outstanding_balances_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rental_income' },
        (payload) => {
          console.log('Real-time change (outstanding):', payload)
          fetchRentals()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchRentals() {
    try {
      const { data, error } = await supabase
        .from('rental_income')
        .select('*')
        .eq('paid', false)
        .order('due_date', { ascending: true })

      if (error) throw error
      setRentals(data || [])
    } catch (error) {
      alert('Error loading outstanding balances: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Mark a rental as paid directly from this page
  async function markAsPaid(id) {
    try {
      const { error } = await supabase
        .from('rental_income')
        .update({ paid: true, payment_date: new Date().toISOString().split('T')[0] })
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      alert('Error updating rental: ' + error.message)
    }
  }

  const totalOutstanding = rentals.reduce((sum, r) => sum + parseFloat(r.rent_amount || 0), 0)

  // Check if a rental is overdue (due date is in the past)
  function isOverdue(dueDate) {
    return new Date(dueDate) < new Date(new Date().toISOString().split('T')[0])
  }

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading...</div>
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
          ⚠️ Outstanding Balances
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>
          All unpaid rent across your properties
        </p>
      </div>

      {/* Summary Cards */}
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
            TOTAL OUTSTANDING
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#dc2626' }}>
            ₹{totalOutstanding.toLocaleString('en-IN')}
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
            UNPAID RENTALS
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#ea580c' }}>
            {rentals.length}
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
            OVERDUE
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#dc2626' }}>
            {rentals.filter(r => isOverdue(r.due_date)).length}
          </div>
        </div>
      </div>

      {/* Outstanding List */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>
          Unpaid Rentals
        </h2>

        {rentals.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            padding: '60px 40px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <p style={{ color: '#6b7280', fontSize: '16px' }}>
              All caught up! No outstanding balances.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'left' }}>Property</th>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'left' }}>Tenant</th>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'left' }}>Amount</th>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'left' }}>Due Date</th>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {rentals.map((rental) => {
                  const overdue = isOverdue(rental.due_date)
                  return (
                    <tr key={rental.id}>
                      <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#111827', fontWeight: '600' }}>
                        {rental.property_name}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}>
                        {rental.tenant_name}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '14px', color: '#dc2626', fontWeight: '700' }}>
                        ₹{parseFloat(rental.rent_amount).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}>
                        {new Date(rental.due_date).toLocaleDateString('en-IN')}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: overdue ? '#fee2e2' : '#fef3c7',
                          color: overdue ? '#991b1b' : '#92400e'
                        }}>
                          {overdue ? '🔴 Overdue' : '⏳ Pending'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                        <button
                          onClick={() => markAsPaid(rental.id)}
                          style={{
                            padding: '6px 14px',
                            backgroundColor: '#059669',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}
                        >
                          Mark Paid
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}