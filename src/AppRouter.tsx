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


