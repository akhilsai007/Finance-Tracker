import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function HouseTaxes() {
  const [taxes, setTaxes] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingTax, setEditingTax] = useState(null)
  const [formData, setFormData] = useState({
    building_name: '',
    owner_name: '',
    assessment_no: '',
    assessment_amount: '',
    assessment_receipt_no: '',
    ps_no: '',
    water_no: '',
    water_amount: '',
    water_receipt_no: '',
    duration: '',
    sewerage_amount: '',
    sewerage_receipt_no: '',
    payment_date: '',
    notes: ''
  })

  // Fetch house taxes from database and set up real-time subscription
  useEffect(() => {
    fetchTaxes()

    // Subscribe to real-time changes
    const channel = supabase
      .channel('house_taxes_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'house_taxes'
        },
        (payload) => {
          console.log('Real-time change detected in house_taxes:', payload)
          fetchTaxes()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchTaxes() {
    try {
      const { data, error } = await supabase
        .from('house_taxes')
        .select('*')
        .order('payment_date', { ascending: false })
      
      if (error) throw error
      setTaxes(data || [])
    } catch (error) {
      alert('Error loading house taxes: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Add new house tax
  async function handleSubmit(e) {
    e.preventDefault()
    
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('house_taxes')
        .insert([{
          building_name: formData.building_name,
          owner_name: formData.owner_name,
          assessment_no: formData.assessment_no,
          assessment_amount: formData.assessment_amount ? parseFloat(formData.assessment_amount) : null,
          assessment_receipt_no: formData.assessment_receipt_no,
          ps_no: formData.ps_no,
          water_no: formData.water_no,
          water_amount: formData.water_amount ? parseFloat(formData.water_amount) : null,
          water_receipt_no: formData.water_receipt_no,
          duration: formData.duration,
          sewerage_amount: formData.sewerage_amount ? parseFloat(formData.sewerage_amount) : null,
          sewerage_receipt_no: formData.sewerage_receipt_no,
          payment_date: formData.payment_date,
          notes: formData.notes,
          user_id: user.id
        }])
      
      if (error) throw error
      
      // Clear form
      setFormData({
        building_name: '',
        owner_name: '',
        assessment_no: '',
        assessment_amount: '',
        assessment_receipt_no: '',
        ps_no: '',
        water_no: '',
        water_amount: '',
        water_receipt_no: '',
        duration: '',
        sewerage_amount: '',
        sewerage_receipt_no: '',
        payment_date: '',
        notes: ''
      })
      
      alert('House tax record added successfully!')
    } catch (error) {
      alert('Error adding house tax: ' + error.message)
    }
  }

  // Update house tax
  async function handleUpdate(e) {
    e.preventDefault()
    
    try {
      const { error } = await supabase
        .from('house_taxes')
        .update({
          building_name: editingTax.building_name,
          owner_name: editingTax.owner_name,
          assessment_no: editingTax.assessment_no,
          assessment_amount: editingTax.assessment_amount ? parseFloat(editingTax.assessment_amount) : null,
          assessment_receipt_no: editingTax.assessment_receipt_no,
          ps_no: editingTax.ps_no,
          water_no: editingTax.water_no,
          water_amount: editingTax.water_amount ? parseFloat(editingTax.water_amount) : null,
          water_receipt_no: editingTax.water_receipt_no,
          duration: editingTax.duration,
          sewerage_amount: editingTax.sewerage_amount ? parseFloat(editingTax.sewerage_amount) : null,
          sewerage_receipt_no: editingTax.sewerage_receipt_no,
          payment_date: editingTax.payment_date,
          notes: editingTax.notes
        })
        .eq('id', editingTax.id)
      
      if (error) throw error
      
      setEditingTax(null)
      alert('House tax record updated successfully!')
    } catch (error) {
      alert('Error updating house tax: ' + error.message)
    }
  }

  // Delete house tax
  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this house tax record?')) return
    
    try {
      const { error } = await supabase
        .from('house_taxes')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    } catch (error) {
      alert('Error deleting house tax: ' + error.message)
    }
  }

  // Calculate total for a record
  function calculateTotal(tax) {
    const assessment = parseFloat(tax.assessment_amount) || 0
    const water = parseFloat(tax.water_amount) || 0
    const sewerage = parseFloat(tax.sewerage_amount) || 0
    return assessment + water + sewerage
  }

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '30px', color: '#1f2937', fontWeight: '700' }}>🏠 House Taxes</h1>
      
      {/* Add House Tax Form */}
      <form onSubmit={handleSubmit} style={{ 
        padding: '30px', 
        backgroundColor: '#f9fafb',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        marginBottom: '40px'
      }}>
        <h2 style={{ fontSize: '20px', marginBottom: '20px', color: '#374151', fontWeight: '700' }}>Add New House Tax Record</h2>
        
        {/* Building & Owner Info */}
        <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>Property Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                Building Name *
              </label>
              <input 
                type="text" 
                value={formData.building_name}
                onChange={(e) => setFormData({...formData, building_name: e.target.value})}
                required
                placeholder="e.g., Green Valley Apartments"
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
                Owner Name
              </label>
              <input 
                type="text" 
                value={formData.owner_name}
                onChange={(e) => setFormData({...formData, owner_name: e.target.value})}
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
          </div>
        </div>

        {/* Assessment Tax */}
        <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>Assessment Tax</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                Assessment No
              </label>
              <input 
                type="text" 
                value={formData.assessment_no}
                onChange={(e) => setFormData({...formData, assessment_no: e.target.value})}
                placeholder="e.g., ASS-2024-001"
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
                Amount (₹)
              </label>
              <input 
                type="number" 
                step="0.01"
                value={formData.assessment_amount}
                onChange={(e) => setFormData({...formData, assessment_amount: e.target.value})}
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
                Receipt No
              </label>
              <input 
                type="text" 
                value={formData.assessment_receipt_no}
                onChange={(e) => setFormData({...formData, assessment_receipt_no: e.target.value})}
                placeholder="e.g., REC-001"
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

        {/* Water Charges */}
        <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>Water Charges</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                PS No
              </label>
              <input 
                type="text" 
                value={formData.ps_no}
                onChange={(e) => setFormData({...formData, ps_no: e.target.value})}
                placeholder="e.g., PS-2024"
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
                Water No
              </label>
              <input 
                type="text" 
                value={formData.water_no}
                onChange={(e) => setFormData({...formData, water_no: e.target.value})}
                placeholder="e.g., WAT-001"
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
                Amount (₹)
              </label>
              <input 
                type="number" 
                step="0.01"
                value={formData.water_amount}
                onChange={(e) => setFormData({...formData, water_amount: e.target.value})}
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
                Receipt No
              </label>
              <input 
                type="text" 
                value={formData.water_receipt_no}
                onChange={(e) => setFormData({...formData, water_receipt_no: e.target.value})}
                placeholder="e.g., W-REC-001"
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

        {/* Sewerage Charges */}
        <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>Sewerage Charges</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                Amount (₹)
              </label>
              <input 
                type="number" 
                step="0.01"
                value={formData.sewerage_amount}
                onChange={(e) => setFormData({...formData, sewerage_amount: e.target.value})}
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
                Receipt No
              </label>
              <input 
                type="text" 
                value={formData.sewerage_receipt_no}
                onChange={(e) => setFormData({...formData, sewerage_receipt_no: e.target.value})}
                placeholder="e.g., S-REC-001"
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

        {/* Additional Info */}
        <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>Additional Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                Duration
              </label>
              <input 
                type="text" 
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: e.target.value})}
                placeholder="e.g., Q1 2024, Annual 2024"
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
                Payment Date
              </label>
              <input 
                type="date" 
                value={formData.payment_date}
                onChange={(e) => setFormData({...formData, payment_date: e.target.value})}
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
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
              Notes
            </label>
            <textarea 
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Any additional notes..."
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
          Add House Tax Record
        </button>
      </form>

      {/* House Taxes List */}
      <div>
        <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#1f2937', fontWeight: '700' }}>All House Tax Records</h2>
        
        {taxes.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
            No house tax records yet. Add your first one above!
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'left' }}>Building</th>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'left' }}>Owner</th>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'left' }}>Assessment</th>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'left' }}>Water</th>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'left' }}>Sewerage</th>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'left' }}>Total</th>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'left' }}>Duration</th>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {taxes.map((tax) => (
                  <tr key={tax.id}>
                    {editingTax?.id === tax.id ? (
                      // Edit Mode
                      <td colSpan="9" style={{ padding: '20px', border: '1px solid #e5e7eb' }}>
                        <form onSubmit={handleUpdate} style={{ backgroundColor: '#fef3c7', padding: '20px', borderRadius: '8px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
                            <input 
                              type="text"
                              value={editingTax.building_name}
                              onChange={(e) => setEditingTax({...editingTax, building_name: e.target.value})}
                              placeholder="Building"
                              required
                              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}
                            />
                            <input 
                              type="text"
                              value={editingTax.owner_name || ''}
                              onChange={(e) => setEditingTax({...editingTax, owner_name: e.target.value})}
                              placeholder="Owner"
                              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}
                            />
                            <input 
                              type="text"
                              value={editingTax.assessment_no || ''}
                              onChange={(e) => setEditingTax({...editingTax, assessment_no: e.target.value})}
                              placeholder="Assessment No"
                              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}
                            />
                            <input 
                              type="number"
                              step="0.01"
                              value={editingTax.assessment_amount || ''}
                              onChange={(e) => setEditingTax({...editingTax, assessment_amount: e.target.value})}
                              placeholder="Assessment Amt"
                              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}
                            />
                            <input 
                              type="text"
                              value={editingTax.water_no || ''}
                              onChange={(e) => setEditingTax({...editingTax, water_no: e.target.value})}
                              placeholder="Water No"
                              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}
                            />
                            <input 
                              type="number"
                              step="0.01"
                              value={editingTax.water_amount || ''}
                              onChange={(e) => setEditingTax({...editingTax, water_amount: e.target.value})}
                              placeholder="Water Amt"
                              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}
                            />
                            <input 
                              type="number"
                              step="0.01"
                              value={editingTax.sewerage_amount || ''}
                              onChange={(e) => setEditingTax({...editingTax, sewerage_amount: e.target.value})}
                              placeholder="Sewerage Amt"
                              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}
                            />
                            <input 
                              type="text"
                              value={editingTax.duration || ''}
                              onChange={(e) => setEditingTax({...editingTax, duration: e.target.value})}
                              placeholder="Duration"
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
                              onClick={() => setEditingTax(null)}
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
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#111827', fontWeight: '500' }}>{tax.building_name}</td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}>{tax.owner_name || '-'}</td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}>
                          {tax.assessment_amount ? `₹${tax.assessment_amount}` : '-'}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}>
                          {tax.water_amount ? `₹${tax.water_amount}` : '-'}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}>
                          {tax.sewerage_amount ? `₹${tax.sewerage_amount}` : '-'}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '14px', color: '#dc2626', fontWeight: '700' }}>
                          ₹{calculateTotal(tax).toFixed(2)}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}>{tax.duration || '-'}</td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}>
                          {tax.payment_date ? new Date(tax.payment_date).toLocaleDateString('en-IN') : '-'}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button 
                              onClick={() => setEditingTax(tax)}
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
                              onClick={() => handleDelete(tax.id)}
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