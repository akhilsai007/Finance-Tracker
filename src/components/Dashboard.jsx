import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    expenses: [],
    rentals: [],
    interests: [],
    insurances: [],
    houseTaxes: [],
    properties: []
  })

  useEffect(() => {
    fetchAllData()
  }, [])

  async function fetchAllData() {
    try {
      const [expenses, rentals, interests, insurances, houseTaxes, properties] = await Promise.all([
        supabase.from('expenses').select('*').order('date', { ascending: false }),
        supabase.from('rental_income').select('*'),
        supabase.from('interest_tracker').select('*'),
        supabase.from('insurance_policies').select('*'),
        supabase.from('house_taxes').select('*'),
        supabase.from('property_details').select('*')
      ])

      setData({
        expenses: expenses.data || [],
        rentals: rentals.data || [],
        interests: interests.data || [],
        insurances: insurances.data || [],
        houseTaxes: houseTaxes.data || [],
        properties: properties.data || []
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate expense analytics
  const totalExpenses = data.expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)
  const expenseCount = data.expenses.length

  // Calculate rental income analytics
  const totalRentalIncome = data.rentals.reduce((sum, r) => sum + parseFloat(r.rent_amount || 0), 0)
  const unpaidRentals = data.rentals.filter(r => !r.paid).length

  // Calculate interest analytics
  const totalInterest = data.interests.reduce((sum, i) => {
    const principal = parseFloat(i.principal_amount || 0)
    const rate = parseFloat(i.interest_rate || 0)
    return sum + (principal * rate / 100)
  }, 0)

  // Calculate insurance analytics
  const totalInsurancePremium = data.insurances.reduce((sum, i) => sum + parseFloat(i.premium_amount || 0), 0)
  const upcomingRenewals = data.insurances.filter(i => {
    if (!i.renewal_date) return false
    const daysUntilRenewal = Math.ceil((new Date(i.renewal_date) - new Date()) / (1000 * 60 * 60 * 24))
    return daysUntilRenewal <= 30 && daysUntilRenewal >= 0
  }).length

  // Calculate house tax analytics
  const totalHouseTax = data.houseTaxes.reduce((sum, t) => {
    const assessment = parseFloat(t.assessment_amount || 0)
    const water = parseFloat(t.water_amount || 0)
    const sewerage = parseFloat(t.sewerage_amount || 0)
    return sum + assessment + water + sewerage
  }, 0)

  // Calculate property analytics
  const totalPropertyValue = data.properties.reduce((sum, p) => sum + parseFloat(p.purchase_value || 0), 0)
  const propertyCount = data.properties.length

  // Get recent expenses
  const recentExpenses = data.expenses.slice(0, 5)

  // Get expense trends by group
  const expenseByGroup = {}
  data.expenses.forEach(e => {
    const group = e.group_name || 'Uncategorized'
    expenseByGroup[group] = (expenseByGroup[group] || 0) + parseFloat(e.amount || 0)
  })
  const topGroups = Object.entries(expenseByGroup)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
        Loading dashboard...
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
          📊 Dashboard
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>
          Overview of your financial activity
        </p>
      </div>

      {/* Main Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {/* Total Expenses */}
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>
              TOTAL EXPENSES
            </div>
            <span style={{ fontSize: '24px' }}>💸</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#dc2626', marginBottom: '4px' }}>
            ₹{totalExpenses.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280' }}>
            {expenseCount} transactions
          </div>
        </div>

        {/* Total Rental Income */}
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>
              RENTAL INCOME
            </div>
            <span style={{ fontSize: '24px' }}>🏠</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#059669', marginBottom: '4px' }}>
            ₹{totalRentalIncome.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280' }}>
            {unpaidRentals > 0 ? `${unpaidRentals} unpaid` : 'All paid'}
          </div>
        </div>

        {/* Total Interest */}
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>
              ANNUAL INTEREST
            </div>
            <span style={{ fontSize: '24px' }}>💰</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#2563eb', marginBottom: '4px' }}>
            ₹{totalInterest.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280' }}>
            {data.interests.length} active
          </div>
        </div>

        {/* Insurance Premiums */}
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>
              INSURANCE PREMIUM
            </div>
            <span style={{ fontSize: '24px' }}>📋</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#7c3aed', marginBottom: '4px' }}>
            ₹{totalInsurancePremium.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280' }}>
            {upcomingRenewals > 0 ? `${upcomingRenewals} renewing soon` : 'No upcoming renewals'}
          </div>
        </div>

        {/* House Taxes */}
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>
              HOUSE TAXES
            </div>
            <span style={{ fontSize: '24px' }}>🏘️</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#ea580c', marginBottom: '4px' }}>
            ₹{totalHouseTax.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280' }}>
            {data.houseTaxes.length} records
          </div>
        </div>

        {/* Property Value */}
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>
              PROPERTY VALUE
            </div>
            <span style={{ fontSize: '24px' }}>🏘️</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#059669', marginBottom: '4px' }}>
            ₹{totalPropertyValue.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280' }}>
            {propertyCount} {propertyCount === 1 ? 'property' : 'properties'}
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* Top Spending Categories */}
        {topGroups.length > 0 && (
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>
              💳 Top Spending Categories
            </h3>
            {topGroups.map(([group, amount]) => (
              <div key={group} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>{group}</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#2563eb' }}>
                    ₹{amount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${(amount / totalExpenses) * 100}%`,
                    height: '100%',
                    backgroundColor: '#2563eb',
                    borderRadius: '4px',
                    transition: 'width 0.3s'
                  }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent Expenses */}
        {recentExpenses.length > 0 && (
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>
              🕐 Recent Expenses
            </h3>
            {recentExpenses.map(expense => (
              <div key={expense.id} style={{
                padding: '12px 0',
                borderBottom: '1px solid #f3f4f6',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '2px' }}>
                    {expense.category || expense.group_name || 'Expense'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {new Date(expense.date).toLocaleDateString('en-IN')}
                  </div>
                </div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#dc2626' }}>
                  ₹{parseFloat(expense.amount).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upcoming Insurance Renewals */}
        {upcomingRenewals > 0 && (
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>
              ⏰ Upcoming Renewals
            </h3>
            {data.insurances
              .filter(i => {
                if (!i.renewal_date) return false
                const daysUntilRenewal = Math.ceil((new Date(i.renewal_date) - new Date()) / (1000 * 60 * 60 * 24))
                return daysUntilRenewal <= 30 && daysUntilRenewal >= 0
              })
              .map(insurance => {
                const daysUntilRenewal = Math.ceil((new Date(insurance.renewal_date) - new Date()) / (1000 * 60 * 60 * 24))
                return (
                  <div key={insurance.id} style={{
                    padding: '12px 16px',
                    backgroundColor: daysUntilRenewal <= 7 ? '#fef3c7' : '#f3f4f6',
                    borderRadius: '8px',
                    marginBottom: '12px'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                      {insurance.policy_name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      Renews in {daysUntilRenewal} {daysUntilRenewal === 1 ? 'day' : 'days'}
                    </div>
                  </div>
                )
              })}
          </div>
        )}

        {/* Quick Summary */}
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>
            📈 Quick Summary
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>Net Cash Flow</span>
              <span style={{ fontSize: '16px', fontWeight: '700', color: totalRentalIncome - totalExpenses > 0 ? '#059669' : '#dc2626' }}>
                ₹{(totalRentalIncome - totalExpenses).toLocaleString('en-IN')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>Total Properties</span>
              <span style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>
                {propertyCount}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>Active Rentals</span>
              <span style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>
                {data.rentals.length}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>Insurance Policies</span>
              <span style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>
                {data.insurances.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}