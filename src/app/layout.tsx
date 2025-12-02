import type { Metadata } from 'next'
import { Providers } from '@/components/Providers'
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"
import { Chatbox } from '@/components/Chatbox'
import { ActivityTrackerProvider } from '@/components/ActivityTrackerProvider'
import { GlobalSearch } from '@/components/GlobalSearch'
import './globals.css'

export const metadata: Metadata = {
  title: 'OneLP - Limited Partner Portal',
  description: 'Secure investment portal for limited partners',
  icons: {
    icon: '/onelp-logo.png',
    apple: '/onelp-logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Apply theme immediately to prevent flash
                  const theme = localStorage.getItem('theme');
                  const colorTheme = localStorage.getItem('colorTheme') || 'theme-blue';
                  
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                  
                  // Apply color theme
                  document.documentElement.classList.add(colorTheme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans">
        <Providers>
          <ActivityTrackerProvider>
            {children}
            <Chatbox />
            <GlobalSearch />
          </ActivityTrackerProvider>
        </Providers>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
