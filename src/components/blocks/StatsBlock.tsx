import { FileText, Users, MapPin, PenTool, TrendingUp, Eye, Heart, Globe } from 'lucide-react'
import type { PageBlock } from '@/context/PageBuilderContext'

const iconMap: Record<string, React.ElementType> = {
  FileText,
  Users,
  MapPin,
  PenTool,
  TrendingUp,
  Eye,
  Heart,
  Globe,
}

function StatItem({
  label,
  value,
  iconName,
}: {
  label: string
  value: string
  iconName: string
}) {
  const IconComp = iconMap[iconName] || TrendingUp
  return (
    <div className="flex flex-col items-center text-center p-4">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
        style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
      >
        <IconComp size={24} className="text-white" />
      </div>
      <span className="text-3xl font-bold text-white mb-1">
        {Number(value).toLocaleString('en-IN')}
      </span>
      <span className="text-sm text-white/80">{label}</span>
    </div>
  )
}

export default function StatsBlock({ block }: { block: PageBlock }) {
  const bgColor = block.styles.backgroundColor || '#1D3557'
  const stats = [
    {
      label: block.content.stat1Label || '',
      value: block.content.stat1Value || '',
      icon: block.content.stat1Icon || 'TrendingUp',
    },
    {
      label: block.content.stat2Label || '',
      value: block.content.stat2Value || '',
      icon: block.content.stat2Icon || 'TrendingUp',
    },
    {
      label: block.content.stat3Label || '',
      value: block.content.stat3Value || '',
      icon: block.content.stat3Icon || 'TrendingUp',
    },
    {
      label: block.content.stat4Label || '',
      value: block.content.stat4Value || '',
      icon: block.content.stat4Icon || 'TrendingUp',
    },
  ].filter((s) => s.label && s.value)

  return (
    <section className="w-full py-12 px-6" style={{ backgroundColor: bgColor }}>
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <StatItem
              key={i}
              label={stat.label}
              value={stat.value}
              iconName={stat.icon}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
