import type { PageBlock } from '@/context/PageBuilderContext'

const PATTERNS: Record<string, string> = {
  lahariya: `repeating-linear-gradient(
    45deg,
    #E85D04 0px, #E85D04 8px,
    #FFF8F0 8px, #FFF8F0 16px,
    #1D3557 16px, #1D3557 24px,
    #FFF8F0 24px, #FFF8F0 32px
  )`,
  bandhej: `radial-gradient(circle at 25% 25%, #E85D04 3px, transparent 3px),
  radial-gradient(circle at 75% 75%, #1D3557 3px, transparent 3px),
  radial-gradient(circle at 75% 25%, #BC4749 3px, transparent 3px),
  radial-gradient(circle at 25% 75%, #2D6A4F 3px, transparent 3px)`,
  warli: `none`,
  ajrakh: `repeating-conic-gradient(
    from 0deg at 50% 50%,
    #1D3557 0deg 15deg,
    #E85D04 15deg 30deg,
    #2B2D42 30deg 45deg,
    #FFF8F0 45deg 60deg
  )`,
}

const PATTERN_BG: Record<string, string> = {
  warli: '#FFF8F0',
  lahariya: '#FFF8F0',
  bandhej: '#FFF8F0',
  ajrakh: '#FFF8F0',
}

export default function DividerBlock({ block }: { block: PageBlock }) {
  const patternType = block.content.patternType || 'lahariya'
  const height = block.content.height || '40'

  if (patternType === 'warli') {
    return (
      <div className="w-full flex items-center justify-center py-4" style={{ backgroundColor: '#FFF8F0' }}>
        <div className="flex items-center gap-3">
          <div className="w-16 h-px" style={{ backgroundColor: '#E85D04' }} />
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="opacity-50">
            <circle cx="16" cy="16" r="14" stroke="#E85D04" strokeWidth="2" />
            <circle cx="16" cy="16" r="8" stroke="#E85D04" strokeWidth="1.5" />
            <path d="M8 16h16M16 8v16" stroke="#E85D04" strokeWidth="1.5" />
            <path d="M10.5 10.5l11 11M10.5 21.5l11-11" stroke="#E85D04" strokeWidth="1" />
          </svg>
          <div className="w-16 h-px" style={{ backgroundColor: '#E85D04' }} />
        </div>
      </div>
    )
  }

  return (
    <div
      className="w-full"
      style={{
        height: `${height}px`,
        background: PATTERNS[patternType] || PATTERNS.lahariya,
        backgroundColor: PATTERN_BG[patternType] || '#FFF8F0',
        backgroundSize: patternType === 'bandhej' ? '24px 24px' : undefined,
      }}
    />
  )
}
