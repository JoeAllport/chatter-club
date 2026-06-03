import { useEffect } from 'react'

// TODO: swap SITE_URL for real domain when decided
const SITE_URL   = 'https://chatterclub.app'
const SITE_NAME  = 'Chatter Club'
const DEFAULT_DESC = 'A daily English learning habit. Read real articles, complete a daily challenge, and build your vocabulary — all at your CEFR level. Free to join.'
const DEFAULT_IMG  = `${SITE_URL}/og-image.png`

/**
 * PageMeta — sets document title + meta tags for a page.
 *
 * Usage:
 *   <PageMeta
 *     title="The Future of AI — Chatter Club"
 *     description="Read this advanced English article about artificial intelligence..."
 *     canonical="/articles/the-future-of-ai"
 *     image="https://..." // optional, falls back to default OG image
 *   />
 *
 * Place near the top of each page component.
 */
export default function PageMeta({ title, description, canonical, image }) {
  const fullTitle = title
    ? `${title} — ${SITE_NAME}`
    : `${SITE_NAME} — Learn English Every Day`

  const desc      = description || DEFAULT_DESC
  const canonUrl  = canonical ? `${SITE_URL}${canonical}` : SITE_URL
  const imgUrl    = image || DEFAULT_IMG

  useEffect(() => {
    // Title
    document.title = fullTitle

    // Helper to upsert a <meta> tag
    const setMeta = (selector, attr, value) => {
      let el = document.querySelector(selector)
      if (!el) {
        el = document.createElement('meta')
        const [attrName, attrVal] = selector.match(/\[(.+?)="(.+?)"\]/)?.slice(1) || []
        if (attrName) el.setAttribute(attrName, attrVal)
        document.head.appendChild(el)
      }
      el.setAttribute(attr, value)
    }

    const setLink = (rel, href) => {
      let el = document.querySelector(`link[rel="${rel}"]`)
      if (!el) {
        el = document.createElement('link')
        el.setAttribute('rel', rel)
        document.head.appendChild(el)
      }
      el.setAttribute('href', href)
    }

    // Standard
    setMeta('meta[name="description"]',        'content', desc)

    // Open Graph
    setMeta('meta[property="og:title"]',       'content', fullTitle)
    setMeta('meta[property="og:description"]', 'content', desc)
    setMeta('meta[property="og:url"]',         'content', canonUrl)
    setMeta('meta[property="og:image"]',       'content', imgUrl)

    // Twitter
    setMeta('meta[name="twitter:title"]',       'content', fullTitle)
    setMeta('meta[name="twitter:description"]', 'content', desc)
    setMeta('meta[name="twitter:image"]',       'content', imgUrl)

    // Canonical
    setLink('canonical', canonUrl)
  }, [fullTitle, desc, canonUrl, imgUrl])

  return null
}
