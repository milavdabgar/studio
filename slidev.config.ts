export default {
  // Presentation metadata
  title: 'Slidev Complete Feature Showcase',
  author: 'Demo Author',
  
  // Appearance & Theming
  theme: 'seriph',
  highlighter: 'shiki',
  lineNumbers: true,
  colorSchema: 'auto',
  
  // Features
  monaco: 'dev', // Enable Monaco editor in development
  download: true, // Allow PDF download
  drawings: {
    enabled: true,
    persist: true,
    presenterOnly: false
  },
  
  // Export settings
  export: {
    format: 'pdf',
    timeout: 30000,
    dark: false,
    withClicks: true,
    withToc: true
  },
  
  // Remote access & assets
  remote: true,
  remoteAssets: true,
  
  // Build optimization
  routerMode: 'hash',
  contextMenu: true,
  
  // CSS framework
  css: 'unocss',
  
  // Fonts configuration
  fonts: {
    sans: 'Roboto',
    serif: 'Roboto Slab', 
    mono: 'Fira Code'
  },
  
  // Vite configuration
  vite: {
    server: {
      port: 3030,
      host: '0.0.0.0'
    },
    define: {
      __DEV__: true
    }
  },
  
  // Additional plugins
  plugins: [
    // Add any custom plugins here
  ]
}