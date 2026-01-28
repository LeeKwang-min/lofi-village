/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Cozy Night Study 테마 컬러
        background: "hsl(var(--color-background))",
        surface: {
          DEFAULT: "hsl(var(--color-surface))",
          hover: "hsl(var(--color-surface-hover))",
        },
        warm: {
          DEFAULT: "hsl(var(--color-warm))",
          dim: "hsl(var(--color-warm-dim))",
        },
        cool: {
          DEFAULT: "hsl(var(--color-cool))",
          dim: "hsl(var(--color-cool-dim))",
        },
        "text-primary": "hsl(var(--color-text-primary))",
        "text-secondary": "hsl(var(--color-text-secondary))",
        "text-muted": "hsl(var(--color-text-muted))",
        success: "hsl(var(--color-success))",
        warning: "hsl(var(--color-warning))",
        danger: "hsl(var(--color-danger))",

        // shadcn/ui 호환성 유지
        border: "hsl(var(--color-surface))",
        input: "hsl(var(--color-surface))",
        ring: "hsl(var(--color-warm))",
        foreground: "hsl(var(--color-text-primary))",
        primary: {
          DEFAULT: "hsl(var(--color-warm))",
          foreground: "hsl(var(--color-background))",
        },
        secondary: {
          DEFAULT: "hsl(var(--color-surface))",
          foreground: "hsl(var(--color-text-primary))",
        },
        muted: {
          DEFAULT: "hsl(var(--color-surface))",
          foreground: "hsl(var(--color-text-secondary))",
        },
        accent: {
          DEFAULT: "hsl(var(--color-cool))",
          foreground: "hsl(var(--color-background))",
        },
        destructive: {
          DEFAULT: "hsl(var(--color-danger))",
          foreground: "hsl(var(--color-text-primary))",
        },
        popover: {
          DEFAULT: "hsl(var(--color-surface))",
          foreground: "hsl(var(--color-text-primary))",
        },
        card: {
          DEFAULT: "hsl(var(--color-surface))",
          foreground: "hsl(var(--color-text-primary))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ['Nunito', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Monaco', 'monospace'],
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
