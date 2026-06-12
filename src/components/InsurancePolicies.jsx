import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function InsurancePolicies() {
  const [policies, setPolicies] = useState([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    policy_name: '',
    provider: '',
    premium_amount: '',
    due_date: '',
    renewal_date: '',
    notes: ''
  })

  useEffect(() => {
    fetchPolicies()
  
    // Subscribe to real-time changes
    const channel = supabase
      .channel('insurance_policies_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'insurance_policies'
        },
        (payload) => {
          console.log('Real-time change detected in insurance_policies:', payload)
          fetchPolicies()
        }
      )
      .subscribe()
  
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchPolicies() {
    try {
      const { data, error } = await supabase
        .from('insurance_policies')
        .select('*')
        .order('due_date', { ascending: true })
      
      if (error) throw error
      setPolicies(data || [])
    } catch (error) {
      alert('Error loading policies: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Add new policy
  async function handleSubmit(e) {
    e.preventDefault()
    
    try {
        const { data: { user } } = await supabase.auth.getUser()

        const { error } = await supabase
          .from('insurance_policies')
          .insert([{
            policy_name: formData.policy_name,
            provider: formData.provider,
            premium_amount: parseFloat(formData.premium_amount),
            due_date: formData.due_date,
            renewal_date: formData.renewal_date,
            paid: false,
            notes: formData.notes,
            user_id: user.id
          }])
      
      if (error) throw error
      
      // Clear form
      setFormData({ 
        policy_name: '', 
        provider: '', 
        premium_amount: '', 
        due_date: '',
        renewal_date: '',
        notes: '' 
      })
      
      // Refresh list
      fetchPolicies()
      alert('Insurance policy added successfully!')
    } catch (error) {
      alert('Error adding policy: ' + error.message)
    }
  }

  // Toggle paid status
  async function togglePaid(id, currentStatus) {
    try {
      const { error } = await supabase
        .from('insurance_policies')
        .update({ paid: !currentStatus })
        .eq('id', id)
      
      if (error) throw error
      fetchPolicies()
    } catch (error) {
      alert('Error updating status: ' + error.message)
    }
  }

  // Delete policy
  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this policy?')) return
    
    try {
      const { error } = await supabase
        .from('insurance_policies')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      fetchPolicies()
    } catch (error) {
      alert('Error deleting policy: ' + error.message)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Insurance Policies</h1>
      
      {/* Add Policy Form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>Add New Insurance Policy</h2>
        
        <div style={{ marginBottom: '10px' }}>
          <label>Policy Name: </label>
          <input 
            type="text" 
            value={formData.policy_name}
            onChange={(e) => setFormData({...formData, policy_name: e.target.value})}
            required
            placeholder="e.g., Life Insurance, Health Insurance"
            style={{ marginLeft: '10px', padding: '5px', width: '300px' }}
          />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label>Provider: </label>
          <input 
            type="text" 
            value={formData.provider}
            onChange={(e) => setFormData({...formData, provider: e.target.value})}
            placeholder="e.g., LIC, HDFC Life"
            style={{ marginLeft: '10px', padding: '5px', width: '250px' }}
          />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label>Premium Amount: </label>
          <input 
            type="number" 
            step="0.01"
            value={formData.premium_amount}
            onChange={(e) => setFormData({...formData, premium_amount: e.target.value})}
            required
            placeholder="e.g., 25000"
            style={{ marginLeft: '10px', padding: '5px', width: '200px' }}
          />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label>Due Date: </label>
          <input 
            type="date" 
            value={formData.due_date}
            onChange={(e) => setFormData({...formData, due_date: e.target.value})}
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label>Renewal Date: </label>
          <input 
            type="date" 
            value={formData.renewal_date}
            onChange={(e) => setFormData({...formData, renewal_date: e.target.value})}
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label>Notes: </label>
          <textarea 
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            placeholder="Optional notes"
            style={{ marginLeft: '10px', padding: '5px', width: '300px' }}
          />
        </div>
        
        <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Add Insurance Policy
        </button>
      </form>

      {/* Policies List */}
      <h2>All Insurance Policies</h2>
      {policies.length === 0 ? (
        <p>No insurance policies yet. Add your first one above!</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Policy Name</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Provider</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Premium</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Due Date</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Renewal Date</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Status</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Notes</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {policies.map((policy) => (
              <tr key={policy.id} style={{ backgroundColor: policy.paid ? '#e8f5e9' : 'white' }}>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{policy.policy_name}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{policy.provider}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>₹{policy.premium_amount}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{policy.due_date}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{policy.renewal_date}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  <span style={{ 
                    padding: '5px 10px', 
                    borderRadius: '4px', 
                    backgroundColor: policy.paid ? '#4CAF50' : '#ff9800',
                    color: 'white'
                  }}>
                    {policy.paid ? 'Paid' : 'Pending'}
                  </span>
                </td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{policy.notes}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  <button 
                    onClick={() => togglePaid(policy.id, policy.paid)}
                    style={{ 
                      padding: '5px 10px', 
                      backgroundColor: policy.paid ? '#ff9800' : '#4CAF50', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: 'pointer',
                      marginRight: '5px'
                    }}
                  >
                    {policy.paid ? 'Mark Pending' : 'Mark Paid'}
                  </button>
                  <button 
                    onClick={() => handleDelete(policy.id)}
                    style={{ padding: '5px 10px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}