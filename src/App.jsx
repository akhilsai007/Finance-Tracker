import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import Expenses from './components/Expenses'
import RentalIncome from './components/RentalIncome'
import InterestTracker from './components/InterestTracker'
import InsurancePolicies from './components/InsurancePolicies'
import HouseTaxes from './components/HouseTaxes'
import PropertyDetails from './components/PropertyDetails'
import Dashboard from './components/Dashboard'
import Gold from './components/Gold'
import Tenants from './components/Tenants'
import OutstandingBalances from './components/OutstandingBalances'
import RentalProperties from './components/RentalProperties'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [rentalExpanded, setRentalExpanded] = useState(false)
  const [interestExpanded, setInterestExpanded] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

function go(tab) {
  setActiveTab(tab)
  setSidebarOpen(false)
  }

  // Check if user is logged in on mount
  useEffect(() => {
    checkUser()

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  // Auto-logout after inactivity
  useEffect(() => {
    if (!user) return // Don't run if not logged in

    let inactivityTimer

    // Reset the timer on any user activity
    const resetTimer = () => {
      clearTimeout(inactivityTimer)
      inactivityTimer = setTimeout(() => {
        handleLogout()
        alert('You have been logged out due to inactivity.')
      }, 3600000) // currently 1 hour
    }

    // Activity events to track
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, resetTimer)
    })

    // Start the timer
    resetTimer()

    // Cleanup
    return () => {
      clearTimeout(inactivityTimer)
      events.forEach(event => {
        document.removeEventListener(event, resetTimer)
      })
    }
  }, [user])

  async function checkUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
    } catch (error) {
      alert('Error logging out: ' + error.message)
    }
  }

  // Style for main sidebar buttons
  function navBtnStyle(active) {
    return {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      marginBottom: '4px',
      backgroundColor: active ? '#eff6ff' : 'transparent',
      color: active ? '#2563eb' : '#6b7280',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: '14px',
      textAlign: 'left',
      transition: 'all 0.2s'
    }
  }

  // Style for indented sub-menu buttons
  function subNavBtnStyle(active) {
    return {
      width: '100%',
      display: 'block',
      padding: '10px 14px',
      marginBottom: '2px',
      backgroundColor: active ? '#eff6ff' : 'transparent',
      color: active ? '#2563eb' : '#6b7280',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: '13px',
      textAlign: 'left',
      transition: 'all 0.2s'
    }
  }

  // Show loading while checking auth
  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
  }

  // If not logged in, show Auth component
  if (!user) {
    return <Auth onAuthSuccess={(user) => setUser(user)} />
  }

  // If logged in, show main app with sidebar
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Hamburger button (mobile only) */}
      <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? '☰' : '☰'}
      </button>

      {/* Overlay (mobile only, when sidebar open) */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`}
        onClick={() => setSidebarOpen(false)}
      ></div>

      {/* Sidebar */}
      <div className={`app-sidebar ${sidebarOpen ? 'open' : ''}`} style={{
        width: '260px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh'
      }}>
        {/* Logo */}
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '26px' }}>💰</span>
          <h1 style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#111827',
            margin: 0
          }}>
            Finance Tracker
          </h1>
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          {/* Dashboard */}
          <button onClick={() => go('dashboard')} style={navBtnStyle(activeTab === 'dashboard')}>
            <span style={{ fontSize: '18px' }}>📊</span> Dashboard
          </button>

          {/* Expenses */}
          <button onClick={() => go('expenses')} style={navBtnStyle(activeTab === 'expenses')}>
            <span style={{ fontSize: '18px' }}>💸</span> Expenses
          </button>

          {/* Rental Income — expandable */}
          <button
            onClick={() => setRentalExpanded(!rentalExpanded)}
            style={{
              ...navBtnStyle(['rental', 'units', 'tenants', 'outstanding'].includes(activeTab)),
              justifyContent: 'space-between'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '18px' }}>🏠</span> Rental Income
            </span>
            <span style={{ fontSize: '12px' }}>{rentalExpanded ? '▼' : '▶'}</span>
          </button>

          {/* Rental sub-items */}
          {rentalExpanded && (
            <div style={{ marginLeft: '16px', borderLeft: '1px solid #e5e7eb', paddingLeft: '8px' }}>
              <button onClick={() => go('rental')} style={subNavBtnStyle(activeTab === 'rental')}>
                Rent Status
              </button>
              <button onClick={() => go('units')} style={subNavBtnStyle(activeTab === 'units')}>
                Properties
              </button>
              <button onClick={() => go('tenants')} style={subNavBtnStyle(activeTab === 'tenants')}>
                Tenants
              </button>
              <button onClick={() => go('outstanding')} style={subNavBtnStyle(activeTab === 'outstanding')}>
                Outstanding Balances
              </button>
            </div>
          )}

          {/* Interest — expandable */}
          <button
            onClick={() => setInterestExpanded(!interestExpanded)}
            style={{
              ...navBtnStyle(['interest-monthly', 'interest-yearly'].includes(activeTab)),
              justifyContent: 'space-between'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '18px' }}>💰</span> Interest
            </span>
            <span style={{ fontSize: '12px' }}>{interestExpanded ? '▼' : '▶'}</span>
          </button>

          {interestExpanded && (
            <div style={{ marginLeft: '16px', borderLeft: '1px solid #e5e7eb', paddingLeft: '8px' }}>
              <button onClick={() => go('interest-monthly')} style={subNavBtnStyle(activeTab === 'interest-monthly')}>
                Monthly Interests
              </button>
              <button onClick={() => go('interest-yearly')} style={subNavBtnStyle(activeTab === 'interest-yearly')}>
                Yearly Interests
              </button>
            </div>
          )}

          {/* Insurance */}
          <button onClick={() => go('insurance')} style={navBtnStyle(activeTab === 'insurance')}>
            <span style={{ fontSize: '18px' }}>📋</span> Insurance
          </button>

          {/* House Taxes */}
          <button onClick={() => go('housetaxes')} style={navBtnStyle(activeTab === 'housetaxes')}>
            <span style={{ fontSize: '18px' }}>🏘️</span> House Taxes
          </button>

          {/* Properties (your original property records module) */}
          <button onClick={() => go('properties')} style={navBtnStyle(activeTab === 'properties')}>
            <span style={{ fontSize: '18px' }}>🏘️</span> Properties
          </button>

          {/* Gold */}
          <button onClick={() => go('gold')} style={navBtnStyle(activeTab === 'gold')}>
            <span style={{ fontSize: '18px' }}>💎</span> Gold
          </button>
        </nav>

        {/* User Info & Logout */}
        <div style={{
          padding: '16px 12px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <div style={{
            padding: '8px 12px',
            marginBottom: '8px',
            wordBreak: 'break-all'
          }}>
            {user.user_metadata?.first_name && (
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '2px' }}>
                {user.user_metadata.first_name}
              </div>
            )}
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              {user.email}
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="app-main" style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'expenses' && <Expenses />}
        {activeTab === 'rental' && <RentalIncome />}
        {activeTab === 'units' && <RentalProperties />}
        {activeTab === 'tenants' && <Tenants />}
        {activeTab === 'outstanding' && <OutstandingBalances />}
        {activeTab === 'interest-monthly' && <InterestTracker filterType="Monthly" />}
        {activeTab === 'interest-yearly' && <InterestTracker filterType="Yearly" />}
        {activeTab === 'insurance' && <InsurancePolicies />}
        {activeTab === 'housetaxes' && <HouseTaxes />}
        {activeTab === 'properties' && <PropertyDetails />}
        {activeTab === 'gold' && <Gold />}
      </div>
    </div>
  )
}

export default App