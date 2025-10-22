import type { Metadata } from 'next'
import { Providers } from '@/components/Providers'
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"
import './globals.css'

export const metadata: Metadata = {
  title: 'OneLP - Limited Partner Portal',
  description: 'Secure investment portal for limited partners',
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
      <body>
        <Providers>{children}</Providers>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}

