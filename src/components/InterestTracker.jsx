import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function InterestTracker() {
  const [interests, setInterests] = useState([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    person_name: '',
    principal_amount: '',
    interest_rate: '',
    frequency: 'monthly',
    start_date: '',
    next_due_date: '',
    notes: ''
  })

  useEffect(() => {
    fetchInterests()
  
    // Subscribe to real-time changes
    const channel = supabase
      .channel('interest_tracker_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'interest_tracker'
        },
        (payload) => {
          console.log('Real-time change detected in interest_tracker:', payload)
          fetchInterests()
        }
      )
      .subscribe()
  
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchInterests() {
    try {
      const { data, error } = await supabase
        .from('interest_tracker')
        .select('*')
        .order('next_due_date', { ascending: true })
      
      if (error) throw error
      setInterests(data || [])
    } catch (error) {
      alert('Error loading interest records: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Calculate interest amount
  function calculateInterest(principal, rate, frequency) {
    const p = parseFloat(principal)
    const r = parseFloat(rate) / 100
    
    if (frequency === 'monthly') {
      return (p * r / 12).toFixed(2)
    } else if (frequency === '6months') {
      return (p * r / 2).toFixed(2)
    } else if (frequency === 'yearly') {
      return (p * r).toFixed(2)
    }
    return 0
  }

  // Add new interest record
  async function handleSubmit(e) {
    e.preventDefault()
    
    try {
        const { data: { user } } = await supabase.auth.getUser()

        const { error } = await supabase
          .from('interest_tracker')
          .insert([{
            person_name: formData.person_name,
            principal_amount: parseFloat(formData.principal_amount),
            interest_rate: parseFloat(formData.interest_rate),
            frequency: formData.frequency,
            start_date: formData.start_date,
            next_due_date: formData.next_due_date,
            paid: false,
            notes: formData.notes,
            user_id: user.id
          }])
      
      if (error) throw error
      
      // Clear form
      setFormData({ 
        person_name: '', 
        principal_amount: '', 
        interest_rate: '', 
        frequency: 'monthly',
        start_date: '',
        next_due_date: '',
        notes: '' 
      })
      
      // Refresh list
      fetchInterests()
      alert('Interest record added successfully!')
    } catch (error) {
      alert('Error adding interest record: ' + error.message)
    }
  }

  // Toggle paid status
  async function togglePaid(id, currentStatus) {
    try {
      const { error } = await supabase
        .from('interest_tracker')
        .update({ paid: !currentStatus })
        .eq('id', id)
      
      if (error) throw error
      fetchInterests()
    } catch (error) {
      alert('Error updating status: ' + error.message)
    }
  }

  // Delete interest record
  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this interest record?')) return
    
    try {
      const { error } = await supabase
        .from('interest_tracker')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      fetchInterests()
    } catch (error) {
      alert('Error deleting interest record: ' + error.message)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Interest Tracker</h1>
      
      {/* Add Interest Form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>Add New Interest Record</h2>
        
        <div style={{ marginBottom: '10px' }}>
          <label>Person Name: </label>
          <input 
            type="text" 
            value={formData.person_name}
            onChange={(e) => setFormData({...formData, person_name: e.target.value})}
            required
            placeholder="e.g., Rajesh Kumar"
            style={{ marginLeft: '10px', padding: '5px', width: '250px' }}
          />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label>Principal Amount: </label>
          <input 
            type="number" 
            step="0.01"
            value={formData.principal_amount}
            onChange={(e) => setFormData({...formData, principal_amount: e.target.value})}
            required
            placeholder="e.g., 100000"
            style={{ marginLeft: '10px', padding: '5px', width: '200px' }}
          />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label>Interest Rate (%): </label>
          <input 
            type="number" 
            step="0.01"
            value={formData.interest_rate}
            onChange={(e) => setFormData({...formData, interest_rate: e.target.value})}
            required
            placeholder="e.g., 12"
            style={{ marginLeft: '10px', padding: '5px', width: '150px' }}
          />
          <span style={{ marginLeft: '10px', color: '#666' }}>% per year</span>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label>Payment Frequency: </label>
          <select 
            value={formData.frequency}
            onChange={(e) => setFormData({...formData, frequency: e.target.value})}
            style={{ marginLeft: '10px', padding: '5px' }}
          >
            <option value="monthly">Monthly</option>
            <option value="6months">Every 6 Months</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label>Start Date: </label>
          <input 
            type="date" 
            value={formData.start_date}
            onChange={(e) => setFormData({...formData, start_date: e.target.value})}
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label>Next Due Date: </label>
          <input 
            type="date" 
            value={formData.next_due_date}
            onChange={(e) => setFormData({...formData, next_due_date: e.target.value})}
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
        
        {formData.principal_amount && formData.interest_rate && (
          <div style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
            <strong>Interest Amount per payment: ₹{calculateInterest(formData.principal_amount, formData.interest_rate, formData.frequency)}</strong>
          </div>
        )}
        
        <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Add Interest Record
        </button>
      </form>

      {/* Interest Records List */}
      <h2>All Interest Records</h2>
      {interests.length === 0 ? (
        <p>No interest records yet. Add your first one above!</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Person</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Principal</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Rate</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Frequency</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Interest/Payment</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Next Due</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Status</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Notes</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {interests.map((interest) => (
              <tr key={interest.id} style={{ backgroundColor: interest.paid ? '#e8f5e9' : 'white' }}>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{interest.person_name}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>₹{interest.principal_amount}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{interest.interest_rate}%</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  {interest.frequency === 'monthly' ? 'Monthly' : 
                   interest.frequency === '6months' ? 'Every 6 Months' : 'Yearly'}
                </td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  ₹{calculateInterest(interest.principal_amount, interest.interest_rate, interest.frequency)}
                </td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{interest.next_due_date}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  <span style={{ 
                    padding: '5px 10px', 
                    borderRadius: '4px', 
                    backgroundColor: interest.paid ? '#4CAF50' : '#ff9800',
                    color: 'white'
                  }}>
                    {interest.paid ? 'Paid' : 'Pending'}
                  </span>
                </td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{interest.notes}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  <button 
                    onClick={() => togglePaid(interest.id, interest.paid)}
                    style={{ 
                      padding: '5px 10px', 
                      backgroundColor: interest.paid ? '#ff9800' : '#4CAF50', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: 'pointer',
                      marginRight: '5px'
                    }}
                  >
                    {interest.paid ? 'Mark Pending' : 'Mark Paid'}
                  </button>
                  <button 
                    onClick={() => handleDelete(interest.id)}
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