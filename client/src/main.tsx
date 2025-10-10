import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'react-hot-toast'
import App from './App.tsx'
import './index.css'
import { APP_VERSION, BUILD_DATE } from './version'

// Log build version for debugging
console.log(`🚀 Super Schema v${APP_VERSION} - Built: ${BUILD_DATE}`)

// Update build timestamp in HTML
const timestampMeta = document.getElementById('build-timestamp')
if (timestampMeta) {
  timestampMeta.setAttribute('content', BUILD_DATE)
}

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!clerkPubKey) {
  throw new Error('Missing Clerk Publishable Key')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <ClerkProvider publishableKey={clerkPubKey}>
        <BrowserRouter>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'hsl(var(--card))',
                color: 'hsl(var(--card-foreground))',
                border: '1px solid hsl(var(--border))',
              },
            }}
          />
        </BrowserRouter>
      </ClerkProvider>
    </HelmetProvider>
  </React.StrictMode>,
)