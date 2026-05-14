import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import UsernameSetupWrapper from '@/components/UsernameSetupWrapper';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'DartSwap - Buy. Sell. Repeat.',
  description: "Buy. Sell. Repeat. - Dartmouth's Clothing Marketplace",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
  openGraph: {
    title: 'DartSwap',
    description: "Buy. Sell. Repeat. - Dartmouth's Clothing Marketplace",
    url: 'https://dartmouthswap.com',
    siteName: 'DartSwap',
    images: [
      {
        url: 'https://dartmouthswap.com/api/og',
        width: 1200,
        height: 630,
        alt: 'DartSwap - Buy. Sell. Repeat.',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DartSwap',
    description: "Buy. Sell. Repeat. - Dartmouth's Clothing Marketplace",
    images: ['https://dartmouthswap.com/api/og'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <UsernameSetupWrapper />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
