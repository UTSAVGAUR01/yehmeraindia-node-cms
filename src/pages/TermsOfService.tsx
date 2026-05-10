import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { ArrowLeft, FileCheck, PenTool, Users, Gavel, AlertTriangle, Mail } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

const sections = [
  {
    id: 'acceptance',
    icon: <FileCheck size={18} />,
    title: 'Acceptance of Terms',
    content: [
      'By accessing or using the Yeh Mera India website, mobile application, and services (collectively, the "Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Platform.',
      'These Terms constitute a legally binding agreement between you and Yeh Mera India ("YMI", "we", "us", or "our"), a digital news platform operated from India. By using our Platform, you represent that you are at least 13 years of age and have the legal capacity to enter into these Terms.',
      'We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting. Your continued use of the Platform following the posting of revised Terms constitutes your acceptance of such changes.',
    ],
  },
  {
    id: 'content',
    icon: <PenTool size={18} />,
    title: 'Content & Intellectual Property',
    content: [
      'All content published on Yeh Mera India, including articles, videos, photographs, graphics, logos, and software ("Content"), is the property of YMI or its content suppliers and is protected by Indian and international copyright, trademark, and other intellectual property laws.',
      'You may access and view Content for your personal, non-commercial use. You may not reproduce, distribute, modify, create derivative works from, publicly display, or exploit any Content without prior written consent from YMI or the respective rights holder.',
      'User-generated content submitted to the Platform (comments, guest posts, etc.) remains the property of the submitting user. By submitting content, you grant YMI a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, translate, and distribute such content in any media.',
      'Yeh Mera India respects the intellectual property rights of others. If you believe that any Content on our Platform infringes your copyright, please contact us with a detailed description of the alleged infringement.',
    ],
  },
  {
    id: 'conduct',
    icon: <Users size={18} />,
    title: 'User Conduct',
    content: [
      'You agree to use our Platform only for lawful purposes and in a manner that does not infringe the rights of, restrict, or inhibit anyone else\'s use and enjoyment of the Platform. Prohibited behavior includes: (a) posting or transmitting material that is defamatory, obscene, hateful, or inflammatory; (b) engaging in harassment, threats, or abuse towards other users; (c) impersonating any person or entity; (d) uploading viruses or malicious code; (e) attempting to gain unauthorized access to our systems; and (f) interfering with the proper working of the Platform.',
      'Users are responsible for maintaining the confidentiality of their account credentials and for all activities that occur under their account. You agree to notify us immediately of any unauthorized use of your account.',
      'We reserve the right to suspend or terminate accounts that violate these conduct rules, without prior notice and at our sole discretion.',
    ],
  },
  {
    id: 'accounts',
    icon: <Users size={18} />,
    title: 'Account Registration',
    content: [
      'To access certain features of the Platform, you may be required to register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.',
      'You may not use the username or email of another person without authorization. We reserve the right to reclaim usernames or suspend accounts that violate this policy.',
      'Authors and contributors applying for content creation privileges must provide accurate biographical information and agree to our Editorial Guidelines in addition to these Terms.',
    ],
  },
  {
    id: 'termination',
    icon: <Gavel size={18} />,
    title: 'Termination',
    content: [
      'We may terminate or suspend your account and access to the Platform immediately, without prior notice or liability, for any reason, including if you breach these Terms.',
      'Upon termination, your right to use the Platform will immediately cease. All provisions of these Terms which by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, indemnity, and limitations of liability.',
      'You may terminate your account at any time by contacting us or through your account settings. Upon termination, you may request deletion of your personal data, subject to our Privacy Policy and applicable legal requirements.',
    ],
  },
  {
    id: 'disclaimer',
    icon: <AlertTriangle size={18} />,
    title: 'Disclaimer & Liability',
    content: [
      'The Content on Yeh Mera India is provided for general information purposes only. While we strive to provide accurate and timely news, we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability, or availability of the Content.',
      'Yeh Mera India shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising out of your access to or use of the Platform. This includes damages for errors, omissions, interruptions, defects, delays, computer viruses, loss of profits, or loss of data.',
      'The views and opinions expressed in user-generated content or by guest authors are those of the respective authors and do not necessarily reflect the official policy or position of Yeh Mera India.',
    ],
  },
  {
    id: 'governing',
    icon: <Gavel size={18} />,
    title: 'Governing Law',
    content: [
      'These Terms shall be governed by and construed in accordance with the laws of the Republic of India, without regard to its conflict of law provisions.',
      'Any dispute arising out of or in connection with these Terms shall first be attempted to be resolved through good faith negotiation. If not resolved, disputes shall be subject to the exclusive jurisdiction of the courts in New Delhi, India.',
    ],
  },
]

export default function TermsOfService() {
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
            Terms of Service
          </h1>
          <p className="text-base" style={{ color: '#6B7280' }}>
            Please read these terms carefully before using the Yeh Mera India platform. By using our services, you agree to these terms.
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
            If you have any questions about these Terms of Service, please contact us at{' '}
            <a href="mailto:legal@yehmeraindia.com" className="font-medium hover:underline" style={{ color: '#E85D04' }}>
              legal@yehmeraindia.com
            </a>
            {' '}or write to us at: Yeh Mera India, 123 News Street, New Delhi — 110001, India.
          </p>
        </motion.section>

        {/* Footer link */}
        <div className="mt-8 text-center">
          <p className="text-xs" style={{ color: '#9CA3AF' }}>
            These terms of service are provided for informational purposes. For legal advice, please consult a qualified attorney.
          </p>
        </div>
      </div>
    </div>
  )
}
