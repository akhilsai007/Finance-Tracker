import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth({ onAuthSuccess }) {
  const [loading, setLoading] = useState(false)
  const [isSignup, setIsSignup] = useState(false)
  const [isResetMode, setIsResetMode] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  // Check if user came from password reset email
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const type = hashParams.get('type')
    
    if (type === 'recovery') {
      // User clicked the reset link in their email
      const newPassword = prompt('Enter your new password (min 6 characters):')
      if (newPassword && newPassword.length >= 6) {
        supabase.auth.updateUser({ password: newPassword })
          .then(({ error }) => {
            if (error) {
              alert('Error updating password: ' + error.message)
            } else {
              alert('Password updated successfully! You can now log in.')
              window.location.hash = '' // Clear the hash
            }
          })
      }
    }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    try {
      if (isResetMode) {
        // Password reset
        if (!formData.email) {
          alert('Please enter your email address')
          return
        }
        
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
          redirectTo: `${window.location.origin}`,
        })
        
        if (error) throw error
        
        alert('Password reset email sent! Please check your inbox.')
        setIsResetMode(false)
        setFormData({ email: '', password: '' })
      } else if (isSignup) {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password
        })
        
        if (error) throw error
        
        alert('Account created successfully! You can now log in.')
        setIsSignup(false)
        setFormData({ email: '', password: '' })
      } else {
        // Log in
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        })
        
        if (error) throw error
        
        // Call the success callback
        if (onAuthSuccess) onAuthSuccess(data.user)
      }
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      display: 'flex',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      {/* Left side - Branding */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px',
        color: 'white'
      }}>
        <div style={{ maxWidth: '500px' }}>
          <h1 style={{ 
            fontSize: '48px', 
            fontWeight: 'bold', 
            marginBottom: '20px',
            lineHeight: '1.2'
          }}>
            💰 Finance Tracker
          </h1>
          <p style={{ 
            fontSize: '20px', 
            opacity: 0.9,
            lineHeight: '1.6'
          }}>
            Manage your daily expenses, rental income, interest payments, and insurance policies all in one place.
          </p>
          <div style={{ marginTop: '40px', opacity: 0.8 }}>
            <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>✓</span>
              <span>Track expenses effortlessly</span>
            </div>
            <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>✓</span>
              <span>Monitor rental income</span>
            </div>
            <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>✓</span>
              <span>Manage interest payments</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>✓</span>
              <span>Never miss insurance renewals</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px',
        backgroundColor: 'white'
      }}>
        <div style={{ 
          width: '100%',
          maxWidth: '450px'
        }}>
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ 
              fontSize: '32px', 
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '10px'
            }}>
              {isResetMode ? 'Reset Password' : (isSignup ? 'Create your account' : 'Welcome back')}
            </h2>
            <p style={{ color: '#666', fontSize: '16px' }}>
              {isResetMode 
                ? 'Enter your email to receive a password reset link'
                : (isSignup ? 'Start managing your finances today' : 'Sign in to continue to your dashboard')
              }
            </p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '600',
                color: '#333',
                fontSize: '14px'
              }}>
                Email address
              </label>
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                placeholder="you@example.com"
                style={{ 
                  width: '100%', 
                  padding: '14px 16px', 
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px',
                  transition: 'border-color 0.2s',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
            
            {!isResetMode && (
              <div style={{ marginBottom: '30px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '600',
                  color: '#333',
                  fontSize: '14px'
                }}>
                  Password
                </label>
                <input 
                  type="password" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                  placeholder="Enter your password"
                  style={{ 
                    width: '100%', 
                    padding: '14px 16px', 
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    transition: 'border-color 0.2s',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                width: '100%', 
                padding: '14px', 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'opacity 0.2s, transform 0.2s',
                boxShadow: '0 4px 6px rgba(102, 126, 234, 0.25)'
              }}
              onMouseEnter={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              {loading ? 'Please wait...' : (isResetMode ? 'Send Reset Link' : (isSignup ? 'Create Account' : 'Sign In'))}
            </button>
          </form>
          
          <div style={{ 
            marginTop: '30px',
            textAlign: 'center',
            paddingTop: '30px',
            borderTop: '1px solid #e5e7eb'
          }}>
            {isResetMode ? (
              <p style={{ color: '#666', fontSize: '14px' }}>
                Remember your password?
                {' '}
                <button 
                  onClick={() => {
                    setIsResetMode(false)
                    setFormData({ email: '', password: '' })
                  }}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: '#667eea', 
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                >
                  Back to Sign In
                </button>
              </p>
            ) : (
              <>
                <p style={{ color: '#666', fontSize: '14px' }}>
                  {isSignup ? 'Already have an account?' : "Don't have an account?"}
                  {' '}
                  <button 
                    onClick={() => {
                      setIsSignup(!isSignup)
                      setFormData({ email: '', password: '' })
                    }}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: '#667eea', 
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '14px',
                      textDecoration: 'none'
                    }}
                    onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                  >
                    {isSignup ? 'Sign in' : 'Sign up'}
                  </button>
                </p>
                
                {!isSignup && (
                  <p style={{ color: '#666', fontSize: '14px', marginTop: '12px' }}>
                    <button 
                      onClick={() => {
                        setIsResetMode(true)
                        setFormData({ email: '', password: '' })
                      }}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: '#667eea', 
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '14px',
                        textDecoration: 'none'
                      }}
                      onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                      onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                    >
                      Forgot Password?
                    </button>
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}