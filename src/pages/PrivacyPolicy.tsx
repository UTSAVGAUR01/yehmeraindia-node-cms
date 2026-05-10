import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { ArrowLeft, Shield, Eye, Cookie, Users, Lock, Mail } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

const sections = [
  {
    id: 'collection',
    icon: <Eye size={18} />,
    title: 'Data Collection',
    content: [
      'Yeh Mera India ("YMI", "we", "us", or "our") collects personal information that you voluntarily provide when registering on the platform, expressing interest in our services, or contacting us. This may include your name, email address, phone number, and any other information you choose to provide.',
      'We also automatically collect certain information when you visit our website, including your IP address, browser type, operating system, referring URLs, pages viewed, links clicked, and other browsing behavior. This data helps us understand how visitors use our platform and improve user experience.',
      'For authors and contributors, we may collect additional information such as profile photographs, biographical information, and published content submitted to the platform.',
    ],
  },
  {
    id: 'cookies',
    icon: <Cookie size={18} />,
    title: 'Cookies & Tracking',
    content: [
      'We use cookies and similar tracking technologies to collect and store information about your preferences and browsing activities on our platform. Cookies are small text files placed on your device that help us recognize you on subsequent visits.',
      'Types of cookies we use include: (a) Essential cookies required for the platform to function properly; (b) Preference cookies that remember your settings and choices; (c) Analytics cookies that help us understand how visitors interact with our platform; and (d) Authentication cookies that keep you logged into your account.',
      'You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our service.',
    ],
  },
  {
    id: 'third-party',
    icon: <Users size={18} />,
    title: 'Third-Party Services',
    content: [
      'We may share your information with third-party service providers who perform services on our behalf, such as hosting providers, analytics companies, and email service providers. These third parties are contractually obligated to use your information only for the purposes of providing the services we request.',
      'Our platform may contain links to third-party websites, services, or advertisements that are not owned or controlled by Yeh Mera India. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party websites or services.',
      'We use Google Analytics to track and analyze website traffic. Google Analytics collects information such as how often users visit our site, what pages they visit, and what other sites they used prior to coming to our platform.',
    ],
  },
  {
    id: 'security',
    icon: <Lock size={18} />,
    title: 'Data Security',
    content: [
      'The security of your personal information is important to us. We implement appropriate technical and organizational measures to protect your data against unauthorized access, alteration, disclosure, or destruction.',
      'We use industry-standard encryption (SSL/TLS) to protect data transmitted between your browser and our servers. Passwords are hashed using secure cryptographic algorithms before storage.',
      'While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security. No method of transmission over the Internet or electronic storage is 100% secure.',
    ],
  },
  {
    id: 'rights',
    icon: <Shield size={18} />,
    title: 'Your Rights',
    content: [
      'Under applicable data protection laws, including the Information Technology Act, 2000 of India, you have certain rights regarding your personal data: (a) Right to access — request copies of your personal data; (b) Right to rectification — request correction of inaccurate data; (c) Right to erasure — request deletion of your personal data under certain conditions; (d) Right to restrict processing — request limitation on how we use your data; and (e) Right to data portability — request transfer of your data to another organization.',
      'To exercise any of these rights, please contact us using the information provided in the Contact section below. We will respond to your request within 30 days.',
      'You may update or delete your account information at any time by logging into your account settings. If you wish to delete your entire account, please contact us directly.',
    ],
  },
  {
    id: 'children',
    icon: <Users size={18} />,
    title: "Children's Privacy",
    content: [
      'Our platform is not intended for use by children under the age of 13. We do not knowingly collect personally identifiable information from children under 13. If you are a parent or guardian and you become aware that your child has provided us with personal information, please contact us immediately.',
      'If we discover that a child under 13 has provided us with personal information, we will promptly delete such information from our servers.',
    ],
  },
  {
    id: 'changes',
    icon: <Shield size={18} />,
    title: 'Policy Changes',
    content: [
      'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.',
      'You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.',
    ],
  },
]

export default function PrivacyPolicy() {
  const { t } = useLanguage()

  return (
    <div className="min-h-[100dvh] pt-16" style={{ backgroundColor: '#FFF8F0' }}>
      {/* Warli pattern overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'url(/pattern-warli.png)',
          backgroundSize: '200px',
          backgroundRepeat: 'repeat',
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm font-medium hover:underline mb-4"
            style={{ color: '#6B7280' }}
          >
            <ArrowLeft size={16} /> {t('Home', 'होम')}
          </Link>
          <h1
            className="text-4xl font-bold mb-3"
            style={{ color: '#2B2D42' }}
          >
            Privacy Policy
          </h1>
          <p className="text-base" style={{ color: '#6B7280' }}>
            Your privacy is important to us. This policy explains how Yeh Mera India collects, uses, and protects your personal information.
          </p>
          <p className="text-sm mt-2" style={{ color: '#9CA3AF' }}>
            Last Updated: January 2025
          </p>
        </motion.div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section, i) => (
            <motion.section
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              id={section.id}
              className="rounded-xl border bg-white p-6 shadow-sm"
              style={{ borderColor: '#E5E7EB' }}
            >
              <div className="flex items-center gap-2.5 mb-4">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(232,93,4,0.1)', color: '#E85D04' }}
                >
                  {section.icon}
                </div>
                <h2 className="text-lg font-semibold" style={{ color: '#2B2D42' }}>
                  {section.title}
                </h2>
              </div>
              <div className="space-y-3">
                {section.content.map((paragraph, j) => (
                  <p key={j} className="text-sm leading-relaxed" style={{ color: '#4B5563' }}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </motion.section>
          ))}
        </div>

        {/* Contact */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="rounded-xl border bg-white p-6 shadow-sm mt-6"
          style={{ borderColor: '#E5E7EB' }}
        >
          <div className="flex items-center gap-2.5 mb-4">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(29,53,87,0.1)', color: '#1D3557' }}
            >
              <Mail size={18} />
            </div>
            <h2 className="text-lg font-semibold" style={{ color: '#2B2D42' }}>
              Contact Us
            </h2>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: '#4B5563' }}>
            If you have any questions about this Privacy Policy or our data practices, please contact us at{' '}
            <a href="mailto:privacy@yehmeraindia.com" className="font-medium hover:underline" style={{ color: '#E85D04' }}>
              privacy@yehmeraindia.com
            </a>
            {' '}or write to us at: Yeh Mera India, 123 News Street, New Delhi — 110001, India.
          </p>
        </motion.section>

        {/* Footer link */}
        <div className="mt-8 text-center">
          <p className="text-xs" style={{ color: '#9CA3AF' }}>
            This privacy policy is provided for informational purposes. For legal advice, please consult a qualified attorney.
          </p>
        </div>
      </div>
    </div>
  )
}
