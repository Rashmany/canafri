import type { Metadata, Viewport } from 'next';
import { Inter, Outfit, Space_Grotesk, Montserrat } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
});

export const viewport: Viewport = {
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://canafri.com'),
  title: {
    default: 'CanaFri — The Decentralized Workplace & Publishing Economy on Canton Network',
    template: '%s | CanaFri',
  },
  description:
    'CanaFri connects enterprise clients with elite Canton Network & DAML smart contract talent. Featuring non-custodial milestone escrow, CC token settlements, and Read-to-Earn technical publishing.',
  keywords: [
    'Canton Network Freelancers',
    'DAML Smart Contract Developers',
    'Web3 Escrow Marketplace',
    'Read to Earn Publishing',
    'Canton Coin CC',
    'Decentralized Freelance Platform',
    'Multi-party Privacy Blockchain',
  ],
  authors: [{ name: 'CanaFri Foundation', url: 'https://canafri.com' }],
  creator: 'CanaFri',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://canafri.com',
    siteName: 'CanaFri',
    title: 'CanaFri — The Decentralized Workplace on Canton Network',
    description:
      'Hire top DAML & Web3 developers with cryptographic escrow milestones. Monetize technical insights through peer-reviewed Read-to-Earn staking.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CanaFri Canton Marketplace & Publishing Economy',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CanaFri — Canton Network Freelance & Publishing Ecosystem',
    description:
      'Non-custodial milestone escrow, instant CC settlements, and read-to-earn technical publications.',
    creator: '@CanaFriNetwork',
    images: ['/og-image.png'],
  },
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
  alternates: {
    canonical: 'https://canafri.com',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'CanaFri',
    url: 'https://canafri.com',
    logo: 'https://canafri.com/logo.svg',
    sameAs: [
      'https://twitter.com/CanaFriNetwork',
      'https://github.com/canafri',
      'https://discord.gg/canafri',
    ],
    description:
      'Decentralized workplace and publishing economy powered by Canton Network privacy smart contracts and CC tokenized escrow settlements.',
  };

  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} ${spaceGrotesk.variable} ${montserrat.variable} dark scroll-smooth`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-[#09090b] text-[#f4f4f5] antialiased selection:bg-[#320053] selection:text-white">
        {children}
      </body>
    </html>
  );
}
