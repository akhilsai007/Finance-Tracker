import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Gold() {
  const [ornaments, setOrnaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingOrnament, setEditingOrnament] = useState(null)
  const [currentGoldPrice, setCurrentGoldPrice] = useState(() => {
    // Load gold price from localStorage
    return parseFloat(localStorage.getItem('goldPricePerGram')) || 6500
  })
  const [formData, setFormData] = useState({
    ornament_name: '',
    weight_grams: '',
    purity: '22K',
    description: '',
    purchase_date: ''
  })

  // Fetch ornaments and set up real-time subscription
  useEffect(() => {
    fetchOrnaments()

    const channel = supabase
      .channel('gold_ornaments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gold_ornaments'
        },
        (payload) => {
          console.log('Real-time change detected in gold_ornaments:', payload)
          fetchOrnaments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchOrnaments() {
    try {
      const { data, error } = await supabase
        .from('gold_ornaments')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setOrnaments(data || [])
    } catch (error) {
      alert('Error loading gold ornaments: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('gold_ornaments')
        .insert([{
          ornament_name: formData.ornament_name,
          weight_grams: parseFloat(formData.weight_grams),
          purity: formData.purity,
          description: formData.description,
          purchase_date: formData.purchase_date || null,
          user_id: user.id
        }])
      
      if (error) throw error
      
      // Clear form
      setFormData({
        ornament_name: '',
        weight_grams: '',
        purity: '22K',
        description: '',
        purchase_date: ''
      })
      
      alert('Gold ornament added successfully!')
    } catch (error) {
      alert('Error adding ornament: ' + error.message)
    }
  }

  async function handleUpdate(e) {
    e.preventDefault()
    
    try {
      const { error } = await supabase
        .from('gold_ornaments')
        .update({
          ornament_name: editingOrnament.ornament_name,
          weight_grams: parseFloat(editingOrnament.weight_grams),
          purity: editingOrnament.purity,
          description: editingOrnament.description,
          purchase_date: editingOrnament.purchase_date || null
        })
        .eq('id', editingOrnament.id)
      
      if (error) throw error
      
      setEditingOrnament(null)
      alert('Ornament updated successfully!')
    } catch (error) {
      alert('Error updating ornament: ' + error.message)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this ornament?')) return
    
    try {
      const { error } = await supabase
        .from('gold_ornaments')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    } catch (error) {
      alert('Error deleting ornament: ' + error.message)
    }
  }

  function handleGoldPriceUpdate(newPrice) {
    const price = parseFloat(newPrice)
    if (price > 0) {
      setCurrentGoldPrice(price)
      localStorage.setItem('goldPricePerGram', price.toString())
    }
  }

  // Calculate totals
  const totalWeight = ornaments.reduce((sum, o) => sum + parseFloat(o.weight_grams || 0), 0)
  const totalValue = totalWeight * currentGoldPrice

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
          💎 Gold Ornaments
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>
          Track your gold ornaments and their current value
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {/* Total Weight Card */}
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600', marginBottom: '8px' }}>
            TOTAL GOLD WEIGHT
          </div>
          <div style={{ fontSize: '36px', fontWeight: '700', color: '#f59e0b' }}>
            {totalWeight.toFixed(2)}g
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
            {ornaments.length} ornament{ornaments.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Current Gold Price Card */}
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600', marginBottom: '12px' }}>
            CURRENT GOLD PRICE (per gram)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px', fontWeight: '700', color: '#2563eb' }}>₹</span>
            <input
              type="number"
              step="0.01"
              value={currentGoldPrice}
              onChange={(e) => handleGoldPriceUpdate(e.target.value)}
              style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#2563eb',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px 12px',
                width: '140px'
              }}
            />
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
            Update to today's market rate
          </div>
        </div>

        {/* Total Value Card */}
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
        }}>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', fontWeight: '600', marginBottom: '8px' }}>
            TOTAL VALUE
          </div>
          <div style={{ fontSize: '36px', fontWeight: '700', color: 'white' }}>
            ₹{totalValue.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', marginTop: '4px' }}>
            Based on current market price
          </div>
        </div>
      </div>

      {/* Add Ornament Form */}
      <form onSubmit={handleSubmit} style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        marginBottom: '32px'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>
          ➕ Add New Ornament
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>
              Ornament Name *
            </label>
            <input
              type="text"
              value={formData.ornament_name}
              onChange={(e) => setFormData({...formData, ornament_name: e.target.value})}
              required
              placeholder="e.g., Necklace, Ring, Bangles"
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
              Weight (grams) *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.weight_grams}
              onChange={(e) => setFormData({...formData, weight_grams: e.target.value})}
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
              Purity
            </label>
            <select
              value={formData.purity}
              onChange={(e) => setFormData({...formData, purity: e.target.value})}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            >
              <option value="24K">24K (99.9%)</option>
              <option value="22K">22K (91.6%)</option>
              <option value="18K">18K (75%)</option>
              <option value="14K">14K (58.3%)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '13px' }}>
              Purchase Date
            </label>
            <input
              type="date"
              value={formData.purchase_date}
              onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
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
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
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
          Add Ornament
        </button>
      </form>

      {/* Ornaments List */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>
          All Ornaments
        </h2>

        {ornaments.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            padding: '60px 40px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💎</div>
            <p style={{ color: '#6b7280', fontSize: '16px' }}>
              No gold ornaments yet. Add your first ornament above!
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
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'left' }}>Ornament</th>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'left' }}>Weight</th>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'left' }}>Purity</th>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'left' }}>Current Value</th>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'left' }}>Purchase Date</th>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'left' }}>Description</th>
                  <th style={{ padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ornaments.map((ornament) => (
                  <tr key={ornament.id}>
                    {editingOrnament?.id === ornament.id ? (
                      // Edit Mode
                      <td colSpan="7" style={{ padding: '20px', border: '1px solid #e5e7eb' }}>
                        <form onSubmit={handleUpdate} style={{ backgroundColor: '#fef3c7', padding: '20px', borderRadius: '8px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                            <input
                              type="text"
                              value={editingOrnament.ornament_name}
                              onChange={(e) => setEditingOrnament({...editingOrnament, ornament_name: e.target.value})}
                              required
                              placeholder="Ornament Name"
                              style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }}
                            />
                            <input
                              type="number"
                              step="0.01"
                              value={editingOrnament.weight_grams}
                              onChange={(e) => setEditingOrnament({...editingOrnament, weight_grams: e.target.value})}
                              required
                              placeholder="Weight (g)"
                              style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }}
                            />
                            <select
                              value={editingOrnament.purity}
                              onChange={(e) => setEditingOrnament({...editingOrnament, purity: e.target.value})}
                              style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }}
                            >
                              <option value="24K">24K</option>
                              <option value="22K">22K</option>
                              <option value="18K">18K</option>
                              <option value="14K">14K</option>
                            </select>
                            <input
                              type="date"
                              value={editingOrnament.purchase_date || ''}
                              onChange={(e) => setEditingOrnament({...editingOrnament, purchase_date: e.target.value})}
                              style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }}
                            />
                            <input
                              type="text"
                              value={editingOrnament.description || ''}
                              onChange={(e) => setEditingOrnament({...editingOrnament, description: e.target.value})}
                              placeholder="Description"
                              style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', gridColumn: 'span 2' }}
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
                              onClick={() => setEditingOrnament(null)}
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
                          {ornament.ornament_name}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#f59e0b', fontWeight: '700' }}>
                          {parseFloat(ornament.weight_grams).toFixed(2)}g
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}>
                          {ornament.purity || '-'}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '14px', color: '#059669', fontWeight: '700' }}>
                          ₹{(parseFloat(ornament.weight_grams) * currentGoldPrice).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}>
                          {ornament.purchase_date ? new Date(ornament.purchase_date).toLocaleDateString('en-IN') : '-'}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}>
                          {ornament.description || '-'}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              onClick={() => setEditingOrnament(ornament)}
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
                              onClick={() => handleDelete(ornament.id)}
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