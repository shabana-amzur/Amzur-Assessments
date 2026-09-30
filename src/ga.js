const DEFAULT_GA_ID = 'G-XXXXXXXXXX'

export const GA_MEASUREMENT_ID =
  (typeof window !== 'undefined' && window.GA_MEASUREMENT_ID) ||
  import.meta.env.VITE_GA_MEASUREMENT_ID ||
  DEFAULT_GA_ID

export function initGoogleAnalytics() {
  if (typeof window === 'undefined') return
  if (GA_MEASUREMENT_ID === DEFAULT_GA_ID) return

  window.dataLayer = window.dataLayer || []
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments)
  }

  if (!document.querySelector('script[data-ga-script="true"]')) {
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
    script.setAttribute('data-ga-script', 'true')
    document.head.appendChild(script)
  }

  window.gtag('js', new Date())
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false,
  })
}

export function trackPageView(path = window.location.pathname + window.location.search) {
  if (typeof window === 'undefined') return
  if (GA_MEASUREMENT_ID === DEFAULT_GA_ID || !window.gtag) return

  window.gtag('event', 'page_view', {
    page_path: path,
  })
}

export function pushGtmEvent(eventName, payload = {}) {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({
    event: eventName,
    ...payload,
  })
}
