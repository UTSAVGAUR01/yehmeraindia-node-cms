import { Link } from 'react-router'
import { useLanguage } from '@/context/LanguageContext'

export default function Footer() {
  const { t } = useLanguage()

  const platformLinks = [
    { labelEn: 'Home', labelHi: 'होम', path: '/' },
    { labelEn: 'Categories', labelHi: 'श्रेणियाँ', path: '/categories' },
    { labelEn: 'Trending', labelHi: 'ट्रेंडिंग', path: '/trending' },
    { labelEn: 'About', labelHi: 'हमारे बारे में', path: '/about' },
    { labelEn: 'Anchor Studio', labelHi: 'एंकर स्टूडियो', path: '/anchor' },
  ]

  const categoryLinks = [
    { labelEn: 'Politics', labelHi: 'राजनीति', path: '/categories' },
    { labelEn: 'Technology', labelHi: 'तकनीक', path: '/categories' },
    { labelEn: 'Sports', labelHi: 'खेल', path: '/categories' },
    { labelEn: 'Science', labelHi: 'विज्ञान', path: '/categories' },
    { labelEn: 'Business', labelHi: 'व्यापार', path: '/categories' },
  ]

  const quickLinks = [
    { labelEn: 'Author Dashboard', labelHi: 'लेखक डैशबोर्ड', path: '/author' },
    { labelEn: 'Login', labelHi: 'लॉगिन', path: '/login' },
    { labelEn: 'Register', labelHi: 'रजिस्टर', path: '/register' },
  ]

  const connectLinks = [
    { label: 'X (Twitter)', href: '#' },
    { label: 'YouTube', href: '#' },
    { label: 'Instagram', href: '#' },
    { label: 'WhatsApp Channel', href: '#' },
  ]

  return (
    <footer className="bg-indigo relative overflow-hidden">
      {/* Ajrakh decorative top border */}
      <div className="ajrakh-border-top relative">
        <div className="h-1 saffron-gradient" />
      </div>

      {/* Warli art subtle decoration */}
      <div className="absolute top-16 right-8 opacity-[0.06] pointer-events-none">
        <img src="/pattern-warli.png" alt="" className="w-32 h-auto" />
      </div>
      <div className="absolute bottom-20 left-8 opacity-[0.04] pointer-events-none">
        <img src="/pattern-warli.png" alt="" className="w-24 h-auto" />
      </div>

      <div className="max-w-container mx-auto px-6 lg:px-12 pt-16 pb-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              {/* Mini tricolor flag */}
              <div className="w-7 h-7 rounded-full overflow-hidden flex flex-col shadow-sm border border-gold/40 shrink-0">
                <div className="flex-1 bg-[#E85D04]" />
                <div className="flex-1 bg-white" />
                <div className="flex-1 bg-[#2D6A4F]" />
              </div>
              <span className="font-heading font-bold text-base text-cream tracking-tight">
                Yeh Mera India
              </span>
            </Link>
            <p className="text-cream/70 text-sm leading-relaxed max-w-[260px] mb-3">
              {t(
                'AI-powered news aggregation and virtual anchor platform for India. Stories that inspire, inform, and unite.',
                'भारत के लिए AI-समाचार एग्रीगेशन और वर्चुअल एंकर प्लेटफॉर्म। प्रेरित करने वाली कहानियाँ।'
              )}
            </p>
            <p className="text-saffron-light text-xs font-medium italic">
              {t('Yeh Mera India — Voice of Bharat', 'यह मेरा इंडिया — भारत की आवाज़')}
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-heading font-semibold text-cream text-sm mb-4 tracking-wide">
              {t('Platform', 'प्लेटफॉर्म')}
            </h4>
            <ul className="space-y-2.5">
              {platformLinks.map((link) => (
                <li key={link.labelEn}>
                  <Link
                    to={link.path}
                    className="text-cream/60 text-sm hover:text-saffron-light transition-colors duration-200"
                  >
                    {t(link.labelEn, link.labelHi)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-heading font-semibold text-cream text-sm mb-4 tracking-wide">
              {t('Categories', 'श्रेणियाँ')}
            </h4>
            <ul className="space-y-2.5">
              {categoryLinks.map((link) => (
                <li key={link.labelEn}>
                  <Link
                    to={link.path}
                    className="text-cream/60 text-sm hover:text-saffron-light transition-colors duration-200"
                  >
                    {t(link.labelEn, link.labelHi)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="font-heading font-semibold text-cream text-sm mb-4 tracking-wide">
              {t('Connect', 'जुड़ें')}
            </h4>
            <ul className="space-y-2.5 mb-4">
              {connectLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-cream/60 text-sm hover:text-saffron-light transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>

            {/* Quick Links */}
            <h4 className="font-heading font-semibold text-cream text-sm mb-3 tracking-wide mt-6">
              {t('Quick Links', 'त्वरित लिंक')}
            </h4>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.labelEn}>
                  <Link
                    to={link.path}
                    className="text-cream/60 text-sm hover:text-saffron-light transition-colors duration-200"
                  >
                    {t(link.labelEn, link.labelHi)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-cream/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-cream/50 text-xs">
            &copy; {new Date().getFullYear()} Yeh Mera India. {t('All rights reserved.', 'सर्वाधिकार सुरक्षित।')}
          </p>
          <div className="flex items-center gap-2 text-xs text-cream/50">
            <span className="relative flex h-2 w-2">
              <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-saffron-light opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-saffron-light" />
            </span>
            <span className="font-mono text-[0.7rem]">
              {t('Made with', 'बनाया गया')} 
              <span className="text-saffron-light mx-1">
                {/* Tricolor heart */}
                <span className="inline-flex flex-col items-center justify-center w-3 h-3 leading-[0.3rem] text-[8px] align-middle">
                  <span className="text-[#E85D04]">❤</span>
                </span>
              </span>
              {t('in India', 'भारत में')}
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
