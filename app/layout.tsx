import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AssessmentProvider } from '@/components/providers/AssessmentProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'WiFi Check — Understand Your Wi-Fi Security',
  description:
    'WiFi Check helps you evaluate your Wi-Fi security configuration through a guided manual assessment. Get risk classifications, explanations, and actionable recommendations.',
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground font-sans">
        <AssessmentProvider>{children}</AssessmentProvider>
      </body>
    </html>
  );
}
