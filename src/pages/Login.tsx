import { useState } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

const easeSmooth = [0.4, 0, 0.2, 1] as [number, number, number, number]

export default function Login() {
  const { t } = useLanguage()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <div className="min-h-[calc(100dvh-64px)] flex items-center justify-center bg-gradient-to-br from-cream via-[#FFF5EB] to-[#F0EDE8] px-4 py-12">
      <motion.div
        className="w-full max-w-[440px]"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: easeSmooth }}
      >
        {/* Card */}
        <div className="bg-white shadow-xl rounded-2xl p-8 sm:p-10">
          {/* Header */}
          <div className="text-left mb-8">
            <span className="font-mono text-xs text-saffron tracking-[0.15em] uppercase">
              {t('Welcome Back', 'वापसी पर स्वागत')}
            </span>
            <h1 className="font-display font-bold heading-lg text-indigo mt-2 text-left">
              {t('Sign In', 'साइन इन')}
            </h1>
            <p className="text-charcoal-light text-sm mt-2 font-body leading-relaxed text-left">
              {t(
                'Sign in to your Yeh Mera India account to continue reading positive stories.',
                'सकारात्मक कहानियाँ पढ़ना जारी रखने के लिए अपने खाते में साइन इन करें।'
              )}
            </p>
          </div>

          {/* Social login */}
          <div className="space-y-3 mb-6">
            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-charcoal font-body transition-all duration-200 hover:border-saffron/40 hover:shadow-warm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {t('Continue with Google', 'Google से जारी रखें')}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="font-mono text-xs text-charcoal-light uppercase">
              {t('or', 'या')}
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block font-body font-medium text-sm text-charcoal mb-1.5 text-left">
                {t('Email', 'ईमेल')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('your@email.com', 'your@email.com')}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-charcoal placeholder:text-charcoal-light outline-none transition-all duration-200 focus:border-saffron"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block font-body font-medium text-sm text-charcoal mb-1.5 text-left">
                {t('Password', 'पासवर्ड')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('Enter password', 'पासवर्ड दर्ज करें')}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm text-charcoal placeholder:text-charcoal-light outline-none transition-all duration-200 focus:border-saffron"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-light hover:text-charcoal transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-saffron focus:ring-saffron accent-saffron"
                />
                <span className="text-sm text-charcoal-light font-body">
                  {t('Remember me', 'मुझे याद रखें')}
                </span>
              </label>
              <Link
                to="#"
                className="text-sm text-saffron hover:text-saffron-light transition-colors font-body"
              >
                {t('Forgot password?', 'पासवर्ड भूल गए?')}
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-saffron text-white font-body font-semibold rounded-xl px-6 py-3.5 transition-all duration-250 hover:bg-saffron-light hover:scale-[1.02] shadow-warm"
            >
              {t('Sign In', 'साइन इन')}
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Sign up link */}
          <p className="text-center text-sm text-charcoal-light mt-6 font-body">
            {t("Don't have an account?", 'खाता नहीं है?')}{' '}
            <Link
              to="/register"
              className="text-saffron hover:text-saffron-light transition-colors font-medium"
            >
              {t('Get Started', 'शुरू करें')}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
