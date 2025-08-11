import React, { Suspense, useEffect, useMemo, useState } from 'react'

type UIVariant = 'classic' | 'new'

function getStoredVariant(): UIVariant {
  try {
    const stored = localStorage.getItem('uiVariant')
    return stored === 'new' ? 'new' : 'classic'
  } catch {
    return 'classic'
  }
}

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
  </div>
)

const AppRouter: React.FC = () => {
  const variant: UIVariant = useMemo(() => getStoredVariant(), [])

  const [cssReady, setCssReady] = useState(false)

  useEffect(() => {
    let isMounted = true
    const loadCss = async () => {
      if (variant === 'new') {
        await import('../new-ui/index.css')
      } else {
        await import('./index.css')
      }
      if (isMounted) setCssReady(true)
    }
    loadCss()
    return () => {
      isMounted = false
    }
  }, [variant])

  // Ensure variant-specific fonts are loaded and applied
  useEffect(() => {
    const head = document.head

    const removeIfExists = (id: string) => {
      const el = document.getElementById(id)
      if (el) el.remove()
    }

    removeIfExists('app-font')
    removeIfExists('app-font-preconnect-1')
    removeIfExists('app-font-preconnect-2')

    const pre1 = document.createElement('link')
    pre1.id = 'app-font-preconnect-1'
    pre1.rel = 'preconnect'
    pre1.href = 'https://fonts.googleapis.com'
    head.appendChild(pre1)

    const pre2 = document.createElement('link')
    pre2.id = 'app-font-preconnect-2'
    pre2.rel = 'preconnect'
    pre2.href = 'https://fonts.gstatic.com'
    pre2.crossOrigin = 'anonymous'
    head.appendChild(pre2)

    const link = document.createElement('link')
    link.id = 'app-font'
    link.rel = 'stylesheet'
    link.href = variant === 'new'
      ? 'https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&display=swap'
      : 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
    head.appendChild(link)

    const root = document.documentElement
    if (variant === 'new') {
      root.classList.add('font-lora')
      root.classList.remove('font-sans')
    } else {
      root.classList.add('font-sans')
      root.classList.remove('font-lora')
    }
  }, [variant])

  const AppComponent = useMemo(() => {
    return React.lazy(() => (variant === 'new' ? import('../new-ui/App') : import('./App')))
  }, [variant])

  return cssReady ? (
    <Suspense fallback={<LoadingScreen />}>
      <AppComponent />
    </Suspense>
  ) : (
    <LoadingScreen />
  )
}

export default AppRouter


