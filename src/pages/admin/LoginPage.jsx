// src/pages/admin/LoginPage.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../context/AuthContext'
import { EyeIcon, EyeSlashIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'

export default function LoginPage() {
  const { login, resetPassword } = useAuth()
  const navigate = useNavigate()
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [forgotMode, setForgotMode] = useState(false)
  const [forgotDone, setForgotDone] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm()
  const { register: regForgot, handleSubmit: hsForgot, formState: { errors: forgotErrors } } = useForm()

  const onLogin = async ({ email, password }) => {
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      navigate('/admin/dashboard')
    } catch (err) {
      setError(err.message ?? 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const onForgot = async ({ email }) => {
    setError(null)
    setLoading(true)
    try {
      await resetPassword(email)
      setForgotDone(true)
    } catch (err) {
      setError(err.message ?? 'Failed to send reset email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="GSG Energies" className="h-16 w-auto brightness-0 invert drop-shadow-lg" />
          </div>
          <p className="text-primary-300 text-sm mt-1 font-medium">Fleet Operations — Admin Portal</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {!forgotMode ? (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign In</h2>
              {error && (
                <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                  <ExclamationCircleIcon className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              <form onSubmit={handleSubmit(onLogin)} noValidate className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    id="email"
                    type="email"
                    className={`input-field ${errors.email ? 'input-error' : ''}`}
                    placeholder="hr@gsgEnergies.com"
                    autoComplete="email"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: { value: /\S+@\S+\.\S+/, message: 'Enter a valid email' },
                    })}
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPw ? 'text' : 'password'}
                      className={`input-field pr-10 ${errors.password ? 'input-error' : ''}`}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      {...register('password', { required: 'Password is required' })}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPw(p => !p)}
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                    >
                      {showPw ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
                </div>
                <button type="submit" disabled={loading} className="btn-secondary w-full py-3 mt-2">
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
              <button
                className="mt-4 w-full text-center text-sm text-primary-700 hover:text-primary-900 hover:underline transition-colors"
                onClick={() => { setForgotMode(true); setError(null) }}
              >
                Forgot Password?
              </button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Reset Password</h2>
              {forgotDone ? (
                <div>
                  <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                    ✅ Password reset email sent. Please check your inbox.
                  </p>
                  <button className="btn-secondary w-full" onClick={() => { setForgotMode(false); setForgotDone(false) }}>
                    Back to Login
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-500 mb-5">Enter your email to receive a password reset link.</p>
                  {error && (
                    <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                      <ExclamationCircleIcon className="w-5 h-5 text-red-500 shrink-0" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}
                  <form onSubmit={hsForgot(onForgot)} noValidate className="space-y-4">
                    <div>
                      <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        id="forgot-email"
                        type="email"
                        className={`input-field ${forgotErrors.email ? 'input-error' : ''}`}
                        placeholder="hr@gsgEnergies.com"
                        {...regForgot('email', {
                          required: 'Email is required',
                          pattern: { value: /\S+@\S+\.\S+/, message: 'Enter a valid email' },
                        })}
                      />
                      {forgotErrors.email && <p className="mt-1 text-xs text-red-600">{forgotErrors.email.message}</p>}
                    </div>
                    <button type="submit" disabled={loading} className="btn-secondary w-full py-3">
                      {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                  </form>
                  <button
                    className="mt-4 w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    onClick={() => { setForgotMode(false); setError(null) }}
                  >
                    ← Back to Login
                  </button>
                </>
              )}
            </>
          )}
        </div>
        <p className="text-center text-primary-400 text-xs mt-6">
          <a href="/" className="hover:text-primary-200 transition-colors">← Return to Public Portal</a>
        </p>
      </div>
    </div>
  )
}
