import React, { useState } from 'react'
import { User, Lock, Mail, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = isLogin 
        ? await signIn(email, password)
        : await signUp(email, password)

      if (error) {
        setError(error.message)
      } else if (!isLogin) {
        setError('Check your email for the confirmation link!')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-[#F7EFE1] rounded-2xl p-8 max-w-md w-full border border-[#D6C7B2] shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#9B7B5F] to-[#C9A37A] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold mb-2 text-[#2F1F12] font-lora">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-[#8B6E5A] text-sm">
            {isLogin ? 'Sign in to your InternTrack account' : 'Start tracking your internship applications'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#2F1F12] mb-2 font-lora">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8B6E5A] w-4 h-4" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#F7F3E9] border border-[#E5D8C7] rounded-lg text-[#2F1F12] placeholder-[#8B6E5A] focus:outline-none focus:ring-1 focus:ring-[#2b1e1a]/10 focus:border-[#2b1e1a] transition-all"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#2F1F12] mb-2 font-lora">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8B6E5A] w-4 h-4" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-[#F7F3E9] border border-[#E5D8C7] rounded-lg text-[#2F1F12] placeholder-[#8B6E5A] focus:outline-none focus:ring-1 focus:ring-[#2b1e1a]/10 focus:border-[#2b1e1a] transition-all"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#8B6E5A] hover:text-[#2F1F12]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2b1e1a] hover:bg-[#3a2a1f] text-white font-medium py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {isLogin ? 'Sign In' : 'Sign Up'}
              </>
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin)
                setError(null)
              }}
              className="text-sm text-[#2b1e1a] hover:text-[#3a2a1f] transition-colors font-lora"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Auth