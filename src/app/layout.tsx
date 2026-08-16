import type { Metadata, Viewport } from 'next';
import { Inter, Lexend } from 'next/font/google';
import Script from 'next/script';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const lexend = Lexend({
  subsets: ['latin'],
  variable: '--font-lexend',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Kedai Nyamleng Malang - Menu Digital & Pemesanan Instan',
  description: 'Aplikasi Menu Digital Resmi Kedai Nyamleng Malang. Pesan kuliner khas lezat, nikmati voucher diskon promo, dan lacak status pesanan dapur secara realtime.',
  keywords: ['Kedai Nyamleng', 'Kuliner Malang', 'Menu Digital', 'Pesan Makan Online Malang', 'QRIS Statis'],
  authors: [{ name: 'Kedai Nyamleng Team' }],
  verification: {
    google: ['nqoF14-CdsVQa3MiJQ24c8PtYtVi4Jl4883cUcZvfsM', 'google6536e6ac080b8d5a'],
  },
  openGraph: {
    title: 'Kedai Nyamleng Malang - Menu Digital & Pemesanan Instan',
    description: 'Pesan makanan & minuman khas Kedai Nyamleng Malang dengan mudah untuk Takeaway & Delivery.',
    type: 'website',
    locale: 'id_ID',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={cn(inter.variable, lexend.variable)}>
      <body 
        suppressHydrationWarning 
        className={`${inter.className} antialiased selection:bg-nyamleng-500 selection:text-white bg-parchment text-charcoal min-h-screen flex flex-col`}
      >
        {children}
        <SpeedInsights />
        <Script 
          src="https://accounts.google.com/gsi/client" 
          strategy="afterInteractive" 
        />
      </body>
    </html>
  );
}
