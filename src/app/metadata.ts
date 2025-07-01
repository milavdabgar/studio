import { Metadata } from 'next';

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  if (process.env.NODE_ENV === 'production') {
    return 'https://gppalanpur.in';
  }
  
  return 'http://localhost:3000';
};

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: 'GPP Studio - Government Polytechnic Palanpur',
    template: '%s | GPP Studio'
  },
  description: 'Government Polytechnic Palanpur - Academic Management System for engineering education',
  manifest: '/manifest.json',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: '#000000',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GPP Studio',
  },
  formatDetection: {
    telephone: false,
  },
  keywords: ['Government Polytechnic', 'Palanpur', 'Engineering Education', 'Technical Education', 'GPP Studio'],
  authors: [{ name: 'Milav Dabgar' }],
  creator: 'Milav Dabgar',
  publisher: 'Government Polytechnic Palanpur',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: getBaseUrl(),
    title: 'GPP Studio - Government Polytechnic Palanpur',
    description: 'Government Polytechnic Palanpur - Academic Management System for engineering education',
    siteName: 'GPP Studio',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Government Polytechnic Palanpur',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GPP Studio - Government Polytechnic Palanpur',
    description: 'Government Polytechnic Palanpur - Academic Management System for engineering education',
    creator: '@milavdabgar',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
      { url: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
      { url: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-icon-180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};
