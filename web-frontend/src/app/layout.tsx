import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import ThemeProvider from '@/providers/ThemeProvider';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Church Connect',
  description: 'Stay connected with your church community',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              --cc-primary: #4F46E5;
              --cc-secondary: #10B981;
            }
          `
        }} />
      </head>
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <Toaster position="top-right" />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}