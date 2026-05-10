import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields')
      return
    }

    setIsLoading(true)
    const success = await login(email, password)
    setIsLoading(false)

    if (success) {
      toast.success('Welcome back!', {
        description: 'You have successfully logged in.',
        icon: <ShieldCheck className="size-4 text-[#2D6A4F]" />,
      })
      navigate('/')
    } else {
      setError('Invalid email or password')
      toast.error('Login failed', {
        description: 'Invalid email or password.',
      })
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: '#FFF8F0' }}>

      {/* Lahariya pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage: 'url(/pattern-lahariya.png)',
          backgroundSize: '300px',
          backgroundRepeat: 'repeat',
        }}
      />

      {/* Decorative floating orbs */}
      <div
        className="absolute top-20 left-10 w-64 h-64 rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: 'rgba(232,93,4,0.08)' }}
      />
      <div
        className="absolute bottom-20 right-10 w-72 h-72 rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: 'rgba(29,53,87,0.06)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md px-4"
      >
        {/* Ajrakh decorative border top */}
        <div
          className="h-2 w-full rounded-t-xl"
          style={{
            backgroundImage: 'url(/pattern-ajrakh.png)',
            backgroundSize: '120px',
            backgroundRepeat: 'repeat-x',
          }}
        />

        <div
          className="bg-white rounded-b-xl shadow-lg px-8 pt-8 pb-8 border border-t-0"
          style={{ borderColor: '#E5E7EB' }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
              style={{ backgroundColor: 'rgba(232,93,4,0.1)' }}
            >
              <img src="/logo-icon.svg" alt="YMI" className="w-8 h-8" />
            </motion.div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: '#2B2D42' }}
            >
              Welcome Back
            </h1>
            <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
              Sign in to Yeh Mera India
            </p>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-4 p-3 rounded-lg text-sm flex items-center gap-2"
              style={{ backgroundColor: '#FEF2F2', color: '#BC4749', border: '1px solid #FECACA' }}
            >
              <ShieldCheck size={16} />
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: '#2B2D42' }}
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  size={18}
                  style={{ color: '#9CA3AF' }}
                />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-10 h-11"
                  style={{
                    borderColor: '#D1D5DB',
                    backgroundColor: '#F9FAFB',
                    color: '#2B2D42',
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: '#2B2D42' }}
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  size={18}
                  style={{ color: '#9CA3AF' }}
                />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pl-10 pr-10 h-11"
                  style={{
                    borderColor: '#D1D5DB',
                    backgroundColor: '#F9FAFB',
                    color: '#2B2D42',
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#9CA3AF' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember me + forgot password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <label htmlFor="remember" className="text-sm" style={{ color: '#4B5563' }}>
                  Remember me
                </label>
              </div>
              <button
                type="button"
                onClick={() => toast.info('Coming soon!', { description: 'Password reset will be available shortly.' })}
                className="text-sm font-medium hover:underline"
                style={{ color: '#E85D04' }}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 font-semibold text-white rounded-lg transition-all duration-250 hover:opacity-90 hover:scale-[1.01]"
              style={{ backgroundColor: '#E85D04' }}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn size={18} />
                  Sign In
                </span>
              )}
            </Button>
          </form>

          {/* Demo accounts hint */}
          <div
            className="mt-6 p-3 rounded-lg text-xs space-y-1"
            style={{ backgroundColor: '#F3F4F6' }}
          >
            <p className="font-semibold mb-2" style={{ color: '#2B2D42' }}>
              Demo Accounts:
            </p>
            {[
              { email: 'admin@yehmeraindia.com', pwd: 'admin123', role: 'admin' },
              { email: 'author@yehmeraindia.com', pwd: 'author123', role: 'author' },
              { email: 'user@yehmeraindia.com', pwd: 'user123', role: 'user' },
            ].map((d) => (
              <button
                key={d.email}
                type="button"
                onClick={() => { setEmail(d.email); setPassword(d.pwd); toast.info(`Filled ${d.role} credentials`) }}
                className="block w-full text-left px-2 py-1.5 rounded hover:bg-white transition-colors"
                style={{ color: '#4B5563' }}
              >
                <span style={{ color: '#E85D04' }} className="font-medium">{d.role}:</span>{' '}
                {d.email} / {d.pwd}
              </button>
            ))}
          </div>

          {/* Register link */}
          <div className="mt-6 text-center text-sm" style={{ color: '#6B7280' }}>
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-semibold inline-flex items-center gap-1 hover:underline"
              style={{ color: '#E85D04' }}
            >
              Register <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Footer decorative element */}
        <div className="flex justify-center mt-6 gap-1">
          <div className="w-8 h-1 rounded-full" style={{ backgroundColor: '#FF9933' }} />
          <div className="w-8 h-1 rounded-full" style={{ backgroundColor: '#FFFFFF' }} />
          <div className="w-8 h-1 rounded-full" style={{ backgroundColor: '#138808' }} />
        </div>
      </motion.div>
    </div>
  )
}
