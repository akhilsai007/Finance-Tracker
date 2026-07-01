import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function InterestTracker({ filterType = 'Monthly' }) {
  const [agreements, setAgreements] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [intervalChoice, setIntervalChoice] = useState('1')
  const [selected, setSelected] = useState(null)
  const [isEditingAgreement, setIsEditingAgreement] = useState(false)
  const [editAgreement, setEditAgreement] = useState(null)

  // list controls
  const [statusFilter, setStatusFilter] = useState('Active') // Active | Closed | All | Pending
  const [sortByName, setSortByName] = useState(false)

  const [showLogForm, setShowLogForm] = useState(false)
  const [editingPayment, setEditingPayment] = useState(null)
  const [paymentForm, setPaymentForm] = useState({
    date_paid: new Date().toISOString().split('T')[0],
    amount_paid: '',
    period_covered: '',
    payment_method: 'Cash',
    note: ''
  })

  const [formData, setFormData] = useState({
    person_name: '',
    principal_amount: '',
    interest_rate: '',
    interest_type: filterType,
    month_interval: 1,
    start_date: '',
    notes: ''
  })

  useEffect(() => {
    fetchAll()
    const agChannel = supabase.channel('interest_tracker_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'interest_tracker' }, () => fetchAll())
      .subscribe()
    const payChannel = supabase.channel('interest_payments_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'interest_payments' }, () => fetchAll())
      .subscribe()
    return () => {
      supabase.removeChannel(agChannel)
      supabase.removeChannel(payChannel)
    }
  }, [])

  useEffect(() => {
    setFormData(prev => ({ ...prev, interest_type: filterType }))
  }, [filterType])

  async function fetchAll() {
    try {
      const [agRes, payRes] = await Promise.all([
        supabase.from('interest_tracker').select('*').order('created_at', { ascending: false }),
        supabase.from('interest_payments').select('*').order('date_paid', { ascending: false })
      ])
      if (agRes.error) throw agRes.error
      if (payRes.error) throw payRes.error
      setAgreements(agRes.data || [])
      setPayments(payRes.data || [])
      setSelected(prev => prev ? (agRes.data || []).find(a => a.id === prev.id) || prev : null)
    } catch (error) {
      alert('Error loading data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  function fmtDate(d) {
    if (!d) return '-'
    const [y, m, day] = d.split('T')[0].split('-')
    return new Date(y, m - 1, day).toLocaleDateString('en-IN')
  }
  function fmtMoney(n) {
    return (n || n === 0) ? `₹${parseFloat(n).toLocaleString('en-IN')}` : '-'
  }
  function calcInterest(a) {
    const p = parseFloat(a.principal_amount) || 0
    const r = parseFloat(a.interest_rate) || 0
    return (p * r) / 100
  }
  function paymentsFor(id) {
    return payments.filter(p => p.interest_id === id)
  }
  function lastPaymentDate(id) {
    const ps = paymentsFor(id)
    if (ps.length === 0) return null
    return ps.reduce((latest, p) => (new Date(p.date_paid) > new Date(latest) ? p.date_paid : latest), ps[0].date_paid)
  }

  // Periods elapsed — counts up to today, OR up to the closing date if closed
  function periodsElapsed(a) {
    if (!a.start_date) return 0
    const start = new Date(a.start_date.split('T')[0])
    // freeze at closed_date if the entry is closed and has one
    const end = (a.status === 'Closed' && a.closed_date)
      ? new Date(a.closed_date.split('T')[0])
      : new Date()
    if (end < start) return 0

    if (a.interest_type === 'Yearly') {
      let years = end.getFullYear() - start.getFullYear()
      const anniv = new Date(end.getFullYear(), start.getMonth(), start.getDate())
      if (end < anniv) years -= 1
      return Math.max(0, years)
    } else {
      const interval = a.month_interval || 1
      let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
      if (end.getDate() < start.getDate()) months -= 1
      return Math.max(0, Math.floor(months / interval))
    }
  }
  function totalDue(a) { return periodsElapsed(a) * calcInterest(a) }
  function totalPaid(id) { return paymentsFor(id).reduce((s, p) => s + parseFloat(p.amount_paid || 0), 0) }
  function outstanding(a) { return totalDue(a) - totalPaid(a.id) }

  // ===== Agreement CRUD =====
  async function handleAddAgreement(e) {
    e.preventDefault()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('interest_tracker').insert([{
        person_name: formData.person_name,
        principal_amount: formData.principal_amount ? parseFloat(formData.principal_amount) : null,
        interest_rate: formData.interest_rate ? parseFloat(formData.interest_rate) : null,
        interest_type: filterType,
        month_interval: filterType === 'Monthly' ? parseInt(formData.month_interval) : null,
        start_date: formData.start_date || null,
        notes: formData.notes,
        status: 'Active',
        user_id: user.id
      }])
      if (error) throw error
      setFormData({ person_name: '', principal_amount: '', interest_rate: '', interest_type: filterType, month_interval: 1, start_date: '', notes: '' })
      setIntervalChoice('1')
      setShowAddForm(false)
    } catch (error) {
      alert('Error adding agreement: ' + error.message)
    }
  }

  async function handleSaveAgreement(e) {
    e.preventDefault()
    try {
      const { error } = await supabase.from('interest_tracker').update({
        person_name: editAgreement.person_name,
        principal_amount: editAgreement.principal_amount ? parseFloat(editAgreement.principal_amount) : null,
        interest_rate: editAgreement.interest_rate ? parseFloat(editAgreement.interest_rate) : null,
        month_interval: editAgreement.interest_type === 'Monthly' ? parseInt(editAgreement.month_interval) : null,
        start_date: editAgreement.start_date || null,
        notes: editAgreement.notes
      }).eq('id', editAgreement.id)
      if (error) throw error
      setSelected(editAgreement)
      setIsEditingAgreement(false)
    } catch (error) {
      alert('Error updating agreement: ' + error.message)
    }
  }

  // Close or reopen an agreement
  async function toggleClosed(a) {
    const closing = a.status !== 'Closed'
    if (closing && !confirm('Mark this entry as Closed? Interest will stop accruing as of today. Any outstanding balance will remain visible.')) return
    try {
      const { error } = await supabase.from('interest_tracker').update({
        status: closing ? 'Closed' : 'Active',
        closed_date: closing ? new Date().toISOString().split('T')[0] : null
      }).eq('id', a.id)
      if (error) throw error
      setSelected({ ...a, status: closing ? 'Closed' : 'Active', closed_date: closing ? new Date().toISOString().split('T')[0] : null })
    } catch (error) {
      alert('Error updating status: ' + error.message)
    }
  }

  async function handleDeleteAgreement(id) {
    if (!confirm('Delete this agreement and ALL its payment history? This cannot be undone.')) return
    try {
      const { error } = await supabase.from('interest_tracker').delete().eq('id', id)
      if (error) throw error
      setSelected(null)
    } catch (error) {
      alert('Error deleting agreement: ' + error.message)
    }
  }

  // ===== Payment CRUD =====
  async function handleLogPayment(e) {
    e.preventDefault()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('interest_payments').insert([{
        interest_id: selected.id,
        date_paid: paymentForm.date_paid,
        amount_paid: paymentForm.amount_paid ? parseFloat(paymentForm.amount_paid) : 0,
        period_covered: paymentForm.period_covered,
        payment_method: paymentForm.payment_method,
        note: paymentForm.note,
        user_id: user.id
      }])
      if (error) throw error
      setPaymentForm({ date_paid: new Date().toISOString().split('T')[0], amount_paid: '', period_covered: '', payment_method: 'Cash', note: '' })
      setShowLogForm(false)
    } catch (error) {
      alert('Error logging payment: ' + error.message)
    }
  }

  async function handleUpdatePayment(e) {
    e.preventDefault()
    try {
      const { error } = await supabase.from('interest_payments').update({
        date_paid: editingPayment.date_paid,
        amount_paid: editingPayment.amount_paid ? parseFloat(editingPayment.amount_paid) : 0,
        period_covered: editingPayment.period_covered,
        payment_method: editingPayment.payment_method,
        note: editingPayment.note
      }).eq('id', editingPayment.id)
      if (error) throw error
      setEditingPayment(null)
    } catch (error) {
      alert('Error updating payment: ' + error.message)
    }
  }

  async function handleDeletePayment(id) {
    if (!confirm('Delete this payment record?')) return
    try {
      const { error } = await supabase.from('interest_payments').delete().eq('id', id)
      if (error) throw error
    } catch (error) {
      alert('Error deleting payment: ' + error.message)
    }
  }

  function openAgreement(a) {
    setSelected(a); setIsEditingAgreement(false); setShowLogForm(false); setEditingPayment(null)
  }

  const isMonthly = filterType === 'Monthly'

  // ===== Build the visible list: type → filter → sort =====
  let records = agreements.filter(a => a.interest_type === filterType)

  records = records.filter(a => {
    if (statusFilter === 'Active') return a.status !== 'Closed'
    if (statusFilter === 'Closed') return a.status === 'Closed'
    if (statusFilter === 'Pending') return outstanding(a) > 0  // active OR closed, anything owed
    return true // All
  })

  if (sortByName) {
    records = [...records].sort((x, y) => (x.person_name || '').localeCompare(y.person_name || ''))
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading...</div>

  // ============ DETAIL PAGE ============
  if (selected) {
    const a = selected
    const history = paymentsFor(a.id)
    const due = totalDue(a)
    const paid = totalPaid(a.id)
    const bal = due - paid
    const isClosed = a.status === 'Closed'

    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px' }}>
        <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '600', fontSize: '14px', cursor: 'pointer', marginBottom: '24px', padding: 0 }}>
          ← Back to {isMonthly ? 'monthly' : 'yearly'} interests
        </button>

        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)', padding: '32px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase', color: isClosed ? '#9ca3af' : '#059669', marginBottom: '4px' }}>
                {isClosed ? `Closed${a.closed_date ? ' · ' + fmtDate(a.closed_date) : ''}` : 'Active'}
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#2563eb', marginBottom: '4px' }}>{a.person_name}</h1>
              <div style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.05em', color: '#6b7280', textTransform: 'uppercase' }}>
                {a.interest_type} Interest{isMonthly && a.month_interval ? ` · Every ${a.month_interval} month${a.month_interval > 1 ? 's' : ''}` : ''}
              </div>
            </div>
            {!isEditingAgreement && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setEditAgreement(a); setIsEditingAgreement(true) }} style={btnBlue}>Edit</button>
                <button onClick={() => toggleClosed(a)} style={isClosed ? btnGreen : btnGray}>{isClosed ? 'Reopen' : 'Mark Closed'}</button>
                <button onClick={() => handleDeleteAgreement(a.id)} style={btnRed}>Delete</button>
              </div>
            )}
          </div>

          {isEditingAgreement ? (
            <form onSubmit={handleSaveAgreement}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div><label style={lbl}>Person Name *</label><input type="text" value={editAgreement.person_name} onChange={(e) => setEditAgreement({...editAgreement, person_name: e.target.value})} required style={inp} /></div>
                <div><label style={lbl}>Principal (₹)</label><input type="number" step="0.01" value={editAgreement.principal_amount || ''} onChange={(e) => setEditAgreement({...editAgreement, principal_amount: e.target.value})} style={inp} /></div>
                <div><label style={lbl}>Rate (%)</label><input type="number" step="0.01" value={editAgreement.interest_rate || ''} onChange={(e) => setEditAgreement({...editAgreement, interest_rate: e.target.value})} style={inp} /></div>
                {isMonthly && <div><label style={lbl}>Pays Every (months)</label><input type="number" min="1" value={editAgreement.month_interval || ''} onChange={(e) => setEditAgreement({...editAgreement, month_interval: e.target.value})} style={inp} /></div>}
                <div><label style={lbl}>Start Date</label><input type="date" value={editAgreement.start_date ? editAgreement.start_date.split('T')[0] : ''} onChange={(e) => setEditAgreement({...editAgreement, start_date: e.target.value})} style={inp} /></div>
              </div>
              <div style={{ marginBottom: '16px' }}><label style={lbl}>Notes</label><input type="text" value={editAgreement.notes || ''} onChange={(e) => setEditAgreement({...editAgreement, notes: e.target.value})} style={inp} /></div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" style={btnGreen}>Save Changes</button>
                <button type="button" onClick={() => setIsEditingAgreement(false)} style={btnGray}>Cancel</button>
              </div>
            </form>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <Field label="Principal" value={fmtMoney(a.principal_amount)} />
                <Field label="Rate" value={a.interest_rate ? `${a.interest_rate}%` : '-'} />
                <Field label="Interest / Period" value={fmtMoney(calcInterest(a))} />
                <Field label="Start Date" value={fmtDate(a.start_date)} />
                <Field label="Last Paid" value={fmtDate(lastPaymentDate(a.id))} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', backgroundColor: '#f9fafb', padding: '20px', borderRadius: '10px' }}>
                <div>
                  <div style={statLbl}>TOTAL DUE {isClosed ? '(AT CLOSING)' : '(ACCRUED)'}</div>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: '#111827' }}>{fmtMoney(due)}</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                    {periodsElapsed(a)} {isMonthly ? (a.month_interval > 1 ? `× ${a.month_interval}-month` : 'month') : 'year'} period{periodsElapsed(a) !== 1 ? 's' : ''}
                  </div>
                </div>
                <div>
                  <div style={statLbl}>TOTAL PAID</div>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: '#059669' }}>{fmtMoney(paid)}</div>
                </div>
                <div>
                  <div style={statLbl}>OUTSTANDING</div>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: bal > 0 ? '#dc2626' : '#059669' }}>{bal > 0 ? fmtMoney(bal) : '✓ Clear'}</div>
                </div>
              </div>

              {!a.start_date && (
                <div style={{ marginTop: '16px', padding: '12px 16px', backgroundColor: '#fef3c7', borderRadius: '8px', fontSize: '13px', color: '#92400e' }}>
                  ⚠️ Set a start date (via Edit) to track the accrued balance correctly.
                </div>
              )}
              {a.notes && <div style={{ marginTop: '20px' }}><Field label="Notes" value={a.notes} /></div>}
            </>
          )}
        </div>

        {/* Payment history */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)', padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: 0 }}>Payment History</h2>
            <button onClick={() => setShowLogForm(!showLogForm)} style={{ padding: '10px 20px', backgroundColor: showLogForm ? '#6b7280' : '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
              {showLogForm ? '✕ Cancel' : '+ Log Payment'}
            </button>
          </div>

          {showLogForm && (
            <form onSubmit={handleLogPayment} style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px', marginBottom: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                <div><label style={lbl}>Date Paid *</label><input type="date" value={paymentForm.date_paid} onChange={(e) => setPaymentForm({...paymentForm, date_paid: e.target.value})} required style={inp} /></div>
                <div><label style={lbl}>Amount Paid (₹) *</label><input type="number" step="0.01" value={paymentForm.amount_paid} onChange={(e) => setPaymentForm({...paymentForm, amount_paid: e.target.value})} required placeholder={calcInterest(a).toString()} style={inp} /></div>
                <div><label style={lbl}>Period Covered</label><input type="text" value={paymentForm.period_covered} onChange={(e) => setPaymentForm({...paymentForm, period_covered: e.target.value})} placeholder="e.g., June 2026" style={inp} /></div>
                <div><label style={lbl}>Payment Method</label>
                  <select value={paymentForm.payment_method} onChange={(e) => setPaymentForm({...paymentForm, payment_method: e.target.value})} style={{...inp, backgroundColor: 'white'}}>
                    <option>Cash</option><option>Bank Transfer</option><option>UPI</option><option>Cheque</option><option>Other</option>
                  </select>
                </div>
                <div style={{ gridColumn: 'span 2' }}><label style={lbl}>Note</label><input type="text" value={paymentForm.note} onChange={(e) => setPaymentForm({...paymentForm, note: e.target.value})} placeholder="Optional..." style={inp} /></div>
              </div>
              <button type="submit" style={btnGreen}>Save Payment</button>
            </form>
          )}

          {history.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center', padding: '20px' }}>No payments logged yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    <th style={th}>Date Paid</th><th style={th}>Amount</th><th style={th}>Period</th><th style={th}>Method</th><th style={th}>Note</th><th style={{...th, textAlign: 'center'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(p => (
                    <tr key={p.id}>
                      {editingPayment?.id === p.id ? (
                        <td colSpan="6" style={{ padding: '16px', borderBottom: '1px solid #f3f4f6' }}>
                          <form onSubmit={handleUpdatePayment} style={{ backgroundColor: '#fef3c7', padding: '16px', borderRadius: '8px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                              <input type="date" value={editingPayment.date_paid ? editingPayment.date_paid.split('T')[0] : ''} onChange={(e) => setEditingPayment({...editingPayment, date_paid: e.target.value})} required style={editInp} />
                              <input type="number" step="0.01" value={editingPayment.amount_paid} onChange={(e) => setEditingPayment({...editingPayment, amount_paid: e.target.value})} required placeholder="Amount" style={editInp} />
                              <input type="text" value={editingPayment.period_covered || ''} onChange={(e) => setEditingPayment({...editingPayment, period_covered: e.target.value})} placeholder="Period" style={editInp} />
                              <select value={editingPayment.payment_method || 'Cash'} onChange={(e) => setEditingPayment({...editingPayment, payment_method: e.target.value})} style={{...editInp, backgroundColor: 'white'}}>
                                <option>Cash</option><option>Bank Transfer</option><option>UPI</option><option>Cheque</option><option>Other</option>
                              </select>
                              <input type="text" value={editingPayment.note || ''} onChange={(e) => setEditingPayment({...editingPayment, note: e.target.value})} placeholder="Note" style={editInp} />
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button type="submit" style={btnGreenSm}>Save</button>
                              <button type="button" onClick={() => setEditingPayment(null)} style={btnGraySm}>Cancel</button>
                            </div>
                          </form>
                        </td>
                      ) : (
                        <>
                          <td style={{...td, color: '#111827', fontWeight: '600'}}>{fmtDate(p.date_paid)}</td>
                          <td style={{...td, color: '#059669', fontWeight: '700'}}>{fmtMoney(p.amount_paid)}</td>
                          <td style={td}>{p.period_covered || '-'}</td>
                          <td style={td}>{p.payment_method || '-'}</td>
                          <td style={td}>{p.note || '-'}</td>
                          <td style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button onClick={() => setEditingPayment(p)} style={btnBlueSm}>Edit</button>
                              <button onClick={() => handleDeletePayment(p.id)} style={btnRedSm}>Delete</button>
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

  // ============ LIST PAGE ============
  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>💰 {isMonthly ? 'Monthly Interests' : 'Yearly Interests'}</h1>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>{isMonthly ? 'Interest paid on a monthly cycle' : 'Interest paid yearly'}</p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} style={{ padding: '10px 20px', backgroundColor: showAddForm ? '#6b7280' : '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap' }}>
          {showAddForm ? '✕ Cancel' : '+ Add Interest'}
        </button>
      </div>

      {/* Filter + sort controls */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>Show:</span>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '8px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', backgroundColor: 'white', fontWeight: '600', color: '#374151' }}>
            <option value="Active">Active</option>
            <option value="Pending">Pending (owes money)</option>
            <option value="Closed">Closed</option>
            <option value="All">All</option>
          </select>
        </div>
        <button
          onClick={() => setSortByName(!sortByName)}
          style={{ padding: '8px 14px', border: '2px solid', borderColor: sortByName ? '#2563eb' : '#e5e7eb', backgroundColor: sortByName ? '#eff6ff' : 'white', color: sortByName ? '#2563eb' : '#374151', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
        >
          {sortByName ? '✓ Sorted by Name' : 'Sort by Name (A–Z)'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddAgreement} style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>➕ Add New {isMonthly ? 'Monthly' : 'Yearly'} Interest</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div><label style={lbl}>Person Name *</label><input type="text" value={formData.person_name} onChange={(e) => setFormData({...formData, person_name: e.target.value})} required placeholder="e.g., Ramesh" style={inp} /></div>
            <div><label style={lbl}>Principal Amount (₹)</label><input type="number" step="0.01" value={formData.principal_amount} onChange={(e) => setFormData({...formData, principal_amount: e.target.value})} placeholder="0.00" style={inp} /></div>
            <div><label style={lbl}>Interest Rate (%)</label><input type="number" step="0.01" value={formData.interest_rate} onChange={(e) => setFormData({...formData, interest_rate: e.target.value})} placeholder="e.g., 2" style={inp} /></div>
            {isMonthly && (
              <div>
                <label style={lbl}>Pays Every</label>
                <select value={intervalChoice} onChange={(e) => { const v = e.target.value; setIntervalChoice(v); if (v !== 'other') setFormData({...formData, month_interval: parseInt(v)}) }} style={{...inp, backgroundColor: 'white'}}>
                  <option value="1">1 month</option><option value="2">2 months</option><option value="3">3 months</option><option value="6">6 months</option><option value="other">Other...</option>
                </select>
                {intervalChoice === 'other' && <input type="number" min="1" value={formData.month_interval} onChange={(e) => setFormData({...formData, month_interval: e.target.value})} placeholder="No. of months" style={{...inp, marginTop: '8px'}} />}
              </div>
            )}
            <div><label style={lbl}>Start Date</label><input type="date" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} style={inp} /></div>
            <div style={{ gridColumn: 'span 2' }}><label style={lbl}>Notes</label><input type="text" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Optional notes..." style={inp} /></div>
          </div>
          <button type="submit" style={{ marginTop: '20px', padding: '10px 24px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>Save</button>
        </form>
      )}

      {records.length === 0 ? (
        <div style={{ backgroundColor: 'white', padding: '60px 40px', borderRadius: '12px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💰</div>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>No records match this filter.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th style={th}>Person</th><th style={th}>Principal</th><th style={th}>Rate</th>
                {isMonthly && <th style={th}>Frequency</th>}
                <th style={th}>Interest / Period</th><th style={th}>Last Paid</th><th style={th}>Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {records.map(a => {
                const last = lastPaymentDate(a.id)
                const bal = outstanding(a)
                const isClosed = a.status === 'Closed'
                return (
                  <tr key={a.id}>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
                      <button onClick={() => openAgreement(a)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase', color: isClosed ? '#9ca3af' : '#059669', marginBottom: '2px' }}>
                          {isClosed ? 'Closed' : 'Active'}
                        </div>
                        <div style={{ fontSize: '15px', color: '#2563eb', fontWeight: '700', textDecoration: 'underline' }}>{a.person_name}</div>
                      </button>
                    </td>
                    <td style={td}>{fmtMoney(a.principal_amount)}</td>
                    <td style={td}>{a.interest_rate ? `${a.interest_rate}%` : '-'}</td>
                    {isMonthly && <td style={td}>{a.month_interval === 1 ? 'Every month' : `Every ${a.month_interval} months`}</td>}
                    <td style={{...td, color: '#059669', fontWeight: '700'}}>{fmtMoney(calcInterest(a))}</td>
                    <td style={td}>{last ? fmtDate(last) : 'Never'}</td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
                      {bal > 0
                        ? <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', backgroundColor: '#fee2e2', color: '#991b1b' }}>⏳ {fmtMoney(bal)} pending</span>
                        : <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', backgroundColor: '#d1fae5', color: '#065f46' }}>✓ Up to date</span>
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '15px', color: '#111827', fontWeight: '500' }}>{value}</div>
    </div>
  )
}

const lbl = { display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '13px' }
const inp = { width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }
const editInp = { padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }
const th = { padding: '14px 16px', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#374151', fontSize: '13px', textAlign: 'left' }
const td = { padding: '12px 16px', borderBottom: '1px solid #f3f4f6', fontSize: '13px', color: '#6b7280' }
const statLbl = { fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '6px' }
const btnBlue = { padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }
const btnRed = { padding: '10px 20px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }
const btnGreen = { padding: '10px 20px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }
const btnGray = { padding: '10px 20px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }
const btnBlueSm = { padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }
const btnRedSm = { padding: '6px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }
const btnGreenSm = { padding: '6px 16px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }
const btnGraySm = { padding: '6px 16px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }