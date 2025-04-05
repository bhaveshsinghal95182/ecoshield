import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EcoShield - Environmental Impact Analyzer',
  description: 'Analyze and understand the environmental impact of products through AI',
  metadataBase: new URL('https://www.ecoshield.com'), // replace with your actual domain
  openGraph: {
    title: 'EcoShield - Environmental Impact Analyzer',
    description: 'Break down product components and discover sustainable disposal methods using AI.',
    url: 'https://www.ecoshield.com',
    siteName: 'EcoShield',
    images: [
      {
        url: '/ecoshield logo.png', 
        width: 1200,
        height: 630,
        alt: 'EcoShield - Environmental Impact Analyzer',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EcoShield - Environmental Impact Analyzer',
    description: 'EcoShield uses AI to help you break down and dispose of products sustainably.',
    images: ['/ecoshield logo.png'], 
    creator: '@bhavesh95182', 
  },
  themeColor: '#16a34a', 
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Favicons */}
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon_io/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon_io/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon_io/favicon-16x16.png" />
        <link rel="manifest" href="/favicon_io/site.webmanifest" />
        <meta name="theme-color" content="#16a34a" />
        <link rel="canonical" href="https://www.ecoshield.com" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
