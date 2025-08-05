/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui'],
        'serif': ['Merriweather', 'ui-serif', 'Georgia'],
        'mono': ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular'],
      },
      colors: {
        'editor': {
          'bg': '#fefefe',
          'text': '#1a1a1a',
          'border': '#e5e7eb',
          'selection': '#b3d4fc',
        },
        'sidebar': {
          'bg': '#f8fafc',
          'border': '#e2e8f0',
        },
        'accent': {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        }
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            maxWidth: '800px',
            color: theme('colors.gray.900'),
            lineHeight: '1.7',
            fontSize: '16px',
            fontFamily: theme('fontFamily.serif').join(', '),
            h1: {
              fontSize: '2.25rem',
              fontWeight: '700',
              lineHeight: '1.2',
              marginTop: '2rem',
              marginBottom: '1rem',
            },
            h2: {
              fontSize: '1.875rem',
              fontWeight: '600',
              lineHeight: '1.3',
              marginTop: '1.75rem',
              marginBottom: '0.875rem',
            },
            h3: {
              fontSize: '1.5rem',
              fontWeight: '600',
              lineHeight: '1.4',
              marginTop: '1.5rem',
              marginBottom: '0.75rem',
            },
            'h4, h5, h6': {
              fontWeight: '600',
              lineHeight: '1.4',
            },
            p: {
              marginBottom: '1rem',
            },
            'ul, ol': {
              paddingLeft: '1.5rem',
              marginTop: '1rem',
              marginBottom: '1rem',
            },
            li: {
              marginBottom: '0.5rem',
            },
            blockquote: {
              borderLeftWidth: '4px',
              borderLeftColor: theme('colors.blue.500'),
              paddingLeft: '1rem',
              fontStyle: 'italic',
              color: theme('colors.gray.600'),
              margin: '1.5rem 0',
            },
            code: {
              backgroundColor: theme('colors.gray.100'),
              padding: '0.25rem 0.375rem',
              borderRadius: '0.25rem',
              fontSize: '0.875em',
              color: theme('colors.red.600'),
              fontFamily: theme('fontFamily.mono').join(', '),
            },
            pre: {
              backgroundColor: theme('colors.gray.100'),
              padding: '1rem',
              borderRadius: '0.5rem',
              overflow: 'auto',
              margin: '1rem 0',
              code: {
                backgroundColor: 'transparent',
                padding: '0',
                color: theme('colors.gray.700'),
              },
            },
            table: {
              borderCollapse: 'collapse',
              width: '100%',
              margin: '1rem 0',
            },
            'th, td': {
              border: `1px solid ${theme('colors.gray.300')}`,
              padding: '0.5rem 0.75rem',
              textAlign: 'left',
            },
            th: {
              backgroundColor: theme('colors.gray.50'),
              fontWeight: '600',
            },
            img: {
              borderRadius: '0.5rem',
              margin: '1rem 0',
            },
            a: {
              color: theme('colors.blue.600'),
              textDecoration: 'underline',
              '&:hover': {
                color: theme('colors.blue.800'),
              },
            },
          },
        },
        dark: {
          css: {
            color: theme('colors.gray.100'),
            h1: {
              color: theme('colors.gray.50'),
            },
            'h2, h3, h4, h5, h6': {
              color: theme('colors.gray.50'),
            },
            blockquote: {
              color: theme('colors.gray.400'),
              borderLeftColor: theme('colors.blue.400'),
            },
            code: {
              backgroundColor: theme('colors.gray.800'),
              color: theme('colors.yellow.400'),
            },
            pre: {
              backgroundColor: theme('colors.gray.800'),
              code: {
                color: theme('colors.gray.100'),
              },
            },
            'th, td': {
              borderColor: theme('colors.gray.600'),
            },
            th: {
              backgroundColor: theme('colors.gray.800'),
            },
            a: {
              color: theme('colors.blue.400'),
              '&:hover': {
                color: theme('colors.blue.300'),
              },
            },
          },
        },
      }),
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      boxShadow: {
        'editor': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'toolbar': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}