import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function PropertyDetails() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingProperty, setEditingProperty] = useState(null)
  const [formData, setFormData] = useState({
    property_holder_name: '',
    area: '',
    purchase_value: '',
    purchase_date: '',
    purchased_from: '',
    document_no: '',
    extent: '',
    number_of_pages: '',
    latitude: '',
    longitude: '',
    notes: ''
  })

  // Fetch properties from database and set up real-time subscription
  useEffect(() => {
    fetchProperties()

    // Subscribe to real-time changes
    const channel = supabase
      .channel('property_details_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'property_details'
        },
        (payload) => {
          console.log('Real-time change detected in property_details:', payload)
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
        .from('property_details')
        .select('*')
        .order('purchase_date', { ascending: false })
      
      if (error) throw error
      setProperties(data || [])
    } catch (error) {
      alert('Error loading properties: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Add new property
  async function handleSubmit(e) {
    e.preventDefault()
    
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('property_details')
        .insert([{
            property_holder_name: formData.property_holder_name,
            area: formData.area,
            purchase_value: formData.purchase_value ? parseFloat(formData.purchase_value) : null,
            purchase_date: formData.purchase_date,
            purchased_from: formData.purchased_from,
            document_no: formData.document_no,
            extent: formData.extent,
            number_of_pages: formData.number_of_pages ? parseInt(formData.number_of_pages) : null,
            latitude: formData.latitude ? parseFloat(formData.latitude) : null,
            longitude: formData.longitude ? parseFloat(formData.longitude) : null,
            notes: formData.notes,
            user_id: user.id
        }])
      
      if (error) throw error
      
      // Clear form
      setFormData({
        property_holder_name: '',
        area: '',
        purchase_value: '',
        purchase_date: '',
        purchased_from: '',
        document_no: '',
        extent: '',
        number_of_pages: '',
        latitude: '',
        longitude: '',
        notes: ''
      })
      
      alert('Property added successfully!')
    } catch (error) {
      alert('Error adding property: ' + error.message)
    }
  }

  // Update property
  async function handleUpdate(e) {
    e.preventDefault()
    
    try {
        const { error } = await supabase
        .from('property_details')
        .update({
          property_holder_name: editingProperty.property_holder_name,
          area: editingProperty.area,
          purchase_value: editingProperty.purchase_value ? parseFloat(editingProperty.purchase_value) : null,
          purchase_date: editingProperty.purchase_date,
          purchased_from: editingProperty.purchased_from,
          document_no: editingProperty.document_no,
          extent: editingProperty.extent,
          number_of_pages: editingProperty.number_of_pages ? parseInt(editingProperty.number_of_pages) : null,
          latitude: editingProperty.latitude ? parseFloat(editingProperty.latitude) : null,
          longitude: editingProperty.longitude ? parseFloat(editingProperty.longitude) : null,
          notes: editingProperty.notes
        })
        .eq('id', editingProperty.id)
      
      if (error) throw error
      
      setEditingProperty(null)
      alert('Property updated successfully!')
    } catch (error) {
      alert('Error updating property: ' + error.message)
    }
  }

  // Delete property
  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this property?')) return
    
    try {
      const { error } = await supabase
        .from('property_details')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    } catch (error) {
      alert('Error deleting property: ' + error.message)
    }
  }

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '30px', color: '#1f2937', fontWeight: '700' }}>🏘️ Property Details</h1>
      
      {/* Add Property Form */}
      <form onSubmit={handleSubmit} style={{ 
        padding: '30px', 
        backgroundColor: '#f9fafb',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        marginBottom: '40px'
      }}>
        <h2 style={{ fontSize: '20px', marginBottom: '20px', color: '#374151', fontWeight: '700' }}>Add New Property</h2>
        
        {/* Property Holder & Location */}
        <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>Property Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                Property Holder Name *
                </label>
                <input 
                type="text" 
                value={formData.property_holder_name}
                onChange={(e) => setFormData({...formData, property_holder_name: e.target.value})}
                required
                placeholder="e.g., John Doe"
                style={{ 
                    width: '100%', 
                    padding: '12px', 
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                }}
                />
            </div>
            <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                Area
                </label>
                <input 
                type="text" 
                value={formData.area}
                onChange={(e) => setFormData({...formData, area: e.target.value})}
                placeholder="e.g., Downtown, Sector 15"
                style={{ 
                    width: '100%', 
                    padding: '12px', 
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                }}
                />
            </div>
            <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                Extent
                </label>
                <input 
                type="text" 
                value={formData.extent}
                onChange={(e) => setFormData({...formData, extent: e.target.value})}
                placeholder="e.g., 1200 sq ft, 0.5 acres"
                style={{ 
                    width: '100%', 
                    padding: '12px', 
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                }}
                />
            </div>
            </div>

            {/* Location Coordinates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '16px' }}>
            <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                Latitude 📍
                </label>
                <input 
                type="number" 
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                placeholder="e.g., 28.6139"
                style={{ 
                    width: '100%', 
                    padding: '12px', 
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                }}
                />
            </div>
            <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                Longitude 📍
                </label>
                <input 
                type="number" 
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                placeholder="e.g., 77.2090"
                style={{ 
                    width: '100%', 
                    padding: '12px', 
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                }}
                />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                {formData.latitude && formData.longitude && (
                <a 
                    href={`https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                    padding: '12px 20px', 
                    backgroundColor: '#3b82f6', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '8px', 
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    textDecoration: 'none',
                    display: 'inline-block',
                    textAlign: 'center'
                    }}
                >
                    🗺️ Preview on Map
                </a>
                )}
            </div>
            </div> 
        </div>

        {/* Purchase Details */}
        <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>Purchase Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                Purchase Value (₹)
              </label>
              <input 
                type="number" 
                step="0.01"
                value={formData.purchase_value}
                onChange={(e) => setFormData({...formData, purchase_value: e.target.value})}
                placeholder="0.00"
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                Purchase Date
              </label>
              <input 
                type="date" 
                value={formData.purchase_date}
                onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                Purchased From
              </label>
              <input 
                type="text" 
                value={formData.purchased_from}
                onChange={(e) => setFormData({...formData, purchased_from: e.target.value})}
                placeholder="e.g., ABC Developers, John Smith"
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Document Details */}
        <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>Document Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                Document Number
              </label>
              <input 
                type="text" 
                value={formData.document_no}
                onChange={(e) => setFormData({...formData, document_no: e.target.value})}
                placeholder="e.g., DOC-2024-001"
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                Number of Pages
              </label>
              <input 
                type="number" 
                value={formData.number_of_pages}
                onChange={(e) => setFormData({...formData, number_of_pages: e.target.value})}
                placeholder="e.g., 10"
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
            Notes (Optional)
          </label>
          <textarea 
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            placeholder="Any additional notes about the property..."
            rows="3"
            style={{ 
              width: '100%', 
              padding: '12px', 
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
        </div>
        
        <button type="submit" style={{ 
          padding: '12px 32px', 
          backgroundColor: '#10b981', 
          color: 'white', 
          border: 'none', 
          borderRadius: '8px', 
          cursor: 'pointer',
          fontWeight: '600',
          fontSize: '14px'
        }}>
          Add Property
        </button>
      </form>

      {/* Properties List */}
      <div>
        <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#1f2937', fontWeight: '700' }}>All Properties</h2>
        
        {properties.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
            No properties yet. Add your first one above!
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'left' }}>Holder Name</th>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'left' }}>Area</th>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'left' }}>Purchase Value</th>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'left' }}>Purchase Date</th>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'left' }}>Purchased From</th>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'left' }}>Doc No</th>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'left' }}>Extent</th>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'left' }}>Pages</th>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'center' }}>Actions</th>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'center' }}>Location</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((property) => (
                  <tr key={property.id}>
                    {editingProperty?.id === property.id ? (
                      // Edit Mode
                      <td colSpan="9" style={{ padding: '20px', border: '1px solid #e5e7eb' }}>
                        <form onSubmit={handleUpdate} style={{ backgroundColor: '#fef3c7', padding: '20px', borderRadius: '8px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
                            <input 
                              type="text"
                              value={editingProperty.property_holder_name}
                              onChange={(e) => setEditingProperty({...editingProperty, property_holder_name: e.target.value})}
                              placeholder="Holder Name"
                              required
                              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}
                            />
                            <input 
                              type="text"
                              value={editingProperty.area || ''}
                              onChange={(e) => setEditingProperty({...editingProperty, area: e.target.value})}
                              placeholder="Area"
                              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}
                            />
                            <input 
                              type="number"
                              step="0.01"
                              value={editingProperty.purchase_value || ''}
                              onChange={(e) => setEditingProperty({...editingProperty, purchase_value: e.target.value})}
                              placeholder="Purchase Value"
                              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}
                            />
                            <input 
                              type="date"
                              value={editingProperty.purchase_date || ''}
                              onChange={(e) => setEditingProperty({...editingProperty, purchase_date: e.target.value})}
                              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}
                            />
                            <input 
                              type="text"
                              value={editingProperty.purchased_from || ''}
                              onChange={(e) => setEditingProperty({...editingProperty, purchased_from: e.target.value})}
                              placeholder="Purchased From"
                              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}
                            />
                            <input 
                              type="text"
                              value={editingProperty.document_no || ''}
                              onChange={(e) => setEditingProperty({...editingProperty, document_no: e.target.value})}
                              placeholder="Doc No"
                              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}
                            />
                            <input 
                              type="text"
                              value={editingProperty.extent || ''}
                              onChange={(e) => setEditingProperty({...editingProperty, extent: e.target.value})}
                              placeholder="Extent"
                              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}
                            />
                            <input 
                              type="number"
                              value={editingProperty.number_of_pages || ''}
                              onChange={(e) => setEditingProperty({...editingProperty, number_of_pages: e.target.value})}
                              placeholder="Pages"
                              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}
                            />
                            <input 
                              type="number"
                              step="any"
                              value={editingProperty.latitude || ''}
                              onChange={(e) => setEditingProperty({...editingProperty, latitude: e.target.value})}
                              placeholder="Latitude"
                              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}
                            />
                            <input 
                              type="number"
                              step="any"
                              value={editingProperty.longitude || ''}
                              onChange={(e) => setEditingProperty({...editingProperty, longitude: e.target.value})}
                              placeholder="Longitude"
                              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}
                             />
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="submit" style={{ 
                              padding: '8px 16px', 
                              backgroundColor: '#10b981', 
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
                              onClick={() => setEditingProperty(null)}
                              style={{ 
                                padding: '8px 16px', 
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
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#111827', fontWeight: '500' }}>{property.property_holder_name}</td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}>{property.area || '-'}</td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#059669', fontWeight: '600' }}>
                          {property.purchase_value ? `₹${parseFloat(property.purchase_value).toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}>
                          {property.purchase_date ? new Date(property.purchase_date).toLocaleDateString('en-IN') : '-'}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}>{property.purchased_from || '-'}</td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}>{property.document_no || '-'}</td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}>{property.extent || '-'}</td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280', textAlign: 'center' }}>{property.number_of_pages || '-'}</td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                        {property.latitude && property.longitude ? (
                            <a 
                            href={`https://www.google.com/maps?q=${property.latitude},${property.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ 
                                padding: '6px 12px', 
                                backgroundColor: '#3b82f6', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '6px', 
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '600',
                                textDecoration: 'none',
                                display: 'inline-block'
                            }}
                            >
                            🗺️ View Map
                            </a>
                        ) : (
                            <span style={{ fontSize: '12px', color: '#9ca3af' }}>No location</span>
                        )}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button 
                              onClick={() => setEditingProperty(property)}
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
                              onClick={() => handleDelete(property.id)}
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