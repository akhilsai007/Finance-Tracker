import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function RentalOwners() {
  const [owners, setOwners] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingOwner, setEditingOwner] = useState(null)
  const [formData, setFormData] = useState({
    owner_name: '',
    phone: '',
    email: '',
    properties_owned: '',
    ownership_share: '',
    notes: ''
  })

  useEffect(() => {
    fetchOwners()

    const channel = supabase
      .channel('rental_owners_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rental_owners' },
        (payload) => {
          console.log('Real-time change in rental_owners:', payload)
          fetchOwners()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchOwners() {
    try {
      const { data, error } = await supabase
        .from('rental_owners')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setOwners(data || [])
    } catch (error) {
      alert('Error loading owners: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('rental_owners')
        .insert([{
          owner_name: formData.owner_name,
          phone: formData.phone,
          email: formData.email,
          properties_owned: formData.properties_owned,
          ownership_share: formData.ownership_share,
          notes: formData.notes,
          user_id: user.id
        }])

      if (error) throw error

      setFormData({
        owner_name: '',
        phone: '',
        email: '',
        properties_owned: '',
        ownership_share: '',
        notes: ''
      })
      alert('Owner added successfully!')
    } catch (error) {
      alert('Error adding owner: ' + error.message)
    }
  }

  async function handleUpdate(e) {
    e.preventDefault()
    try {
      const { error } = await supabase
        .from('rental_owners')
        .update({
          owner_name: editingOwner.owner_name,
          phone: editingOwner.phone,
          email: editingOwner.email,
          properties_owned: editingOwner.properties_owned,
          ownership_share: editingOwner.ownership_share,
          notes: editingOwner.notes
        })
        .eq('id', editingOwner.id)

      if (error) throw error
      setEditingOwner(null)
      alert('Owner updated successfully!')
    } catch (error) {
      alert('Error updating owner: ' + error.message)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this owner?')) return
    try {
      const { error } = await supabase.from('rental_owners').delete().eq('id', id)
      if (error) throw error
    } catch (error) {
      alert('Error deleting owner: ' + error.message)
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
          🏛️ Rental Owners
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>
          Manage property owner records and contact details
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
            TOTAL OWNERS
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#2563eb' }}>
            {owners.length}
          </div>
        </div>
      </div>

      {/* Add Owner Form */}
      <form onSubmit={handleSubmit} style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        marginBottom: '32px'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>
          ➕ Add New Owner
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>
              Owner Name *
            </label>
            <input
              type="text"
              value={formData.owner_name}
              onChange={(e) => setFormData({...formData, owner_name: e.target.value})}
              required
              placeholder="e.g., Robert Smith"
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
              placeholder="e.g., robert@example.com"
              style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>
              Properties Owned
            </label>
            <input
              type="text"
              value={formData.properties_owned}
              onChange={(e) => setFormData({...formData, properties_owned: e.target.value})}
              placeholder="e.g., Main St Apt, Lake House"
              style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>
              Ownership Share
            </label>
            <input
              type="text"
              value={formData.ownership_share}
              onChange={(e) => setFormData({...formData, ownership_share: e.target.value})}
              placeholder="e.g., 100%, 50%"
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
          Add Owner
        </button>
      </form>

      {/* Owners List */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>
          All Owners
        </h2>

        {owners.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            padding: '60px 40px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏛️</div>
            <p style={{ color: '#6b7280', fontSize: '16px' }}>
              No owners yet. Add your first owner above!
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
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'left' }}>Properties Owned</th>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'left' }}>Share</th>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {owners.map((owner) => (
                  <tr key={owner.id}>
                    {editingOwner?.id === owner.id ? (
                      <td colSpan="6" style={{ padding: '20px', border: '1px solid #e5e7eb' }}>
                        <form onSubmit={handleUpdate} style={{ backgroundColor: '#fef3c7', padding: '20px', borderRadius: '8px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                            <input type="text" value={editingOwner.owner_name} onChange={(e) => setEditingOwner({...editingOwner, owner_name: e.target.value})} required placeholder="Name" style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }} />
                            <input type="text" value={editingOwner.phone || ''} onChange={(e) => setEditingOwner({...editingOwner, phone: e.target.value})} placeholder="Phone" style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }} />
                            <input type="email" value={editingOwner.email || ''} onChange={(e) => setEditingOwner({...editingOwner, email: e.target.value})} placeholder="Email" style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }} />
                            <input type="text" value={editingOwner.properties_owned || ''} onChange={(e) => setEditingOwner({...editingOwner, properties_owned: e.target.value})} placeholder="Properties" style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }} />
                            <input type="text" value={editingOwner.ownership_share || ''} onChange={(e) => setEditingOwner({...editingOwner, ownership_share: e.target.value})} placeholder="Share" style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }} />
                            <input type="text" value={editingOwner.notes || ''} onChange={(e) => setEditingOwner({...editingOwner, notes: e.target.value})} placeholder="Notes" style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }} />
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="submit" style={{ padding: '6px 16px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Save</button>
                            <button type="button" onClick={() => setEditingOwner(null)} style={{ padding: '6px 16px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Cancel</button>
                          </div>
                        </form>
                      </td>
                    ) : (
                      <>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#111827', fontWeight: '600' }}>{owner.owner_name}</td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}>{owner.phone || '-'}</td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}>{owner.email || '-'}</td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}>{owner.properties_owned || '-'}</td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}>{owner.ownership_share || '-'}</td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button onClick={() => setEditingOwner(owner)} style={{ padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Edit</button>
                            <button onClick={() => handleDelete(owner.id)} style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Delete</button>
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