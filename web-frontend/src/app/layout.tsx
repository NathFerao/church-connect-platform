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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('cc-theme');
                  if (stored) {
                    var parsed = JSON.parse(stored);
                    if (parsed.state && parsed.state.isDark === true) {
                      document.documentElement.classList.add('dark');
                    }
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-background min-h-screen`}>
        <Toaster position="top-right" />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}