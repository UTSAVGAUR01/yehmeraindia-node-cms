import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  GripVertical,
  Volume2,
  VolumeX,
  Settings,
  Gauge,
  SlidersHorizontal,
  ChevronRight,
  X,
  Mic,
  Smile,
  Frown,
  Zap,
  Minus,
  Clock,
} from 'lucide-react';
import { demoNews, categories, categoryColors } from '@/data/demoNews';
import type { NewsItem, Category } from '@/data/demoNews';
import { useTextToSpeech, generateScript, voicePresets } from '@/hooks/useTextToSpeech';
import type { TTSVoice } from '@/hooks/useTextToSpeech';

/* ------------------------------------------------------------------ */
/*  Easing constants                                                   */
/* ------------------------------------------------------------------ */
const easeSmooth = [0.4, 0, 0.2, 1] as [number, number, number, number];
const SAFFRON = '#FF9933';
const SIGNAL_RED = '#EF4444';

/* ================================================================== */
/*  SENTIMENT DETECTION                                                */
/* ================================================================== */
const POSITIVE_KEYWORDS = [
  'success', 'win', 'launch', 'record', 'growth', 'breakthrough', 'victory',
  'celebrate', 'milestones', 'recover', 'top', 'best', 'highest', 'gold',
  'champion', 'won', 'winning', 'secured', 'raised', 'approved', 'signed',
  'boost', 'surge', 'jumped', 'rose', 'defeated', 'outstanding', 'great',
  'exceptional', 'remarkable', 'progress', 'advanced', 'discovered',
  'innovation', 'revolutionary', 'benefit', 'improved', 'enhanced',
  'splendid', 'thrilled', 'celebration', 'triumph', 'historic',
  'new high', 'all-time', 'milestone', 'landmark', 'cutting-edge',
  'succeed', 'accomplished', 'achieved', 'breakthrough', 'positive',
  'constructive', 'optimistic', 'upward', 'profitable', 'gain',
] as const;

const NEGATIVE_KEYWORDS = [
  'death', 'crash', 'loss', 'fail', 'crisis', 'attack', 'disaster', 'broke',
  'fell', 'decline', 'war', 'violence', 'scam', 'corruption', 'accident',
  'killed', 'murder', 'terror', 'terrorist', 'bombing', 'explosion', 'fire',
  'collapsed', 'damaged', 'destroyed', 'lost', 'falling', 'dropped', 'plunge',
  'recession', 'unemployment', 'poverty', 'hunger', 'drought', 'flood',
  'earthquake', 'cyclone', 'pandemic', 'infection', 'disease', 'outbreak',
  'shortage', 'inflation', 'debt', 'bankrupt', 'fraud', 'cheating', 'bribery',
  'scandal', 'controversy', 'protest', 'riot', 'clash', 'conflict',
  'tension', 'threat', 'warning', 'alert', 'emergency', 'evacuation',
  'casualties', 'injured', 'missing', 'trapped', 'hostage', 'threatened',
] as const;

type Sentiment = 'positive' | 'negative' | 'neutral';
type Expression = 'neutral' | 'smile' | 'serious' | 'excited';

const VIDEO_MAP: Record<Expression, string> = {
  neutral: '/anchor-neutral.mp4',
  smile: '/anchor-smile.mp4',
  serious: '/anchor-serious.mp4',
  excited: '/anchor-excited.mp4',
};

const EXPRESSION_CONFIG: Record<Expression, { label: string; color: string; icon: string }> = {
  neutral:  { label: 'Neutral',  color: '#94A3B8', icon: 'minus' },
  smile:    { label: 'Smiling',  color: '#10B981', icon: 'smile' },
  serious:  { label: 'Serious',  color: '#EF4444', icon: 'frown' },
  excited:  { label: 'Excited',  color: '#F59E0B', icon: 'zap' },
};

function analyzeSentiment(text: string): Sentiment {
  const lower = text.toLowerCase();
  let posCount = 0;
  let negCount = 0;
  for (const kw of POSITIVE_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) posCount++;
  }
  for (const kw of NEGATIVE_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) negCount++;
  }
  if (negCount > posCount) return 'negative';
  if (posCount > negCount) return 'positive';
  return 'neutral';
}

function sentimentToExpression(sentiment: Sentiment): Expression {
  switch (sentiment) {
    case 'positive': return 'excited';
    case 'negative': return 'serious';
    default: return 'neutral';
  }
}

function useSentiment(story: NewsItem): { sentiment: Sentiment; expression: Expression } {
  return useMemo(() => {
    const text = `${story.title} ${story.excerpt}`;
    const sentiment = analyzeSentiment(text);
    const expression = sentimentToExpression(sentiment);
    return { sentiment, expression };
  }, [story.id, story.title, story.excerpt]);
}

/* ================================================================== */
/*  BLINK OVERLAY                                                      */
/* ================================================================== */
function BlinkOverlay() {
  const [blinking, setBlinking] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const delay = 3000 + Math.random() * 2000; // 3-5 seconds
      timeout = setTimeout(() => {
        setBlinking(true);
        setTimeout(() => setBlinking(false), 150);
        schedule();
      }, delay);
    };
    schedule();
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div
      className="absolute left-0 right-0 z-[15] pointer-events-none transition-opacity"
      style={{
        top: 0,
        height: '35%',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.25) 60%, transparent 100%)',
        opacity: blinking ? 1 : 0,
        transitionDuration: '150ms',
      }}
    />
  );
}

/* ================================================================== */
/*  ENHANCED LIP SYNC OVERLAY (CSS)                                    */
/* ================================================================== */
function LipSyncOverlay({ speaking, rate }: { speaking: boolean; rate: number }) {
  const duration = useMemo(() => {
    return Math.max(0.3, 0.8 / rate);
  }, [rate]);

  return (
    <>
      <style>{`
        @keyframes lip-sync {
          0%, 100% { transform: scaleY(1) scaleX(1); }
          25% { transform: scaleY(1.008) scaleX(1.002); }
          50% { transform: scaleY(1.015) scaleX(1); }
          75% { transform: scaleY(1.005) scaleX(1.003); }
        }
      `}</style>
      <div
        className="absolute bottom-0 left-0 right-0 z-[15] pointer-events-none"
        style={{
          height: '40%',
          transformOrigin: 'center bottom',
          animation: speaking ? `lip-sync ${duration}s ease-in-out infinite` : 'none',
        }}
      />
    </>
  );
}

/* ================================================================== */
/*  LIP SYNC CANVAS COMPONENT                                          */
/* ================================================================== */
function LipSyncCanvas({ isSpeaking, rate }: { isSpeaking: boolean; rate: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isSpeaking || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    const interval = Math.max(50, 120 / rate); // ms per frame, adjusted by speech rate

    const draw = () => {
      if (!ctx || !canvasRef.current) return;
      ctx.clearRect(0, 0, 200, 80);

      // Animated open amount based on sine wave
      const openAmount = Math.abs(Math.sin(frame * 0.3)) * 30 + 10;

      // Upper lip
      ctx.fillStyle = '#cc6666';
      ctx.beginPath();
      ctx.ellipse(100, 30, 40, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Lower lip (animated)
      ctx.fillStyle = '#cc5555';
      ctx.beginPath();
      ctx.ellipse(100, 35 + openAmount * 0.3, 40, openAmount * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Lip shine highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.ellipse(100, 28, 25, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      frame++;
    };

    draw(); // draw immediately
    const timer = setInterval(draw, interval);
    return () => clearInterval(timer);
  }, [isSpeaking, rate]);

  if (!isSpeaking) return null;

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={80}
      className="absolute bottom-[15%] left-1/2 -translate-x-1/2 z-20 opacity-60 pointer-events-none"
    />
  );
}

/* ================================================================== */
/*  EXPRESSION INDICATOR                                               */
/* ================================================================== */
function ExpressionIndicator({ expression }: { expression: Expression }) {
  const config = EXPRESSION_CONFIG[expression];

  const IconComp = useMemo(() => {
    switch (config.icon) {
      case 'smile': return Smile;
      case 'frown': return Frown;
      case 'zap': return Zap;
      default: return Minus;
    }
  }, [config.icon]);

  return (
    <motion.div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-void/70 backdrop-blur-sm"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      key={expression}
      transition={{ duration: 0.3, ease: easeSmooth }}
    >
      <span
        className="relative flex h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: config.color }}
      >
        <span
          className="absolute inline-flex h-full w-full rounded-full animate-ping"
          style={{ backgroundColor: config.color, opacity: 0.5, animationDuration: '2s' }}
        />
        <span
          className="relative inline-flex rounded-full h-2.5 w-2.5"
          style={{ backgroundColor: config.color }}
        />
      </span>
      <IconComp size={12} style={{ color: config.color }} />
      <span className="font-mono text-[10px] font-semibold uppercase tracking-wider" style={{ color: config.color }}>
        {config.label}
      </span>
    </motion.div>
  );
}

/* ================================================================== */
/*  VIDEO ANCHOR COMPONENT                                             */
/* ================================================================== */
function VideoAnchor({
  expression,
  speaking,
  rate,
}: {
  expression: Expression;
  speaking: boolean;
  rate: number;
}) {
  const expressions: Expression[] = ['neutral', 'smile', 'serious', 'excited'];

  return (
    <div className="relative w-full h-full">
      {/* Video layers — stack all videos, fade active one in */}
      {expressions.map((expr) => (
        <video
          key={expr}
          src={VIDEO_MAP[expr]}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
          style={{
            opacity: expression === expr ? 1 : 0,
            zIndex: expression === expr ? 5 : 1,
          }}
        />
      ))}

      {/* Blink overlay */}
      <BlinkOverlay />

      {/* Lip sync overlay (CSS animation on video container) */}
      <LipSyncOverlay speaking={speaking} rate={rate} />

      {/* Lip sync canvas (animated lips drawing) */}
      <LipSyncCanvas isSpeaking={speaking} rate={rate} />

      {/* Subtle vignette overlay */}
      <div
        className="absolute inset-0 z-[14] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(11,15,26,0.3) 100%)',
        }}
      />
    </div>
  );
}

/* ================================================================== */
/*  LIVE CLOCK                                                         */
/* ================================================================== */
function LiveClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    setTime(fmt());
    const id = setInterval(() => setTime(fmt()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex items-center gap-2">
      <Clock size={14} className="text-steel" />
      <span className="font-mono text-sm text-frost tabular-nums">{time} IST</span>
    </div>
  );
}

/* ================================================================== */
/*  NEWS TICKER                                                        */
/* ================================================================== */
function NewsTicker({ items }: { items: NewsItem[] }) {
  const tickerText = items.map((n) => `${n.title}`).join(' \u25C6 ');
  return (
    <div className="absolute bottom-0 left-0 right-0 h-9 bg-midnight/85 overflow-hidden flex items-center mask-gradient-x z-20">
      <motion.div
        className="flex items-center gap-8 whitespace-nowrap"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
      >
        <span className="font-mono text-ticker text-frost/80">
          {tickerText} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {tickerText}
        </span>
      </motion.div>
    </div>
  );
}

/* ================================================================== */
/*  STUDIO HERO — Full Broadcast Interface                             */
/* ================================================================== */
function StudioHero({
  isPlaying,
  isPaused,
  onTogglePlay,
  onSkipForward,
  onSkipBack,
  onStop,
  progress,
  volume,
  onVolumeChange,
  playlist,
  currentIndex,
  onSelectStory,
  rate,
  onRateChange,
  selectedVoice,
  onVoiceChange,
  availableVoices,
  autoPlay,
  onAutoPlayChange,
  activeTopics,
  onToggleTopic,
  expression,
  sentiment,
  speaking,
}: {
  isPlaying: boolean;
  isPaused: boolean;
  onTogglePlay: () => void;
  onSkipForward: () => void;
  onSkipBack: () => void;
  onStop: () => void;
  progress: number;
  volume: number;
  onVolumeChange: (v: number) => void;
  playlist: NewsItem[];
  currentIndex: number;
  onSelectStory: (i: number) => void;
  rate: number;
  onRateChange: (r: number) => void;
  selectedVoice: TTSVoice | null;
  onVoiceChange: (v: TTSVoice) => void;
  availableVoices: TTSVoice[];
  autoPlay: boolean;
  onAutoPlayChange: () => void;
  activeTopics: Record<string, boolean>;
  onToggleTopic: (t: string) => void;
  expression: Expression;
  sentiment: Sentiment;
  speaking: boolean;
}) {
  const [panelTab, setPanelTab] = useState<'playlist' | 'settings' | 'sources'>('playlist');
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    const handle = () => setPanelOpen(window.innerWidth >= 1024);
    handle();
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  const displayVoices = availableVoices.length > 0
    ? availableVoices.slice(0, 8)
    : [
        { name: 'Google US English', lang: 'en-US' },
        { name: 'Samantha', lang: 'en-US' },
        { name: 'Victoria', lang: 'en-GB' },
        { name: 'Karen', lang: 'en-AU' },
      ];

  return (
    <section className="relative w-full min-h-[100dvh] flex flex-col lg:flex-row overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img
          src="/studio-ambience.png"
          alt=""
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-[rgba(11,15,26,0.7)]" />
      </div>

      {/* Mobile panel toggle */}
      <button
        className="lg:hidden absolute top-4 right-4 z-40 w-10 h-10 rounded-lg bg-midnight/80 border border-slate flex items-center justify-center text-frost"
        onClick={() => setPanelOpen(!panelOpen)}
        aria-label="Toggle panel"
      >
        {panelOpen ? <X size={18} /> : <Settings size={18} />}
      </button>

      {/* -- Main Anchor Viewport -- */}
      <motion.div
        className="relative z-10 flex-1 flex flex-col pt-16 lg:pt-0"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: easeSmooth }}
      >
        <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
          <div
            className={`relative w-full lg:w-[60%] aspect-video rounded-2xl border-2 overflow-hidden bg-midnight/60 ${
              isPlaying ? 'shadow-[0_0_30px_rgba(255,153,51,0.15)]' : ''
            }`}
            style={{ borderColor: isPlaying ? `${SAFFRON}80` : `${SAFFRON}33` }}
          >
            {/* Video-based anchor */}
            <VideoAnchor expression={expression} speaking={speaking} rate={rate} />

            {/* Live badge */}
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-signal/90 text-white px-3 py-1.5 rounded-full z-20"
              style={{ backgroundColor: `${SIGNAL_RED}E6` }}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-white animate-pulse-dot" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              <span className="font-mono text-xs font-semibold">LIVE</span>
            </div>

            {/* Time display */}
            <div className="absolute top-4 right-4 bg-void/60 backdrop-blur-sm px-3 py-1.5 rounded-lg z-20">
              <LiveClock />
            </div>

            {/* Expression indicator */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
              <ExpressionIndicator expression={expression} />
            </div>

            {/* TTS speaking indicator */}
            <AnimatePresence>
              {speaking && (
                <motion.div
                  className="absolute bottom-12 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: `${SAFFRON}CC` }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Mic size={12} className="text-white" />
                  <span className="font-mono text-[10px] font-semibold text-white uppercase tracking-wider">
                    Speaking
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Ticker */}
            <NewsTicker items={playlist.slice(currentIndex, currentIndex + 8)} />
          </div>
        </div>

        {/* -- Bottom Control Bar -- */}
        <motion.div
          className="relative z-20 h-14 bg-void border-t border-slate flex items-center px-4 lg:px-8 gap-4"
          initial={{ y: 56 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.4, delay: 0.5, ease: easeSmooth }}
        >
          {/* Left controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={onSkipBack}
              className="w-10 h-10 rounded-lg bg-midnight flex items-center justify-center transition-colors"
              style={{ color: SAFFRON }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FFB366')}
              onMouseLeave={(e) => (e.currentTarget.style.color = SAFFRON)}
              aria-label="Skip back"
            >
              <SkipBack size={18} />
            </button>
            <button
              onClick={onTogglePlay}
              className="w-10 h-10 rounded-lg bg-midnight flex items-center justify-center transition-colors"
              style={{ color: SAFFRON }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FFB366')}
              onMouseLeave={(e) => (e.currentTarget.style.color = SAFFRON)}
              aria-label={isPlaying && !isPaused ? 'Pause' : 'Play'}
            >
              {isPlaying && !isPaused ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button
              onClick={onSkipForward}
              className="w-10 h-10 rounded-lg bg-midnight flex items-center justify-center transition-colors"
              style={{ color: SAFFRON }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FFB366')}
              onMouseLeave={(e) => (e.currentTarget.style.color = SAFFRON)}
              aria-label="Skip forward"
            >
              <SkipForward size={18} />
            </button>
            <button
              onClick={onStop}
              className="w-8 h-8 rounded-md bg-midnight/60 flex items-center justify-center text-steel hover:text-frost transition-colors text-xs"
              aria-label="Stop"
            >
              <X size={14} />
            </button>
          </div>

          {/* Progress bar */}
          <div className="flex-1 flex items-center gap-3 min-w-0">
            <span className="font-mono text-xs text-steel hidden sm:inline tabular-nums">
              {Math.floor(progress * 100)}%
            </span>
            <div className="flex-1 h-1 bg-slate rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ width: `${progress * 100}%`, backgroundColor: SAFFRON }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Volume + rate display */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onVolumeChange(volume > 0 ? 0 : 1)}
              className="text-steel hover:text-frost transition-colors"
              aria-label="Toggle volume"
            >
              {volume > 0 ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-20 h-1 hidden sm:block cursor-pointer"
              style={{ accentColor: SAFFRON }}
              aria-label="Volume"
            />
            <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded bg-midnight">
              <Gauge size={12} style={{ color: SAFFRON }} />
              <span className="font-mono text-[10px] tabular-nums" style={{ color: SAFFRON }}>
                {rate.toFixed(1)}x
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* -- Side Panel - Control Deck -- */}
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            className="fixed inset-y-0 right-0 z-50 w-[340px] max-w-[85vw] bg-midnight/95 backdrop-blur-xl border-l border-slate flex flex-col lg:absolute lg:inset-y-0 lg:right-0 lg:left-auto"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.4, ease: easeSmooth }}
          >
            {/* Close on mobile */}
            <button
              className="lg:hidden absolute top-4 right-4 text-frost"
              onClick={() => setPanelOpen(false)}
              aria-label="Close panel"
            >
              <X size={20} />
            </button>

            {/* Tabs */}
            <div className="flex items-center border-b border-slate">
              {(['playlist', 'settings', 'sources'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setPanelTab(tab)}
                  className={`flex-1 py-3 text-sm font-medium font-body capitalize transition-colors relative ${
                    panelTab === tab ? '' : 'text-steel hover:text-frost'
                  }`}
                  style={{ color: panelTab === tab ? SAFFRON : undefined }}
                >
                  {tab}
                  {panelTab === tab && (
                    <motion.div
                      className="absolute bottom-0 left-4 right-4 h-0.5"
                      style={{ backgroundColor: SAFFRON }}
                      layoutId="panel-tab"
                      transition={{ duration: 0.25, ease: easeSmooth }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto">
              {/* Playlist Tab */}
              {panelTab === 'playlist' && (
                <div className="py-2">
                  {playlist.map((story, i) => (
                    <button
                      key={story.id}
                      onClick={() => { onSelectStory(i); if (window.innerWidth < 1024) setPanelOpen(false); }}
                      className={`w-full text-left px-4 py-3 border-b border-slate flex items-start gap-3 transition-colors ${
                        i === currentIndex
                          ? 'border-l-[3px]'
                          : 'hover:bg-midnight'
                      }`}
                      style={i === currentIndex ? { backgroundColor: `${SAFFRON}1A`, borderLeftColor: SAFFRON } : {}}
                    >
                      <GripVertical size={16} className="text-steel mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-frost truncate font-medium">{story.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{
                              color: categoryColors[story.category as Category] || SAFFRON,
                              border: `1px solid ${categoryColors[story.category as Category] || SAFFRON}`,
                            }}
                          >
                            {story.category}
                          </span>
                          <span className="font-mono text-xs text-steel">{story.duration}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Settings Tab */}
              {panelTab === 'settings' && (
                <div className="p-4 space-y-6">
                  {/* Voice selector */}
                  <div>
                    <label className="block text-sm text-frost mb-2 font-body">Voice</label>
                    <select
                      value={selectedVoice?.name || ''}
                      onChange={(e) => {
                        const v = availableVoices.find((vo) => vo.name === e.target.value);
                        if (v) onVoiceChange(v);
                      }}
                      className="w-full bg-void border border-slate rounded-lg px-3 py-2 text-sm text-frost focus:outline-none"
                      style={{ accentColor: SAFFRON }}
                    >
                      {displayVoices.map((v) => (
                        <option key={v.name} value={v.name}>
                          {v.name} {v.lang ? `(${v.lang})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Speed control */}
                  <div>
                    <label className="block text-sm text-frost mb-2 font-body">
                      Speed: <span className="font-mono" style={{ color: SAFFRON }}>{rate.toFixed(1)}x</span>
                    </label>
                    <input
                      type="range"
                      min={0.5}
                      max={2.0}
                      step={0.1}
                      value={rate}
                      onChange={(e) => onRateChange(parseFloat(e.target.value))}
                      className="w-full cursor-pointer"
                      style={{ accentColor: SAFFRON }}
                      aria-label="Speech speed"
                    />
                    <div className="flex justify-between text-xs text-steel mt-1">
                      <span>0.5x</span>
                      <span>1.0x</span>
                      <span>2.0x</span>
                    </div>
                  </div>

                  {/* Volume control */}
                  <div>
                    <label className="block text-sm text-frost mb-2 font-body">
                      Volume: <span className="font-mono" style={{ color: SAFFRON }}>{Math.round(volume * 100)}%</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={volume}
                      onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                      className="w-full cursor-pointer"
                      style={{ accentColor: SAFFRON }}
                      aria-label="Volume"
                    />
                    <div className="flex justify-between text-xs text-steel mt-1">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Expression info */}
                  <div className="p-3 rounded-lg border border-slate bg-void">
                    <p className="text-xs text-steel mb-2">Current Expression</p>
                    <div className="flex items-center justify-between">
                      <ExpressionIndicator expression={expression} />
                      <span className="text-xs text-steel capitalize">{sentiment} sentiment</span>
                    </div>
                  </div>

                  {/* Auto-play toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-frost font-body">Auto-play</span>
                    <button
                      onClick={onAutoPlayChange}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        autoPlay ? '' : 'bg-slate'
                      }`}
                      style={{ backgroundColor: autoPlay ? SAFFRON : undefined }}
                      aria-label="Toggle auto-play"
                    >
                      <motion.div
                        className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full"
                        animate={{ x: autoPlay ? 20 : 0 }}
                        transition={{ duration: 0.2, ease: easeSmooth }}
                      />
                    </button>
                  </div>
                </div>
              )}

              {/* Sources Tab */}
              {panelTab === 'sources' && (
                <div className="p-4 space-y-3">
                  <p className="text-sm text-steel mb-4">
                    Select topic categories to include in your broadcast:
                  </p>
                  {categories.map((cat) => (
                    <div key={cat} className="flex items-center justify-between">
                      <span className="text-sm text-frost font-body">{cat}</span>
                      <button
                        onClick={() => onToggleTopic(cat)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${
                          activeTopics[cat] ? '' : 'bg-slate'
                        }`}
                        style={{ backgroundColor: activeTopics[cat] ? SAFFRON : undefined }}
                        aria-label={`Toggle ${cat}`}
                      >
                        <motion.div
                          className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full"
                          animate={{ x: activeTopics[cat] ? 18 : 0 }}
                          transition={{ duration: 0.2, ease: easeSmooth }}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ================================================================== */
/*  SECTION 2 - NOW PLAYING (Story Detail)                            */
/* ================================================================== */
function NowPlayingSection({ story, expression }: { story: NewsItem; expression: Expression }) {
  return (
    <section className="py-16 bg-void">
      <div className="max-w-container mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-[60%_40%] gap-12">
          {/* Left column */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: easeSmooth }}
          >
            {/* Eyebrow */}
            <div className="flex items-center gap-2 mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-signal" />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: SIGNAL_RED }} />
              </span>
              <span className="font-mono text-xs font-medium tracking-wider uppercase" style={{ color: SIGNAL_RED }}>
                NOW PLAYING
              </span>
            </div>

            {/* Headline */}
            <AnimatePresence mode="wait">
              <motion.h2
                key={story.id}
                className="font-heading font-bold text-h1 text-frost mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: easeSmooth }}
              >
                {story.title}
              </motion.h2>
            </AnimatePresence>

            {/* Meta bar */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span
                className="text-xs font-medium px-3 py-1 rounded-full"
                style={{
                  color: categoryColors[story.category as Category] || SAFFRON,
                  border: `1px solid ${categoryColors[story.category as Category] || SAFFRON}`,
                }}
              >
                {story.category}
              </span>
              <span className="text-steel text-sm">{story.source}</span>
              <span className="text-steel text-sm">&middot;</span>
              <span className="text-steel text-sm">{story.timestamp}</span>
              <span className="text-steel text-sm">&middot;</span>
              <span className="text-steel text-sm">{story.readTime}</span>
            </div>

            {/* Excerpt */}
            <AnimatePresence mode="wait">
              <motion.p
                key={`${story.id}-excerpt`}
                className="text-steel leading-[1.75] text-body"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                {story.excerpt}
              </motion.p>
            </AnimatePresence>

            <a
              href="#"
              className="inline-flex items-center gap-1 font-medium text-sm mt-6 transition-colors hover:opacity-80"
              style={{ color: SAFFRON }}
            >
              Read Full Story <ChevronRight size={16} />
            </a>
          </motion.div>

          {/* Right column - image */}
          <motion.div
            className="relative aspect-video rounded-2xl overflow-hidden"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.15, ease: easeSmooth }}
          >
            <img
              src={`/category-${story.category.toLowerCase()}.jpg`}
              alt={story.category}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/category-tech.jpg';
              }}
            />
            {/* Expression overlay */}
            <div className="absolute top-3 right-3 z-10">
              <ExpressionIndicator expression={expression} />
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-void/70 px-4 py-3">
              <p className="text-xs text-steel">
                {story.source} &middot; {story.timestamp}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/*  SECTION 3 - UPCOMING STORIES QUEUE                                */
/* ================================================================== */
function StoryQueue({
  stories,
  currentIndex,
  onSelectStory,
}: {
  stories: NewsItem[];
  currentIndex: number;
  onSelectStory: (i: number) => void;
}) {
  const upcoming = stories.slice(currentIndex + 1, currentIndex + 6);

  return (
    <section className="py-16 bg-midnight">
      <div className="max-w-container mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <motion.h2
            className="font-heading font-bold text-h2 text-frost"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: easeSmooth }}
          >
            Coming Up Next
          </motion.h2>
          <motion.button
            className="border border-slate text-frost text-sm font-medium rounded-full px-5 py-2 transition-colors hover:border-[#FF9933]"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Customize Queue
          </motion.button>
        </div>

        {/* Horizontal scroll cards */}
        <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide">
          {upcoming.length === 0 && (
            <p className="text-steel text-sm py-8">End of playlist. Skip back to see earlier stories.</p>
          )}
          {upcoming.map((story, i) => {
            const globalIndex = currentIndex + 1 + i;
            return (
              <motion.button
                key={story.id}
                className="flex-shrink-0 w-[300px] group text-left"
                initial={{ opacity: 0, x: 60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: easeSmooth }}
                whileHover={{ y: -4 }}
                onClick={() => onSelectStory(globalIndex)}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video rounded-t-xl overflow-hidden">
                  <img
                    src={`/category-${story.category.toLowerCase()}.jpg`}
                    alt={story.category}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/category-tech.jpg';
                    }}
                  />
                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-void/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: SAFFRON }}>
                      <Play size={18} className="text-white ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 bg-void rounded-b-xl border border-t-0 border-slate">
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      color: categoryColors[story.category as Category] || SAFFRON,
                      border: `1px solid ${categoryColors[story.category as Category] || SAFFRON}`,
                    }}
                  >
                    {story.category}
                  </span>
                  <h3 className="font-heading font-semibold text-sm text-frost mt-2 line-clamp-2">
                    {story.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-mono text-xs text-steel">{story.duration}</span>
                    <span className="text-steel">&middot;</span>
                    <span className="font-mono text-xs text-steel">
                      Up next
                    </span>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/*  SECTION 4 - ANCHOR CUSTOMIZATION                                  */
/* ================================================================== */
function CustomizationSection({
  rate,
  onRateChange,
  selectedVoicePreset,
  onVoicePresetChange,
  activeTopics,
  onToggleTopic,
}: {
  rate: number;
  onRateChange: (r: number) => void;
  selectedVoicePreset: string;
  onVoicePresetChange: (v: string) => void;
  activeTopics: Record<string, boolean>;
  onToggleTopic: (t: string) => void;
}) {
  const cards = [
    {
      id: 'voice',
      icon: <Volume2 size={32} style={{ color: SAFFRON }} />,
      title: 'Choose Your Voice',
      description: 'Select from multiple professional AI voices with English delivery and diverse personalities.',
    },
    {
      id: 'speed',
      icon: <Gauge size={32} style={{ color: SAFFRON }} />,
      title: 'Set the Pace',
      description: 'Adjust reading speed from a calm 0.5x to a brisk 2.0x.',
    },
    {
      id: 'topics',
      icon: <SlidersHorizontal size={32} style={{ color: SAFFRON }} />,
      title: 'Curate Your Feed',
      description: 'Prioritize the categories and topics you care about most.',
    },
  ];

  return (
    <section className="py-24 bg-void">
      <div className="max-w-container mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.span
            className="font-mono text-xs tracking-[0.15em] uppercase"
            style={{ color: SAFFRON }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            PERSONALIZE
          </motion.span>
          <motion.h2
            className="font-heading font-bold text-h1 text-frost mt-3"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.05, ease: easeSmooth }}
          >
            Your Anchor, Your Way
          </motion.h2>
          <motion.p
            className="text-steel mt-3 max-w-lg mx-auto"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1, ease: easeSmooth }}
          >
            Customize how your AI anchor looks, sounds, and delivers the news with professional English narration.
          </motion.p>
        </div>

        {/* Three cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {cards.map((card, cardIdx) => (
            <motion.div
              key={card.id}
              className="bg-midnight rounded-2xl border border-slate p-8 transition-colors hover:border-[#FF9933]/50"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: cardIdx * 0.1, ease: easeSmooth }}
            >
              {/* Icon */}
              <div className="mb-4">{card.icon}</div>
              <h3 className="font-heading font-semibold text-frost text-lg mb-2">{card.title}</h3>
              <p className="text-steel text-sm mb-6">{card.description}</p>

              {/* Card-specific controls */}
              {card.id === 'voice' && (
                <div className="flex flex-wrap gap-3">
                  {voicePresets.map((v) => (
                    <button
                      key={v.name}
                      onClick={() => onVoicePresetChange(v.name)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                        selectedVoicePreset === v.name
                          ? 'border-[#FF9933] bg-[#FF9933]/10'
                          : 'border-slate hover:border-[#FF9933]/40'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: v.color }}
                      >
                        {v.name[0]}
                      </div>
                      <div className="text-left">
                        <p className="text-sm text-frost font-medium">{v.name}</p>
                        <p className="text-xs text-steel">{v.label}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {card.id === 'speed' && (
                <div>
                  <div className="flex items-center gap-4 mb-2">
                    <input
                      type="range"
                      min={0.5}
                      max={2.0}
                      step={0.1}
                      value={rate}
                      onChange={(e) => onRateChange(parseFloat(e.target.value))}
                      className="flex-1 cursor-pointer"
                      style={{ accentColor: SAFFRON }}
                      aria-label="Speech speed"
                    />
                    <span className="font-mono text-lg font-medium tabular-nums w-12 text-right" style={{ color: SAFFRON }}>
                      {rate.toFixed(1)}x
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-steel">
                    <span>Relaxed</span>
                    <span>Normal</span>
                    <span>Fast</span>
                  </div>
                </div>
              )}

              {card.id === 'topics' && (
                <div className="grid grid-cols-2 gap-3">
                  {categories.map((cat) => (
                    <div key={cat} className="flex items-center justify-between">
                      <span className="text-sm text-frost">{cat}</span>
                      <button
                        onClick={() => onToggleTopic(cat)}
                        className={`relative w-9 h-5 rounded-full transition-colors ${
                          activeTopics[cat] ? '' : 'bg-slate'
                        }`}
                        style={{ backgroundColor: activeTopics[cat] ? SAFFRON : undefined }}
                        aria-label={`Toggle ${cat}`}
                      >
                        <motion.div
                          className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full"
                          animate={{ x: activeTopics[cat] ? 16 : 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/*  SECTION 5 - TRY IT NOW CTA                                        */
/* ================================================================== */
function CTASection() {
  return (
    <section
      className="py-24 bg-void relative overflow-hidden"
      style={{
        backgroundImage:
          'radial-gradient(ellipse at 30% 50%, rgba(255,153,51,0.06) 0%, rgba(11,15,26,0.95) 60%)',
      }}
    >
      <div className="max-w-container mx-auto px-6 lg:px-12 text-center">
        {/* Pulsing anchor avatar */}
        <motion.div
          className="mb-8 inline-block"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full animate-ping" style={{ animationDuration: '3s', backgroundColor: `${SAFFRON}4D` }} />
            <img
              src="/indian-anchor-hero.png"
              alt="Yeh Mera India AI Anchor"
              className="w-20 h-20 rounded-full object-cover border-[3px] relative z-10"
              style={{ borderColor: SAFFRON }}
            />
          </div>
        </motion.div>

        <motion.h2
          className="font-heading font-bold text-h1 text-frost mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1, ease: easeSmooth }}
        >
          Experience AI-Powered News Today
        </motion.h2>
        <motion.p
          className="text-steel max-w-lg mx-auto mb-8"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2, ease: easeSmooth }}
        >
          Join 2.5 million daily listeners who get their news from Yeh Mera India with professional English narration.
        </motion.p>
        <motion.div
          className="flex flex-wrap items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3, ease: easeSmooth }}
        >
          <a
            href="#"
            className="inline-flex items-center font-body font-semibold rounded-full px-8 py-3 transition-all duration-250 hover:scale-[1.03] hover:shadow-lg"
            style={{ backgroundColor: SAFFRON, color: '#0B0F1A' }}
          >
            Start Listening
          </a>
          <a
            href="/about"
            className="inline-flex items-center border border-slate text-frost font-body font-medium rounded-full px-8 py-3 hover:border-[#FF9933] transition-colors"
          >
            Learn More
          </a>
        </motion.div>
      </div>
    </section>
  );
}

/* ================================================================== */
/*  MAIN ANCHOR PAGE                                                   */
/* ================================================================== */
export default function Anchor() {
  const tts = useTextToSpeech();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [activeTopics, setActiveTopics] = useState<Record<string, boolean>>(
    categories.reduce((acc, c) => ({ ...acc, [c]: true }), {})
  );
  const [selectedVoicePreset, setSelectedVoicePreset] = useState('Emma');
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Filtered playlist based on active topics */
  const playlist = useMemo(
    () => demoNews.filter((item) => activeTopics[item.category]),
    [activeTopics]
  );

  const currentStory = playlist[currentIndex] || playlist[0] || demoNews[0];

  /* Sentiment analysis */
  const { sentiment, expression } = useSentiment(currentStory);

  const rate = tts.rate;

  /* Sync TTS rate */
  useEffect(() => {
    tts.setRate(rate);
  }, [rate]);

  /* Progress simulation */
  useEffect(() => {
    if (tts.speaking && !tts.paused) {
      setProgress(0);
      progressInterval.current = setInterval(() => {
        setProgress((p) => {
          if (p >= 1) {
            if (autoPlay && progressInterval.current) {
              clearInterval(progressInterval.current);
            }
            return 1;
          }
          return p + 0.005;
        });
      }, 100);
    } else {
      if (progressInterval.current) clearInterval(progressInterval.current);
      if (!tts.speaking) setProgress(0);
    }
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [tts.speaking, tts.paused, autoPlay]);

  /* Auto-advance when progress completes */
  useEffect(() => {
    if (progress >= 1 && tts.speaking && autoPlay) {
      const nextIdx = (currentIndex + 1) % playlist.length;
      handleSelectStory(nextIdx);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  /* Speak current story when it changes - uses professional broadcast script */
  const handleSelectStory = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, playlist.length - 1));
      setCurrentIndex(clamped);
      setProgress(0);
      const story = playlist[clamped];
      if (story) {
        const textToSpeak = generateScript(story);
        // small delay for UI update
        setTimeout(() => tts.speak(textToSpeak), 100);
      }
    },
    [playlist, tts]
  );

  const handleTogglePlay = useCallback(() => {
    if (tts.speaking && !tts.paused) {
      tts.pause();
    } else if (tts.paused) {
      tts.resume();
    } else {
      const story = playlist[currentIndex];
      if (story) {
        tts.speak(generateScript(story));
      }
    }
  }, [tts, playlist, currentIndex]);

  const handleSkipForward = useCallback(() => {
    const nextIdx = (currentIndex + 1) % playlist.length;
    handleSelectStory(nextIdx);
  }, [currentIndex, playlist.length, handleSelectStory]);

  const handleSkipBack = useCallback(() => {
    const prevIdx = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    handleSelectStory(prevIdx);
  }, [currentIndex, playlist.length, handleSelectStory]);

  const handleStop = useCallback(() => {
    tts.stop();
    setProgress(0);
  }, [tts]);

  const handleToggleTopic = useCallback((topic: string) => {
    setActiveTopics((prev) => ({ ...prev, [topic]: !prev[topic] }));
  }, []);

  const handleRateChange = useCallback(
    (r: number) => {
      tts.setRate(r);
    },
    [tts]
  );

  return (
    <div className="bg-void">
      {/* Section 1: Studio Hero */}
      <StudioHero
        isPlaying={tts.speaking}
        isPaused={tts.paused}
        onTogglePlay={handleTogglePlay}
        onSkipForward={handleSkipForward}
        onSkipBack={handleSkipBack}
        onStop={handleStop}
        progress={progress}
        volume={volume}
        onVolumeChange={setVolume}
        playlist={playlist}
        currentIndex={currentIndex}
        onSelectStory={handleSelectStory}
        rate={rate}
        onRateChange={handleRateChange}
        selectedVoice={tts.selectedVoice}
        onVoiceChange={tts.setVoice}
        availableVoices={tts.voices}
        autoPlay={autoPlay}
        onAutoPlayChange={() => setAutoPlay((v) => !v)}
        activeTopics={activeTopics}
        onToggleTopic={handleToggleTopic}
        expression={expression}
        sentiment={sentiment}
        speaking={tts.speaking}
      />

      {/* Section 2: Now Playing */}
      <NowPlayingSection story={currentStory} expression={expression} />

      {/* Section 3: Upcoming Stories */}
      <StoryQueue
        stories={playlist}
        currentIndex={currentIndex}
        onSelectStory={handleSelectStory}
      />

      {/* Section 4: Customization */}
      <CustomizationSection
        rate={rate}
        onRateChange={handleRateChange}
        selectedVoicePreset={selectedVoicePreset}
        onVoicePresetChange={setSelectedVoicePreset}
        activeTopics={activeTopics}
        onToggleTopic={handleToggleTopic}
      />

      {/* Section 5: CTA */}
      <CTASection />
    </div>
  );
}
