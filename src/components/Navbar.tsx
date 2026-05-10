import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { Menu, X, Globe, LogIn, LogOut, User, ChevronDown, Crown, LayoutDashboard } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

const navLinks = [
  { labelEn: 'Home', labelHi: 'होम', path: '/' },
  { labelEn: 'Categories', labelHi: 'श्रेणियाँ', path: '/categories' },
  { labelEn: 'Trending', labelHi: 'ट्रेंडिंग', path: '/trending' },
  { labelEn: 'About', labelHi: 'हमारे बारे में', path: '/about' },
  { labelEn: 'Author', labelHi: 'लेखक', path: '/author' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const { language, toggleLanguage, t } = useLanguage()
  const { isAuthenticated, user, isAdmin, logout } = useAuth()

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b shadow-sm"
      style={{ backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderColor: '#E5E7EB' }}>
      {/* Saffron accent strip */}
      <div className="absolute top-0 left-0 right-0 h-[3px] flex z-50">
        <div className="flex-1" style={{ backgroundColor: '#FF9933' }} />
        <div className="flex-1" style={{ backgroundColor: '#FFFFFF' }} />
        <div className="flex-1" style={{ backgroundColor: '#138808' }} />
      </div>

      <div className="max-w-container mx-auto h-full flex items-center justify-between px-6 lg:px-12">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-full overflow-hidden flex flex-col shadow-sm border shrink-0"
            style={{ borderColor: '#E5E7EB' }}>
            <div className="flex-1" style={{ backgroundColor: '#E85D04' }} />
            <div className="flex-1" style={{ backgroundColor: '#FFFFFF' }} />
            <div className="flex-1" style={{ backgroundColor: '#2D6A4F' }} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-heading font-bold text-lg tracking-tight" style={{ color: '#1D3557' }}>
              Yeh Mera India
            </span>
            <span className="font-body text-[11px] tracking-[0.15em] font-medium" style={{ color: '#E85D04' }}>
              {t("India's Voice", 'भारत की आवाज़')}
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`relative font-body text-sm font-medium transition-colors duration-250 group ${
                location.pathname === link.path
                  ? 'text-saffron'
                  : 'text-charcoal-light hover:text-indigo'
              }`}
            >
              {t(link.labelEn, link.labelHi)}
              <span
                className={`absolute -bottom-1 left-0 h-0.5 bg-saffron rounded-full transition-all duration-300 ease-out ${
                  location.pathname === link.path ? 'w-full' : 'w-0 group-hover:w-full'
                }`}
              />
            </Link>
          ))}
        </div>

        {/* Right Section: Auth + Language + CTA */}
        <div className="hidden md:flex items-center gap-3">
          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 text-xs font-mono font-medium transition-colors duration-200 border rounded-full px-3 py-1.5"
            style={{
              borderColor: language === 'en' ? '#E85D04' : '#E5E7EB',
              color: language === 'en' ? '#E85D04' : '#6B7280',
              backgroundColor: '#F9FAFB',
            }}
            aria-label="Toggle language"
          >
            <Globe size={12} />
            <span className={language === 'en' ? 'font-semibold' : ''}>EN</span>
            <span style={{ color: '#D1D5DB' }}>/</span>
            <span className={language === 'hi' ? 'font-semibold' : ''}>HI</span>
          </button>

          {/* Auth State */}
          {isAuthenticated && user ? (
            <>
              {/* Admin Badge */}
              {isAdmin && (
                <Link to="/admin">
                  <Badge
                    variant="outline"
                    className="gap-1 px-2 py-0.5 text-xs font-medium rounded-full cursor-pointer hover:bg-orange-50"
                    style={{ borderColor: 'rgba(232,93,4,0.3)', color: '#E85D04', backgroundColor: 'rgba(232,93,4,0.05)' }}
                  >
                    <Crown size={12} />
                    Admin
                  </Badge>
                </Link>
              )}

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="gap-2 px-3 py-2 h-auto rounded-full border"
                    style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: 'rgba(232,93,4,0.1)', color: '#E85D04' }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-medium" style={{ color: '#2B2D42' }}>{user.name}</span>
                    <ChevronDown size={14} style={{ color: '#9CA3AF' }} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
                  <div className="px-3 py-2 border-b" style={{ borderColor: '#F3F4F6' }}>
                    <p className="text-sm font-medium" style={{ color: '#2B2D42' }}>{user.name}</p>
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>{user.email}</p>
                  </div>

                  <DropdownMenuItem asChild className="gap-2 cursor-pointer">
                    <Link to="/author">
                      <User size={14} style={{ color: '#6B7280' }} />
                      <span style={{ color: '#2B2D42' }}>Profile</span>
                    </Link>
                  </DropdownMenuItem>

                  {isAdmin && (
                    <DropdownMenuItem asChild className="gap-2 cursor-pointer">
                      <Link to="/admin">
                        <LayoutDashboard size={14} style={{ color: '#E85D04' }} />
                        <span style={{ color: '#E85D04' }}>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator style={{ backgroundColor: '#F3F4F6' }} />

                  <DropdownMenuItem
                    onClick={logout}
                    className="gap-2 cursor-pointer"
                  >
                    <LogOut size={14} style={{ color: '#BC4749' }} />
                    <span style={{ color: '#BC4749' }}>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            /* Not logged in → Login link */
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium transition-all duration-200 rounded-full px-4 py-2 border"
              style={{
                borderColor: '#E5E7EB',
                color: '#2B2D42',
                backgroundColor: '#F9FAFB',
              }}
            >
              <LogIn size={16} />
              {t('Login', 'लॉग इन')}
            </Link>
          )}

          {/* Watch Anchor CTA (hide on auth pages) */}
          {!isAuthPage && (
            <Link
              to="/anchor"
              className="inline-flex items-center font-body font-semibold text-sm rounded-full px-5 py-2 transition-all duration-250 hover:opacity-90 hover:scale-[1.03] text-white"
              style={{ backgroundColor: '#E85D04' }}
            >
              {t('Watch Anchor', 'एंकर देखें')}
            </Link>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden p-1"
          style={{ color: '#1D3557' }}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-40 overflow-y-auto"
          style={{ backgroundColor: 'rgba(255,248,240,0.98)', backdropFilter: 'blur(20px)' }}>
          <div className="flex flex-col items-center gap-5 pt-10 pb-8">
            {/* Auth section for mobile */}
            {isAuthenticated && user ? (
              <div className="flex flex-col items-center gap-3 w-full px-8">
                <div className="flex items-center gap-3">
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                      style={{ backgroundColor: 'rgba(232,93,4,0.1)', color: '#E85D04' }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="font-medium" style={{ color: '#2B2D42' }}>{user.name}</p>
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>{user.email}</p>
                  </div>
                </div>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="w-full text-center py-2.5 rounded-lg font-medium flex items-center justify-center gap-2"
                    style={{ backgroundColor: 'rgba(232,93,4,0.08)', color: '#E85D04' }}
                  >
                    <Crown size={16} /> Admin Dashboard
                  </Link>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 text-base font-medium px-6 py-3 rounded-full"
                style={{ backgroundColor: '#F3F4F6', color: '#2B2D42' }}
              >
                <LogIn size={18} /> {t('Login', 'लॉग इन')}
              </Link>
            )}

            <div className="w-16 h-px" style={{ backgroundColor: '#E5E7EB' }} />

            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className="font-body text-lg font-medium transition-colors"
                style={{
                  color: location.pathname === link.path ? '#E85D04' : '#4B5563',
                }}
              >
                {t(link.labelEn, link.labelHi)}
              </Link>
            ))}

            {/* Mobile Language Toggle */}
            <button
              onClick={() => {
                toggleLanguage()
              }}
              className="flex items-center gap-2 text-sm font-mono font-medium border rounded-full px-5 py-2"
              style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
            >
              <Globe size={14} />
              <span className={language === 'en' ? 'font-semibold' : ''}>English</span>
              <span style={{ color: '#D1D5DB' }}>/</span>
              <span className={language === 'hi' ? 'font-semibold' : ''}>हिंदी</span>
            </button>

            <Link
              to="/anchor"
              onClick={() => setMobileOpen(false)}
              className="mt-2 inline-flex items-center font-body font-semibold rounded-full px-6 py-3 text-white"
              style={{ backgroundColor: '#E85D04' }}
            >
              {t('Watch Anchor', 'एंकर देखें')}
            </Link>

            {/* Logout at bottom for mobile */}
            {isAuthenticated && (
              <>
                <div className="w-16 h-px" style={{ backgroundColor: '#E5E7EB' }} />
                <button
                  onClick={() => {
                    logout()
                    setMobileOpen(false)
                  }}
                  className="flex items-center gap-2 text-base font-medium"
                  style={{ color: '#BC4749' }}
                >
                  <LogOut size={18} /> {t('Logout', 'लॉग आउट')}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
