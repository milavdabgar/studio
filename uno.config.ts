import { defineConfig } from 'unocss'
import { presetAttributify, presetIcons, presetUno } from 'unocss'

export default defineConfig({
  shortcuts: [
    // Custom shortcuts for the demo
    ['btn', 'px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors'],
    ['btn-secondary', 'px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600 transition-colors'],
    ['slide-title', 'text-4xl font-bold mb-8 text-center'],
    ['demo-card', 'bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-all hover:shadow-xl'],
    ['gradient-bg', 'bg-gradient-to-r from-blue-500 to-purple-600'],
    ['text-gradient', 'bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent'],
  ],
  
  theme: {
    colors: {
      primary: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a'
      },
      secondary: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a'
      },
      accent: {
        50: '#fdf4ff',
        100: '#fae8ff',
        200: '#f5d0fe',
        300: '#f0abfc',
        400: '#e879f9',
        500: '#d946ef',
        600: '#c026d3',
        700: '#a21caf',
        800: '#86198f',
        900: '#701a75'
      }
    },
    fontFamily: {
      'mono': ['Fira Code', 'Monaco', 'Consolas', 'monospace'],
      'sans': ['Roboto', 'Inter', 'system-ui', 'sans-serif'],
      'serif': ['Roboto Slab', 'Georgia', 'serif']
    },
    animation: {
      'bounce-slow': 'bounce 2s infinite',
      'pulse-slow': 'pulse 3s infinite',
      'spin-slow': 'spin 3s linear infinite'
    }
  },
  
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      warn: true,
      collections: {
        carbon: () => import('@iconify-json/carbon/icons.json').then(i => i.default),
        mdi: () => import('@iconify-json/mdi/icons.json').then(i => i.default),
        logos: () => import('@iconify-json/logos/icons.json').then(i => i.default)
      }
    })
  ],
  
  rules: [
    // Custom rules for specific demo needs
    ['text-shadow', { 'text-shadow': '2px 2px 4px rgba(0,0,0,0.3)' }],
    ['backdrop-blur-strong', { 'backdrop-filter': 'blur(20px)' }],
    [/^grid-cols-auto-(\d+)$/, ([, d]) => ({ 'grid-template-columns': `repeat(${d}, auto)` })],
  ],
  
  // Safelist important classes that might be used dynamically
  safelist: [
    'text-blue-500',
    'text-green-500', 
    'text-red-500',
    'text-purple-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-red-500',
    'bg-purple-500',
    'hover:scale-105',
    'transition-transform',
    'duration-200'
  ]
})