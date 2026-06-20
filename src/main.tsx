import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const setIcon = ({
  rel,
  sizes,
  type,
  href
}: {
  rel: string
  sizes?: string
  type?: string
  href: string
}) => {
  const selector = sizes ? `link[rel="${rel}"][sizes="${sizes}"]` : `link[rel="${rel}"]`
  let link = document.querySelector(selector) as HTMLLinkElement | null
  if (!link) {
    link = document.createElement('link')
    link.rel = rel
    if (sizes) link.sizes = sizes
    document.head.appendChild(link)
  }
  if (type) link.type = type
  link.href = href
}

setIcon({ rel: 'icon', type: 'image/png', sizes: '32x32', href: 'https://favicons.vegvisr.org/favicons/1781969399962-1-1781973180769-32x32.png' })
setIcon({ rel: 'apple-touch-icon', sizes: '180x180', href: 'https://favicons.vegvisr.org/favicons/1781969399962-1-1781973180769-180x180.png' })
setIcon({ rel: 'icon', type: 'image/png', sizes: '512x512', href: 'https://favicons.vegvisr.org/favicons/1781969399962-1-1781973180769-512x512.png' })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
