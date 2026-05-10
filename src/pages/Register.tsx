import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  UserPlus,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowRight,
  CheckCircle2,
  XCircle,
  ShieldCheck,
} from 'lucide-react'
import { useAuth, type UserRole } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<UserRole>('user')
  const [showPassword, setShowPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Password strength
  const passwordStrength = (): { score: number; label: string; color: string } => {
    if (!password) return { score: 0, label: '', color: '' }
    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++

    const labels = ['Weak', 'Fair', 'Good', 'Strong']
    const colors = ['#BC4749', '#E85D04', '#2D6A4F', '#2D6A4F']
    return { score, label: labels[score - 1] || 'Weak', color: colors[score - 1] || '#BC4749' }
  }

  const strength = passwordStrength()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (!agreeTerms) {
      setError('Please agree to the terms and conditions')
      return
    }

    setIsLoading(true)
    const success = await register(name, email, password, role)
    setIsLoading(false)

    if (success) {
      toast.success('Account created!', {
        description: role === 'author'
          ? 'Your author application is pending approval.'
          : 'Welcome to Yeh Mera India!',
        icon: <CheckCircle2 className="size-4 text-[#2D6A4F]" />,
      })
      navigate('/')
    } else {
      setError('An account with this email already exists')
      toast.error('Registration failed', {
        description: 'Email already in use.',
      })
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center relative overflow-hidden py-8"
      style={{ backgroundColor: '#FFF8F0' }}>

      {/* Bandhej pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{
          backgroundImage: 'url(/pattern-bandhej.png)',
          backgroundSize: '250px',
          backgroundRepeat: 'repeat',
        }}
      />

      {/* Decorative floating orbs */}
      <div
        className="absolute top-16 right-16 w-56 h-56 rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: 'rgba(188,71,73,0.06)' }}
      />
      <div
        className="absolute bottom-16 left-16 w-64 h-64 rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: 'rgba(45,106,79,0.06)' }}
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
              <UserPlus size={24} style={{ color: '#E85D04' }} />
            </motion.div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: '#2B2D42' }}
            >
              Create Account
            </h1>
            <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
              Join Yeh Mera India
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
              <XCircle size={16} />
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#2B2D42' }}>
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" size={18} style={{ color: '#9CA3AF' }} />
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="pl-10 h-11"
                  style={{ borderColor: '#D1D5DB', backgroundColor: '#F9FAFB', color: '#2B2D42' }}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#2B2D42' }}>
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" size={18} style={{ color: '#9CA3AF' }} />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-10 h-11"
                  style={{ borderColor: '#D1D5DB', backgroundColor: '#F9FAFB', color: '#2B2D42' }}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#2B2D42' }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" size={18} style={{ color: '#9CA3AF' }} />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="pl-10 pr-10 h-11"
                  style={{ borderColor: '#D1D5DB', backgroundColor: '#F9FAFB', color: '#2B2D42' }}
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Password strength indicator */}
              {password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(strength.score / 4) * 100}%` }}
                      transition={{ duration: 0.3 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: strength.color }}
                    />
                  </div>
                  <span className="text-xs font-medium" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#2B2D42' }}>
                Confirm Password
              </label>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                className="h-11"
                style={{ borderColor: '#D1D5DB', backgroundColor: '#F9FAFB', color: '#2B2D42' }}
                required
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs mt-1" style={{ color: '#BC4749' }}>Passwords do not match</p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#2D6A4F' }}>
                  <CheckCircle2 size={12} /> Passwords match
                </p>
              )}
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#2B2D42' }}>
                Account Type
              </label>
              <div className="flex gap-3">
                {([['user', 'Reader'], ['author', 'Author']] as const).map(([r, label]) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r as UserRole)}
                    className="flex-1 py-2.5 px-4 rounded-lg border-2 text-sm font-medium transition-all duration-200"
                    style={{
                      borderColor: role === r ? '#E85D04' : '#E5E7EB',
                      backgroundColor: role === r ? 'rgba(232,93,4,0.05)' : '#F9FAFB',
                      color: role === r ? '#E85D04' : '#6B7280',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {role === 'author' && (
                <p className="text-xs mt-1.5 flex items-start gap-1" style={{ color: '#E85D04' }}>
                  <ShieldCheck size={12} className="mt-0.5 shrink-0" />
                  Author accounts require admin approval before publishing.
                </p>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={agreeTerms}
                onCheckedChange={(checked) => setAgreeTerms(checked === true)}
              />
              <label htmlFor="terms" className="text-xs leading-relaxed" style={{ color: '#4B5563' }}>
                I agree to the{' '}
                <button type="button" onClick={() => toast.info('Coming soon!')} className="font-medium hover:underline" style={{ color: '#E85D04' }}>
                  Terms of Service
                </button>
                {' '}and{' '}
                <button type="button" onClick={() => toast.info('Coming soon!')} className="font-medium hover:underline" style={{ color: '#E85D04' }}>
                  Privacy Policy
                </button>
              </label>
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
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus size={18} />
                  Create Account
                </span>
              )}
            </Button>
          </form>

          {/* Login link */}
          <div className="mt-6 text-center text-sm" style={{ color: '#6B7280' }}>
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold inline-flex items-center gap-1 hover:underline"
              style={{ color: '#E85D04' }}
            >
              Sign in <ArrowRight size={14} />
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
