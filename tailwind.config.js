/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /* ── Warm Indian Palette (NEW) ── */
        cream: '#FFF8F0',
        'cream-dark': '#F5EDE0',
        saffron: '#E85D04',
        'saffron-light': '#F4A261',
        indigo: '#1D3557',
        'indigo-light': '#457B9D',
        terracotta: '#BC4749',
        green: '#2D6A4F',
        gold: '#D4A373',
        charcoal: '#2B2D42',
        'charcoal-light': '#6C757D',

        /* ── Legacy colors (backward compat) ── */
        void: '#0B0F1A',
        midnight: '#111827',
        slate: '#1E293B',
        steel: '#475569',
        frost: '#F8FAFC',
        'pure-white': '#FFFFFF',
        'white-pure': '#FFFFFF',
        'green-india': '#138808',
        'green-light': '#4CAF50',
        'navy-india': '#1A237E',
        'chakra-blue': '#0000CD',

        /* ── shadcn/ui theme colors ── */
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'Hind', 'system-ui', 'sans-serif'],
        heading: ['"Space Grotesk"', 'Hind', 'system-ui', 'sans-serif'],
        body: ['Inter', 'Hind', 'system-ui', 'sans-serif'],
        hindi: ['Hind', 'system-ui', 'sans-serif'],
        editorial: ['"Playfair Display"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        hero: ['clamp(3rem, 8vw, 7rem)', { lineHeight: '0.92', letterSpacing: '-0.03em' }],
        h1: ['clamp(2rem, 5vw, 4rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        h2: ['clamp(1.5rem, 3vw, 2.5rem)', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        h3: ['1.25rem', { lineHeight: '1.3', letterSpacing: '-0.02em' }],
        ticker: ['0.8125rem', { lineHeight: '1.2' }],
      },
      maxWidth: {
        container: '1280px',
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        'warm': '0 2px 12px rgba(0, 0, 0, 0.08)',
        'warm-lg': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'warm-hover': '0 12px 32px rgba(0, 0, 0, 0.14)',
        /* legacy glow shadows */
        'card-glow': '0 0 20px rgba(232, 93, 4, 0.15)',
        'card-glow-lg': '0 0 30px rgba(232, 93, 4, 0.25)',
        'border-glow': '0 0 24px rgba(232, 93, 4, 0.18)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        "ticker-scroll": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "pulse-dot": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.5)", opacity: "0.5" },
        },
        "float-up": {
          "0%": { transform: "translateY(0) scale(1)", opacity: "0.6" },
          "50%": { opacity: "0.3" },
          "100%": { transform: "translateY(-120px) scale(0.4)", opacity: "0" },
        },
        "gradient-rotate": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px) translateX(0px)" },
          "25%": { transform: "translateY(-10px) translateX(5px)" },
          "50%": { transform: "translateY(-5px) translateX(-5px)" },
          "75%": { transform: "translateY(-15px) translateX(3px)" },
        },
        "orb-drift": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(30px, -20px) scale(1.05)" },
          "66%": { transform: "translate(-20px, 15px) scale(0.95)" },
        },
        "counter": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        "ticker-scroll": "ticker-scroll 30s linear infinite",
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
        "float-up": "float-up 15s ease-in-out infinite",
        "gradient-rotate": "gradient-rotate 8s linear infinite",
        "float-slow": "float-slow 6s ease-in-out infinite",
        "orb-drift": "orb-drift 20s ease-in-out infinite",
        "counter": "counter 0.6s ease-out forwards",
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(180deg, rgba(255,248,240,0) 0%, rgba(255,248,240,0.95) 100%)',
        'card-glow-radial': 'radial-gradient(circle at 50% 0%, rgba(232,93,4,0.06) 0%, transparent 60%)',
        'accent-sweep': 'linear-gradient(135deg, #E85D04 0%, #F4A261 50%, #2D6A4F 100%)',
        'studio-backdrop': 'radial-gradient(ellipse at 30% 50%, rgba(232,93,4,0.04) 0%, rgba(255,248,240,0.95) 60%)',
        'cream-warm': 'radial-gradient(ellipse at 20% 30%, rgba(232,93,4,0.03) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(29,53,87,0.02) 0%, transparent 50%)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
