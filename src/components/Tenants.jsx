import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Tenants() {
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingTenant, setEditingTenant] = useState(null)
  const [formData, setFormData] = useState({
    tenant_name: '',
    phone: '',
    email: '',
    property_name: '',
    lease_start: '',
    lease_end: '',
    deposit_amount: '',
    notes: ''
  })

  useEffect(() => {
    fetchTenants()

    const channel = supabase
      .channel('tenants_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tenants' },
        (payload) => {
          console.log('Real-time change in tenants:', payload)
          fetchTenants()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchTenants() {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTenants(data || [])
    } catch (error) {
      alert('Error loading tenants: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('tenants')
        .insert([{
          tenant_name: formData.tenant_name,
          phone: formData.phone,
          email: formData.email,
          property_name: formData.property_name,
          lease_start: formData.lease_start || null,
          lease_end: formData.lease_end || null,
          deposit_amount: formData.deposit_amount ? parseFloat(formData.deposit_amount) : null,
          notes: formData.notes,
          user_id: user.id
        }])

      if (error) throw error

      setFormData({
        tenant_name: '',
        phone: '',
        email: '',
        property_name: '',
        lease_start: '',
        lease_end: '',
        deposit_amount: '',
        notes: ''
      })
      alert('Tenant added successfully!')
    } catch (error) {
      alert('Error adding tenant: ' + error.message)
    }
  }

  async function handleUpdate(e) {
    e.preventDefault()
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          tenant_name: editingTenant.tenant_name,
          phone: editingTenant.phone,
          email: editingTenant.email,
          property_name: editingTenant.property_name,
          lease_start: editingTenant.lease_start || null,
          lease_end: editingTenant.lease_end || null,
          deposit_amount: editingTenant.deposit_amount ? parseFloat(editingTenant.deposit_amount) : null,
          notes: editingTenant.notes
        })
        .eq('id', editingTenant.id)

      if (error) throw error
      setEditingTenant(null)
      alert('Tenant updated successfully!')
    } catch (error) {
      alert('Error updating tenant: ' + error.message)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this tenant?')) return
    try {
      const { error } = await supabase.from('tenants').delete().eq('id', id)
      if (error) throw error
    } catch (error) {
      alert('Error deleting tenant: ' + error.message)
    }
  }

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading...</div>
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
          👥 Tenants
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>
          Manage tenant records and lease details
        </p>
      </div>

      {/* Summary Card */}
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
            TOTAL TENANTS
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#2563eb' }}>
            {tenants.length}
          </div>
        </div>
      </div>

      {/* Add Tenant Form */}
      <form onSubmit={handleSubmit} style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        marginBottom: '32px'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>
          ➕ Add New Tenant
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
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
              style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>
              Phone
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="e.g., +91 98765 43210"
              style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="e.g., john@example.com"
              style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>
              Property
            </label>
            <input
              type="text"
              value={formData.property_name}
              onChange={(e) => setFormData({...formData, property_name: e.target.value})}
              placeholder="e.g., Main Street Apartment"
              style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>
              Lease Start
            </label>
            <input
              type="date"
              value={formData.lease_start}
              onChange={(e) => setFormData({...formData, lease_start: e.target.value})}
              style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>
              Lease End
            </label>
            <input
              type="date"
              value={formData.lease_end}
              onChange={(e) => setFormData({...formData, lease_end: e.target.value})}
              style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>
              Deposit Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.deposit_amount}
              onChange={(e) => setFormData({...formData, deposit_amount: e.target.value})}
              placeholder="0.00"
              style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
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
              style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
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
          Add Tenant
        </button>
      </form>

      {/* Tenants List */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>
          All Tenants
        </h2>

        {tenants.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            padding: '60px 40px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
            <p style={{ color: '#6b7280', fontSize: '16px' }}>
              No tenants yet. Add your first tenant above!
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
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'left' }}>Phone</th>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'left' }}>Property</th>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'left' }}>Lease Period</th>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'left' }}>Deposit</th>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant.id}>
                    {editingTenant?.id === tenant.id ? (
                      <td colSpan="6" style={{ padding: '20px', border: '1px solid #e5e7eb' }}>
                        <form onSubmit={handleUpdate} style={{ backgroundColor: '#fef3c7', padding: '20px', borderRadius: '8px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                            <input type="text" value={editingTenant.tenant_name} onChange={(e) => setEditingTenant({...editingTenant, tenant_name: e.target.value})} required placeholder="Name" style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }} />
                            <input type="text" value={editingTenant.phone || ''} onChange={(e) => setEditingTenant({...editingTenant, phone: e.target.value})} placeholder="Phone" style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }} />
                            <input type="email" value={editingTenant.email || ''} onChange={(e) => setEditingTenant({...editingTenant, email: e.target.value})} placeholder="Email" style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }} />
                            <input type="text" value={editingTenant.property_name || ''} onChange={(e) => setEditingTenant({...editingTenant, property_name: e.target.value})} placeholder="Property" style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }} />
                            <input type="date" value={editingTenant.lease_start || ''} onChange={(e) => setEditingTenant({...editingTenant, lease_start: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }} />
                            <input type="date" value={editingTenant.lease_end || ''} onChange={(e) => setEditingTenant({...editingTenant, lease_end: e.target.value})} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }} />
                            <input type="number" step="0.01" value={editingTenant.deposit_amount || ''} onChange={(e) => setEditingTenant({...editingTenant, deposit_amount: e.target.value})} placeholder="Deposit" style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }} />
                            <input type="text" value={editingTenant.notes || ''} onChange={(e) => setEditingTenant({...editingTenant, notes: e.target.value})} placeholder="Notes" style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }} />
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="submit" style={{ padding: '6px 16px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Save</button>
                            <button type="button" onClick={() => setEditingTenant(null)} style={{ padding: '6px 16px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Cancel</button>
                          </div>
                        </form>
                      </td>
                    ) : (
                      <>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#111827', fontWeight: '600' }}>{tenant.tenant_name}</td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}>{tenant.phone || '-'}</td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}>{tenant.property_name || '-'}</td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}>
                          {tenant.lease_start ? new Date(tenant.lease_start).toLocaleDateString('en-IN') : '-'}
                          {tenant.lease_end ? ' → ' + new Date(tenant.lease_end).toLocaleDateString('en-IN') : ''}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#059669', fontWeight: '600' }}>
                          {tenant.deposit_amount ? `₹${parseFloat(tenant.deposit_amount).toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button onClick={() => setEditingTenant(tenant)} style={{ padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Edit</button>
                            <button onClick={() => handleDelete(tenant.id)} style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Delete</button>
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