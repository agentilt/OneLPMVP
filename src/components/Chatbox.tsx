'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'

/**
 * Chatbox component that supports multiple chat providers
 * Currently configured for Crisp, but can be easily switched to other providers
 * 
 * To use Crisp:
 * 1. Sign up at https://crisp.chat
 * 2. Get your website ID from your Crisp dashboard
 * 3. Add NEXT_PUBLIC_CRISP_WEBSITE_ID to your .env.local file
 * 
 * To use Tawk.to:
 * 1. Sign up at https://www.tawk.to
 * 2. Get your Property ID and Widget ID from your Tawk.to dashboard
 * 3. Add NEXT_PUBLIC_TAWK_PROPERTY_ID and NEXT_PUBLIC_TAWK_WIDGET_ID to your .env.local
 * 4. Change CHAT_PROVIDER env var to 'tawk'
 */
export function Chatbox() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const chatProvider = process.env.NEXT_PUBLIC_CHAT_PROVIDER || 'crisp'

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (chatProvider === 'crisp') {
      const crispWebsiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID
      
      if (!crispWebsiteId) {
        console.warn('Crisp chatbox: NEXT_PUBLIC_CRISP_WEBSITE_ID not configured')
        return
      }

      // Check if Crisp script is already in the DOM
      const isScriptLoaded = document.querySelector('script[src="https://client.crisp.chat/l.js"]')
      
      if (!isScriptLoaded) {
        // Initialize Crisp array and website ID before loading script
        window.$crisp = window.$crisp || []
        window.CRISP_WEBSITE_ID = crispWebsiteId

        // Load Crisp script (exact pattern from Crisp documentation)
        const script = document.createElement('script')
        script.type = 'text/javascript'
        script.innerHTML = `window.$crisp=[];window.CRISP_WEBSITE_ID="${crispWebsiteId}";(function(){d=document;s=d.createElement("script");s.src="https://client.crisp.chat/l.js";s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();`
        document.head.appendChild(script)
      } else {
        // Script already loaded, just ensure variables are set
        if (!window.$crisp) {
          window.$crisp = []
        }
        if (!window.CRISP_WEBSITE_ID) {
          window.CRISP_WEBSITE_ID = crispWebsiteId
        }
      }

      // Set user information if logged in (retry until Crisp is ready)
      if (session?.user) {
        const setUserInfo = () => {
          if (window.$crisp && Array.isArray(window.$crisp)) {
            if (session.user?.email) {
              window.$crisp.push(['set', 'user:email', session.user.email])
            }
            if (session.user?.name) {
              window.$crisp.push(['set', 'user:nickname', session.user.name])
            }
          }
        }

        // Try immediately
        setUserInfo()
        
        // Retry after delays to ensure script is loaded
        const timeout1 = setTimeout(setUserInfo, 500)
        const timeout2 = setTimeout(setUserInfo, 1500)
        const timeout3 = setTimeout(setUserInfo, 3000)

        return () => {
          clearTimeout(timeout1)
          clearTimeout(timeout2)
          clearTimeout(timeout3)
        }
      }
    } else if (chatProvider === 'tawk') {
      const propertyId = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID
      const widgetId = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID

      if (!propertyId || !widgetId) {
        console.warn('Tawk.to chatbox: NEXT_PUBLIC_TAWK_PROPERTY_ID and NEXT_PUBLIC_TAWK_WIDGET_ID not configured')
        return
      }

      // Load Tawk.to script
      const script = document.createElement('script')
      script.type = 'text/javascript'
      script.async = true
      script.src = `https://embed.tawk.to/${propertyId}/${widgetId}`
      script.charset = 'UTF-8'
      script.setAttribute('crossorigin', '*')
      document.head.appendChild(script)

      // Set user information if logged in
      if (session?.user && window.Tawk_API) {
        window.Tawk_API.onLoad = function() {
          window.Tawk_API.setAttributes({
            email: session.user.email || '',
            name: session.user.name || '',
          }, (error: any) => {
            if (error) console.error('Tawk.to: Error setting user attributes', error)
          })
        }
      }

      return () => {
        // Tawk.to cleanup
        if (window.Tawk_API) {
          window.Tawk_API.maximize()
          window.Tawk_API.hideWidget()
        }
      }
    }
  }, [chatProvider, session, pathname])

  // This component doesn't render anything visible
  // The chat widget is injected by the third-party scripts
  return null
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    $crisp?: any[]
    CRISP_WEBSITE_ID?: string
    Tawk_API?: any
  }
}


