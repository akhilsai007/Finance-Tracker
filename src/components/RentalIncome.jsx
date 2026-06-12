import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function RentalIncome() {
  const [rentals, setRentals] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingRental, setEditingRental] = useState(null)
  const [formData, setFormData] = useState({
    property_name: '',
    tenant_name: '',
    rent_amount: '',
    due_date: '',
    paid: false,
    payment_date: '',
    notes: ''
  })

  // Fetch rentals and set up real-time subscription
  useEffect(() => {
    fetchRentals()

    const channel = supabase
      .channel('rental_income_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rental_income'
        },
        (payload) => {
          console.log('Real-time change detected in rental_income:', payload)
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
        .order('due_date', { ascending: false })
      
      if (error) throw error
      setRentals(data || [])
    } catch (error) {
      alert('Error loading rental income: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('rental_income')
        .insert([{
          property_name: formData.property_name,
          tenant_name: formData.tenant_name,
          rent_amount: parseFloat(formData.rent_amount),
          due_date: formData.due_date,
          paid: formData.paid,
          payment_date: formData.payment_date || null,
          notes: formData.notes,
          user_id: user.id
        }])
      
      if (error) throw error
      
      setFormData({
        property_name: '',
        tenant_name: '',
        rent_amount: '',
        due_date: '',
        paid: false,
        payment_date: '',
        notes: ''
      })
      
      alert('Rental income added successfully!')
    } catch (error) {
      alert('Error adding rental income: ' + error.message)
    }
  }

  async function handleUpdate(e) {
    e.preventDefault()
    
    try {
      const { error } = await supabase
        .from('rental_income')
        .update({
          property_name: editingRental.property_name,
          tenant_name: editingRental.tenant_name,
          rent_amount: parseFloat(editingRental.rent_amount),
          due_date: editingRental.due_date,
          paid: editingRental.paid,
          payment_date: editingRental.payment_date || null,
          notes: editingRental.notes
        })
        .eq('id', editingRental.id)
      
      if (error) throw error
      
      setEditingRental(null)
      alert('Rental income updated successfully!')
    } catch (error) {
      alert('Error updating rental income: ' + error.message)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this rental income?')) return
    
    try {
      const { error } = await supabase
        .from('rental_income')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    } catch (error) {
      alert('Error deleting rental income: ' + error.message)
    }
  }

  // Calculate totals
  const totalRent = rentals.reduce((sum, r) => sum + parseFloat(r.rent_amount || 0), 0)
  const paidRent = rentals.filter(r => r.paid).reduce((sum, r) => sum + parseFloat(r.rent_amount || 0), 0)
  const unpaidRent = rentals.filter(r => !r.paid).reduce((sum, r) => sum + parseFloat(r.rent_amount || 0), 0)
  const unpaidCount = rentals.filter(r => !r.paid).length

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
        Loading...
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
          🏠 Rental Income
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>
          Track rental payments from your properties
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
            TOTAL RENTAL INCOME
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#2563eb' }}>
            ₹{totalRent.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
            {rentals.length} rental{rentals.length !== 1 ? 's' : ''}
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
            PAID
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#059669' }}>
            ₹{paidRent.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
            {rentals.filter(r => r.paid).length} payment{rentals.filter(r => r.paid).length !== 1 ? 's' : ''}
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
            UNPAID
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#dc2626' }}>
            ₹{unpaidRent.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
            {unpaidCount} pending
          </div>
        </div>
      </div>

      {/* Add Rental Form */}
      <form onSubmit={handleSubmit} style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        marginBottom: '32px'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>
          ➕ Add New Rental Income
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>
              Property Name *
            </label>
            <input
              type="text"
              value={formData.property_name}
              onChange={(e) => setFormData({...formData, property_name: e.target.value})}
              required
              placeholder="e.g., Main Street Apartment"
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
              Tenant Name *
            </label>
            <input
              type="text"
              value={formData.tenant_name}
              onChange={(e) => setFormData({...formData, tenant_name: e.target.value})}
              required
              placeholder="e.g., John Doe"
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
              Rent Amount (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.rent_amount}
              onChange={(e) => setFormData({...formData, rent_amount: e.target.value})}
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

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>
              Due Date *
            </label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({...formData, due_date: e.target.value})}
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
              Payment Date
            </label>
            <input
              type="date"
              value={formData.payment_date}
              onChange={(e) => setFormData({...formData, payment_date: e.target.value})}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              padding: '10px 12px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '2px solid #e5e7eb'
            }}>
              <input
                type="checkbox"
                checked={formData.paid}
                onChange={(e) => setFormData({...formData, paid: e.target.checked})}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                Paid
              </span>
            </label>
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
          Add Rental Income
        </button>
      </form>

      {/* Rentals List */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>
          All Rental Income
        </h2>

        {rentals.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            padding: '60px 40px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏠</div>
            <p style={{ color: '#6b7280', fontSize: '16px' }}>
              No rental income yet. Add your first rental above!
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
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'left' }}>Payment Date</th>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rentals.map((rental) => (
                  <tr key={rental.id}>
                    {editingRental?.id === rental.id ? (
                      // Edit Mode
                      <td colSpan="7" style={{ padding: '20px', border: '1px solid #e5e7eb' }}>
                        <form onSubmit={handleUpdate} style={{ backgroundColor: '#fef3c7', padding: '20px', borderRadius: '8px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                            <input
                              type="text"
                              value={editingRental.property_name}
                              onChange={(e) => setEditingRental({...editingRental, property_name: e.target.value})}
                              required
                              placeholder="Property"
                              style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }}
                            />
                            <input
                              type="text"
                              value={editingRental.tenant_name}
                              onChange={(e) => setEditingRental({...editingRental, tenant_name: e.target.value})}
                              required
                              placeholder="Tenant"
                              style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }}
                            />
                            <input
                              type="number"
                              step="0.01"
                              value={editingRental.rent_amount}
                              onChange={(e) => setEditingRental({...editingRental, rent_amount: e.target.value})}
                              required
                              placeholder="Amount"
                              style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }}
                            />
                            <input
                              type="date"
                              value={editingRental.due_date}
                              onChange={(e) => setEditingRental({...editingRental, due_date: e.target.value})}
                              required
                              style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }}
                            />
                            <input
                              type="date"
                              value={editingRental.payment_date || ''}
                              onChange={(e) => setEditingRental({...editingRental, payment_date: e.target.value})}
                              placeholder="Payment Date"
                              style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }}
                            />
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px' }}>
                              <input
                                type="checkbox"
                                checked={editingRental.paid}
                                onChange={(e) => setEditingRental({...editingRental, paid: e.target.checked})}
                                style={{ width: '16px', height: '16px' }}
                              />
                              <span style={{ fontSize: '13px' }}>Paid</span>
                            </label>
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
                              onClick={() => setEditingRental(null)}
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
                      </td>
                    ) : (
                      // Display Mode
                      <>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#111827', fontWeight: '600' }}>
                          {rental.property_name}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}>
                          {rental.tenant_name}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '14px', color: '#059669', fontWeight: '700' }}>
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
                            backgroundColor: rental.paid ? '#d1fae5' : '#fee2e2',
                            color: rental.paid ? '#065f46' : '#991b1b'
                          }}>
                            {rental.paid ? '✓ Paid' : '⏳ Pending'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}>
                          {rental.payment_date ? new Date(rental.payment_date).toLocaleDateString('en-IN') : '-'}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              onClick={() => setEditingRental(rental)}
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
                              onClick={() => handleDelete(rental.id)}
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
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}