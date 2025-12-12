import type { Metadata } from 'next'
import { Providers } from '@/components/Providers'
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"
import { ActivityTrackerProvider } from '@/components/ActivityTrackerProvider'
import { GlobalSearch } from '@/components/GlobalSearch'
import { GlobalAIChatLauncher } from '@/components/GlobalAIChatLauncher'
import { EdgeOverlay } from '@/components/EdgeOverlay'
import { IntroOverlay } from '@/components/IntroOverlay'
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
    <html
      lang="en"
      className="ai-shell"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Apply theme immediately to prevent flash
                  const theme = localStorage.getItem('theme');
                  const colorTheme = localStorage.getItem('colorTheme') || 'theme-blue';

                  // Force light unless explicitly stored as dark
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }

                  // Apply color theme
                  document.documentElement.classList.add(colorTheme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans glass-page">
        <Providers>
          <ActivityTrackerProvider>
            <div className="hidden">
              <IntroOverlay />
            </div>
            <div className="hidden dark:block">
              <EdgeOverlay />
            </div>
            <div className="min-h-screen">{children}</div>
            <GlobalSearch />
            <GlobalAIChatLauncher />
          </ActivityTrackerProvider>
        </Providers>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
