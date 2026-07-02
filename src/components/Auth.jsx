import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff } from 'lucide-react'

export default function Auth({ onAuthSuccess }) {
  const [loading, setLoading] = useState(false)
  const [isSignup, setIsSignup] = useState(false)
  const [isResetMode, setIsResetMode] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const type = hashParams.get('type')

    if (type === 'recovery') {
      const newPassword = prompt('Enter your new password (min 6 characters):')
      if (newPassword && newPassword.length >= 6) {
        supabase.auth.updateUser({ password: newPassword })
          .then(({ error }) => {
            if (error) {
              alert('Error updating password: ' + error.message)
            } else {
              alert('Password updated successfully! You can now log in.')
              window.location.hash = ''
            }
          })
      }
    } else if (type === 'signup') {
      // User just confirmed their email — verify but don't auto-login
      supabase.auth.signOut().then(() => {
        alert('Email confirmed successfully! Please log in with your credentials.')
        window.location.hash = ''
      })
    }
  }, [])

  function resetForm() {
    setFormData({ firstName: '', email: '', password: '', confirmPassword: '' })
    setShowPassword(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    try {
      if (isResetMode) {
        if (!formData.email) {
          alert('Please enter your email address')
          setLoading(false)
          return
        }
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
          redirectTo: `${window.location.origin}`,
        })
        if (error) throw error
        alert('Password reset email sent! Please check your inbox.')
        setIsResetMode(false)
        resetForm()
      } else if (isSignup) {
        // Check passwords match
        if (formData.password !== formData.confirmPassword) {
          alert('Passwords do not match. Please try again.')
          setLoading(false)
          return
        }
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { first_name: formData.firstName }  // stored in user metadata
          }
        })
        if (error) throw error
        alert('Account created successfully! You can now log in.')
        setIsSignup(false)
        resetForm()
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        })
        if (error) throw error
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
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        padding: '40px 32px'
      }}>
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
            Finance Tracker
          </h1>
          <p style={{ color: '#6b7280', fontSize: '15px' }}>
            {isResetMode
              ? 'Enter your email to receive a reset link'
              : (isSignup ? 'Create your account' : 'Sign in to continue')
            }
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* First name — signup only */}
          {isSignup && (
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                required
                placeholder="e.g., Syam"
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Email address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
              placeholder="you@example.com"
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Password with show/hide */}
          {!isResetMode && (
            <div style={{ marginBottom: isSignup ? '20px' : '28px' }}>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                  placeholder="Enter your password"
                  style={{ ...inputStyle, paddingRight: '48px' }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={eyeBtnStyle}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} color="#6b7280" /> : <Eye size={20} color="#6b7280" />}
                </button>
              </div>
            </div>
          )}

          {/* Confirm password — signup only */}
          {isSignup && (
            <div style={{ marginBottom: '28px' }}>
              <label style={labelStyle}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  required
                  placeholder="Re-enter your password"
                  style={{ ...inputStyle, paddingRight: '48px' }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '14px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px',
              fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s, transform 0.2s',
              boxShadow: '0 4px 6px rgba(102, 126, 234, 0.25)'
            }}
            onMouseEnter={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            {loading ? 'Please wait...' : (isResetMode ? 'Send Reset Link' : (isSignup ? 'Create Account' : 'Sign In'))}
          </button>
        </form>

        <div style={{ marginTop: '28px', textAlign: 'center', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
          {isResetMode ? (
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              Remember your password?{' '}
              <button onClick={() => { setIsResetMode(false); resetForm() }} style={linkBtn}
                onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.target.style.textDecoration = 'none'}>
                Back to Sign In
              </button>
            </p>
          ) : (
            <>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button onClick={() => { setIsSignup(!isSignup); resetForm() }} style={linkBtn}
                  onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.target.style.textDecoration = 'none'}>
                  {isSignup ? 'Sign in' : 'Sign up'}
                </button>
              </p>

              {!isSignup && (
                <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '12px' }}>
                  <button onClick={() => { setIsResetMode(true); resetForm() }} style={linkBtn}
                    onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.target.style.textDecoration = 'none'}>
                    Forgot Password?
                  </button>
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const labelStyle = { display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }
const inputStyle = {
  width: '100%', padding: '14px 16px', border: '2px solid #e5e7eb',
  borderRadius: '8px', fontSize: '16px', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.2s'
}
const eyeBtnStyle = {
  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
  background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '4px'
}
const linkBtn = {
  background: 'none', border: 'none', color: '#667eea',
  cursor: 'pointer', fontWeight: '600', fontSize: '14px', textDecoration: 'none'
}