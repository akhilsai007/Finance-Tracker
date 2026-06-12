import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function RentalProperties() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingProperty, setEditingProperty] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    property_name: '',
    location: '',
    owner_name: '',
    property_type: '',
    notes: ''
  })

  useEffect(() => {
    fetchProperties()

    const channel = supabase
      .channel('rental_units_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rental_units' },
        (payload) => {
          console.log('Real-time change in rental_units:', payload)
          fetchProperties()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchProperties() {
    try {
      const { data, error } = await supabase
        .from('rental_units')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProperties(data || [])
    } catch (error) {
      alert('Error loading properties: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('rental_units')
        .insert([{
          property_name: formData.property_name,
          location: formData.location,
          owner_name: formData.owner_name,
          property_type: formData.property_type,
          notes: formData.notes,
          user_id: user.id
        }])

      if (error) throw error

      setFormData({
        property_name: '',
        location: '',
        owner_name: '',
        property_type: '',
        notes: ''
      })
      setShowAddForm(false)
    } catch (error) {
      alert('Error adding property: ' + error.message)
    }
  }

  async function handleUpdate(e) {
    e.preventDefault()
    try {
      const { error } = await supabase
        .from('rental_units')
        .update({
          property_name: editingProperty.property_name,
          location: editingProperty.location,
          owner_name: editingProperty.owner_name,
          property_type: editingProperty.property_type,
          notes: editingProperty.notes
        })
        .eq('id', editingProperty.id)

      if (error) throw error
      setEditingProperty(null)
    } catch (error) {
      alert('Error updating property: ' + error.message)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this property?')) return
    try {
      const { error } = await supabase.from('rental_units').delete().eq('id', id)
      if (error) throw error
    } catch (error) {
      alert('Error deleting property: ' + error.message)
    }
  }

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading...</div>
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px' }}>
      {/* Header with Add button on the right */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
            🏢 Properties
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            Your rental property register
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            padding: '10px 20px',
            backgroundColor: showAddForm ? '#6b7280' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            whiteSpace: 'nowrap',
            transition: 'background-color 0.2s'
          }}
        >
          {showAddForm ? '✕ Cancel' : '+ Add Property'}
        </button>
      </div>

      {/* Summary Card */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
          <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600', marginBottom: '8px' }}>TOTAL PROPERTIES</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#2563eb' }}>{properties.length}</div>
        </div>
      </div>

      {/* Add Property Form — only shows when toggled */}
      {showAddForm && (
        <form onSubmit={handleSubmit} style={{
          backgroundColor: 'white', padding: '24px', borderRadius: '12px',
          border: '1px solid #e5e7eb', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', marginBottom: '32px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>➕ Add New Property</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>Property Name *</label>
              <input type="text" value={formData.property_name} onChange={(e) => setFormData({...formData, property_name: e.target.value})} required placeholder="e.g., Green Valley Apartment" style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>Location</label>
              <input type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="e.g., Hyderabad, Sector 5" style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>Property Owner Name</label>
              <input type="text" value={formData.owner_name} onChange={(e) => setFormData({...formData, owner_name: e.target.value})} placeholder="e.g., Robert Smith" style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>Type of Property</label>
              <input type="text" value={formData.property_type} onChange={(e) => setFormData({...formData, property_type: e.target.value})} placeholder="e.g., Residential, Commercial" style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>Notes</label>
              <input type="text" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Optional notes..." style={{ width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }} />
            </div>
          </div>

          <button type="submit" style={{ marginTop: '20px', padding: '10px 24px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
            Save Property
          </button>
        </form>
      )}

      {/* Properties List */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>All Properties</h2>

        {properties.length === 0 ? (
          <div style={{ backgroundColor: 'white', padding: '60px 40px', borderRadius: '12px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏢</div>
            <p style={{ color: '#6b7280', fontSize: '16px' }}>No properties yet. Click "+ Add Property" above to add your first one!</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'left' }}>Property Name</th>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'left' }}>Location</th>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'left' }}>Owner</th>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'left' }}>Type</th>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((property) => (
                  <tr key={property.id}>
                    {editingProperty?.id === property.id ? (
                      <td colSpan="5" style={{ padding: '20px', border: '1px solid #e5e7eb' }}>
                        <form onSubmit={handleUpdate} style={{ backgroundColor: '#fef3c7', padding: '20px', borderRadius: '8px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                            <input type="text" value={editingProperty.property_name} onChange={(e) => setEditingProperty({...editingProperty, property_name: e.target.value})} required placeholder="Property Name" style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }} />
                            <input type="text" value={editingProperty.location || ''} onChange={(e) => setEditingProperty({...editingProperty, location: e.target.value})} placeholder="Location" style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }} />
                            <input type="text" value={editingProperty.owner_name || ''} onChange={(e) => setEditingProperty({...editingProperty, owner_name: e.target.value})} placeholder="Owner" style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }} />
                            <input type="text" value={editingProperty.property_type || ''} onChange={(e) => setEditingProperty({...editingProperty, property_type: e.target.value})} placeholder="Type" style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }} />
                            <input type="text" value={editingProperty.notes || ''} onChange={(e) => setEditingProperty({...editingProperty, notes: e.target.value})} placeholder="Notes" style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }} />
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="submit" style={{ padding: '6px 16px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Save</button>
                            <button type="button" onClick={() => setEditingProperty(null)} style={{ padding: '6px 16px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Cancel</button>
                          </div>
                        </form>
                      </td>
                    ) : (
                      <>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#111827', fontWeight: '600' }}>{property.property_name}</td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}>{property.location || '-'}</td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}>{property.owner_name || '-'}</td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}>{property.property_type || '-'}</td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button onClick={() => setEditingProperty(property)} style={{ padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Edit</button>
                            <button onClick={() => handleDelete(property.id)} style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Delete</button>
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