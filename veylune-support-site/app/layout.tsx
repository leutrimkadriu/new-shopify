import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://veylune-theme-support.leutrimkadriu.chatgpt.site'),
  title: {
    default: 'Veylune Theme Documentation',
    template: '%s · Veylune',
  },
  description: 'Merchant documentation and support for the Veylune Shopify theme.',
  openGraph: {
    title: 'Veylune Theme Documentation & Support',
    description: 'Merchant documentation and support for the Veylune Shopify theme.',
    type: 'website',
    images: [{ url: '/og.png', width: 1536, height: 1024, alt: 'Veylune theme documentation and support' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Veylune Theme Documentation & Support',
    description: 'Merchant documentation and support for the Veylune Shopify theme.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
