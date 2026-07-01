import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Tenants() {
  const [tenants, setTenants] = useState([])
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState(null)
  const [formData, setFormData] = useState({
    tenant_name: '',
    property_name: '',
    phone: '',
    deposit_amount: '',
    status: 'Current',
    date_of_joining: '',
    initial_rent: '',
    current_rent: '',
    notes: ''
  })

  useEffect(() => {
    fetchTenants()
    fetchProperties()

    const channel = supabase
      .channel('tenants_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tenants' }, () => fetchTenants())
      .subscribe()

    const propChannel = supabase
      .channel('tenants_props_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rental_units' }, () => fetchProperties())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(propChannel)
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
      setSelectedTenant(prev => prev ? (data || []).find(t => t.id === prev.id) || prev : null)
    } catch (error) {
      alert('Error loading tenants: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  async function fetchProperties() {
    try {
      const { data, error } = await supabase
        .from('rental_units')
        .select('property_name')
        .order('property_name', { ascending: true })

      if (error) throw error
      setProperties(data || [])
    } catch (error) {
      console.error('Error loading properties:', error.message)
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
          property_name: formData.property_name,
          phone: formData.phone,
          deposit_amount: formData.deposit_amount ? parseFloat(formData.deposit_amount) : null,
          status: formData.status,
          date_of_joining: formData.date_of_joining || null,
          initial_rent: formData.initial_rent ? parseFloat(formData.initial_rent) : null,
          current_rent: formData.current_rent ? parseFloat(formData.current_rent) : null,
          notes: formData.notes,
          user_id: user.id
        }])

      if (error) throw error

      setFormData({ tenant_name: '', property_name: '', phone: '', deposit_amount: '', status: 'Current', date_of_joining: '', initial_rent: '', current_rent: '', notes: '' })
      setShowAddForm(false)
    } catch (error) {
      alert('Error adding tenant: ' + error.message)
    }
  }

  async function handleSaveEdit(e) {
    e.preventDefault()
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          tenant_name: editData.tenant_name,
          property_name: editData.property_name,
          phone: editData.phone,
          deposit_amount: editData.deposit_amount ? parseFloat(editData.deposit_amount) : null,
          status: editData.status,
          date_of_joining: editData.date_of_joining || null,
          initial_rent: editData.initial_rent ? parseFloat(editData.initial_rent) : null,
          current_rent: editData.current_rent ? parseFloat(editData.current_rent) : null,
          notes: editData.notes
        })
        .eq('id', editData.id)

      if (error) throw error
      setSelectedTenant(editData)
      setIsEditing(false)
    } catch (error) {
      alert('Error updating tenant: ' + error.message)
    }
  }

  function openTenant(tenant) {
    setSelectedTenant(tenant)
    setIsEditing(false)
  }

  function backToList() {
    setSelectedTenant(null)
    setIsEditing(false)
  }

  function fmtDate(d) {
    return d ? new Date(d).toLocaleDateString('en-IN') : null
  }
  function fmtMoney(n) {
    return n ? `₹${parseFloat(n).toLocaleString('en-IN')}` : null
  }

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading...</div>
  }

  // ============ DETAIL PAGE ============
  if (selectedTenant) {
    const t = selectedTenant
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px' }}>
        <button onClick={backToList} style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '600', fontSize: '14px', cursor: 'pointer', marginBottom: '24px', padding: 0 }}>
          ← Back to all tenants
        </button>

        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', padding: '32px' }}>
          {/* Name + status header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#2563eb', marginBottom: '4px' }}>{t.tenant_name}</h1>
              <div style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.05em', color: t.status === 'Past' ? '#9ca3af' : '#059669', textTransform: 'uppercase' }}>
                {t.status === 'Past' ? 'Past Resident' : 'Current Resident'}
              </div>
            </div>
            {!isEditing && (
              <button onClick={() => { setEditData(t); setIsEditing(true) }} style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                Edit
              </button>
            )}
          </div>

          {isEditing ? (
            /* ---- EDIT MODE ---- */
            <form onSubmit={handleSaveEdit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <div>
                  <label style={lbl}>Name *</label>
                  <input type="text" value={editData.tenant_name} onChange={(e) => setEditData({...editData, tenant_name: e.target.value})} required style={inp} />
                </div>
                <div>
                  <label style={lbl}>Property</label>
                  <select value={editData.property_name || ''} onChange={(e) => setEditData({...editData, property_name: e.target.value})} style={{...inp, backgroundColor: 'white'}}>
                    <option value="">-- Select a property --</option>
                    {properties.map((p, i) => <option key={i} value={p.property_name}>{p.property_name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Phone</label>
                  <input type="text" value={editData.phone || ''} onChange={(e) => setEditData({...editData, phone: e.target.value})} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Deposit Amount (₹)</label>
                  <input type="number" step="0.01" value={editData.deposit_amount || ''} onChange={(e) => setEditData({...editData, deposit_amount: e.target.value})} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Date of Joining</label>
                  <input type="date" value={editData.date_of_joining || ''} onChange={(e) => setEditData({...editData, date_of_joining: e.target.value})} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Initial Rent (₹)</label>
                  <input type="number" step="0.01" value={editData.initial_rent || ''} onChange={(e) => setEditData({...editData, initial_rent: e.target.value})} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Current Rent (₹)</label>
                  <input type="number" step="0.01" value={editData.current_rent || ''} onChange={(e) => setEditData({...editData, current_rent: e.target.value})} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Status</label>
                  <select value={editData.status || 'Current'} onChange={(e) => setEditData({...editData, status: e.target.value})} style={{...inp, backgroundColor: 'white'}}>
                    <option value="Current">Current</option>
                    <option value="Past">Past</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={lbl}>Notes</label>
                <textarea value={editData.notes || ''} onChange={(e) => setEditData({...editData, notes: e.target.value})} rows="4" placeholder="Add any notes about this tenant..." style={{...inp, resize: 'vertical'}} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ padding: '10px 24px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>Save Changes</button>
                <button type="button" onClick={() => setIsEditing(false)} style={{ padding: '10px 24px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>Cancel</button>
              </div>
            </form>
          ) : (
            /* ---- VIEW MODE ---- */
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '28px' }}>
                <DetailField label="Property" value={t.property_name} />
                <DetailField label="Phone" value={t.phone} />
                <DetailField label="Deposit" value={fmtMoney(t.deposit_amount)} />
                <DetailField label="Date of Joining" value={fmtDate(t.date_of_joining)} />
                <DetailField label="Initial Rent" value={fmtMoney(t.initial_rent)} />
                <DetailField label="Current Rent" value={fmtMoney(t.current_rent)} />
                <DetailField label="Status" value={t.status === 'Past' ? 'Past Resident' : 'Current Resident'} />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '8px' }}>Notes</div>
                <div style={{ fontSize: '14px', color: '#111827', lineHeight: '1.6', whiteSpace: 'pre-wrap', backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', minHeight: '60px' }}>
                  {t.notes || 'No notes yet. Click Edit to add some.'}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // ============ LIST PAGE ============
  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>👥 Tenants</h1>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>Manage your tenant records</p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} style={{ padding: '10px 20px', backgroundColor: showAddForm ? '#6b7280' : '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap', transition: 'background-color 0.2s' }}>
          {showAddForm ? '✕ Cancel' : '+ Add Tenant'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
          <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600', marginBottom: '8px' }}>TOTAL TENANTS</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#2563eb' }}>{tenants.length}</div>
        </div>
      </div>

      {/* Add Tenant Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>➕ Add New Tenant</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={lbl}>Name *</label>
              <input type="text" value={formData.tenant_name} onChange={(e) => setFormData({...formData, tenant_name: e.target.value})} required placeholder="e.g., Frida Allen" style={inp} />
            </div>
            <div>
              <label style={lbl}>Property</label>
              <select value={formData.property_name} onChange={(e) => setFormData({...formData, property_name: e.target.value})} style={{...inp, backgroundColor: 'white'}}>
                <option value="">-- Select a property --</option>
                {properties.map((p, i) => <option key={i} value={p.property_name}>{p.property_name}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Phone</label>
              <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="e.g., +91 98765 43210" style={inp} />
            </div>
            <div>
              <label style={lbl}>Deposit Amount (₹)</label>
              <input type="number" step="0.01" value={formData.deposit_amount} onChange={(e) => setFormData({...formData, deposit_amount: e.target.value})} placeholder="0.00" style={inp} />
            </div>
            <div>
              <label style={lbl}>Date of Joining</label>
              <input type="date" value={formData.date_of_joining} onChange={(e) => setFormData({...formData, date_of_joining: e.target.value})} style={inp} />
            </div>
            <div>
              <label style={lbl}>Initial Rent (₹)</label>
              <input type="number" step="0.01" value={formData.initial_rent} onChange={(e) => setFormData({...formData, initial_rent: e.target.value})} placeholder="0.00" style={inp} />
            </div>
            <div>
              <label style={lbl}>Current Rent (₹)</label>
              <input type="number" step="0.01" value={formData.current_rent} onChange={(e) => setFormData({...formData, current_rent: e.target.value})} placeholder="0.00" style={inp} />
            </div>
            <div>
              <label style={lbl}>Status</label>
              <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} style={{...inp, backgroundColor: 'white'}}>
                <option value="Current">Current</option>
                <option value="Past">Past</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <label style={lbl}>Notes</label>
            <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows="3" placeholder="Optional notes..." style={{...inp, resize: 'vertical'}} />
          </div>
          <button type="submit" style={{ marginTop: '20px', padding: '10px 24px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>Save Tenant</button>
        </form>
      )}

      {/* Tenants List */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>All Tenants</h2>

        {tenants.length === 0 ? (
          <div style={{ backgroundColor: 'white', padding: '60px 40px', borderRadius: '12px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
            <p style={{ color: '#6b7280', fontSize: '16px' }}>No tenants yet. Click "+ Add Tenant" above to add your first one!</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={th}>Name</th>
                  <th style={th}>Property</th>
                  <th style={th}>Phone</th>
                  <th style={th}>Deposit</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant.id}>
                    <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>
                      <button onClick={() => openTenant(tenant)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                        <div style={{ fontSize: '15px', color: '#2563eb', fontWeight: '700', textDecoration: 'underline' }}>{tenant.tenant_name}</div>
                        <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', color: tenant.status === 'Past' ? '#9ca3af' : '#059669', textTransform: 'uppercase', marginTop: '2px' }}>
                          {tenant.status === 'Past' ? 'Past Resident' : 'Current Resident'}
                        </div>
                      </button>
                    </td>
                    <td style={td}>{tenant.property_name || '-'}</td>
                    <td style={td}>{tenant.phone || '-'}</td>
                    <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#059669', fontWeight: '600' }}>
                      {tenant.deposit_amount ? `₹${parseFloat(tenant.deposit_amount).toLocaleString('en-IN')}` : '-'}
                    </td>
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

// Shared style snippets
const lbl = { display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '13px' }
const inp = { width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }
const th = { padding: '16px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'left' }
const td = { padding: '12px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }

function DetailField({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '15px', color: '#111827', fontWeight: '500' }}>{value || '-'}</div>
    </div>
  )
}