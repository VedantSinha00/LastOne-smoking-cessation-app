/**
 * parse-product-url — Supabase Edge Function (Architecture Guide Step 17).
 *
 * POST { url } → { status: 'full' | 'partial' | 'failed', name, image_url,
 * price, platform }. Extracts OG/meta tags from a product page at goal-setup
 * time only (no live price tracking — Personal Goals Spec §3).
 *
 * Platform allowlist (Spec §3): Amazon, Flipkart, Myntra, Blinkit, Nykaa,
 * Swiggy Instamart. Anything else → 'failed' and the app falls back to manual
 * entry. Partial parse (name/image but no price) is a SUCCESS state — GOAL-04
 * opens with the price field blank for manual completion.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Platform = 'amazon' | 'flipkart' | 'myntra' | 'blinkit' | 'nykaa' | 'swiggy_instamart'

const PLATFORM_HOSTS: [RegExp, Platform][] = [
  [/(^|\.)amazon\.(in|com)$/, 'amazon'],
  [/(^|\.)amzn\.(in|to|eu)$/, 'amazon'],
  [/(^|\.)flipkart\.com$/, 'flipkart'],
  [/(^|\.)myntra\.com$/, 'myntra'],
  [/(^|\.)blinkit\.com$/, 'blinkit'],
  [/(^|\.)nykaa\.com$/, 'nykaa'],
  [/(^|\.)swiggy\.com$/, 'swiggy_instamart'],
]

function detectPlatform(rawUrl: string): Platform | null {
  try {
    const host = new URL(rawUrl).hostname.toLowerCase()
    for (const [pattern, platform] of PLATFORM_HOSTS) {
      if (pattern.test(host)) return platform
    }
  } catch {
    // malformed URL
  }
  return null
}

function metaContent(html: string, attr: 'property' | 'name' | 'itemprop', key: string): string | null {
  // <meta property="og:title" content="..."> — attribute order varies, so try both.
  const patterns = [
    new RegExp(`<meta[^>]+${attr}=["']${key}["'][^>]+content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+${attr}=["']${key}["']`, 'i'),
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m?.[1]) return m[1].trim()
  }
  return null
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

function extractName(html: string): string | null {
  const name =
    metaContent(html, 'property', 'og:title') ??
    metaContent(html, 'name', 'twitter:title') ??
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ??
    null
  return name ? decodeEntities(name).slice(0, 200) : null
}

function extractImage(html: string): string | null {
  const img =
    metaContent(html, 'property', 'og:image') ?? metaContent(html, 'name', 'twitter:image')
  return img && /^https?:\/\//.test(img) ? img : null
}

function sanitizePrice(raw: string | null | undefined): number | null {
  if (!raw) return null
  const n = parseFloat(raw.replace(/[₹,\s]|Rs\.?/gi, ''))
  return Number.isFinite(n) && n > 0 && n < 10_000_000 ? Math.round(n * 100) / 100 : null
}

function extractPrice(html: string): number | null {
  const direct =
    metaContent(html, 'property', 'og:price:amount') ??
    metaContent(html, 'property', 'product:price:amount') ??
    metaContent(html, 'itemprop', 'price') ??
    metaContent(html, 'name', 'twitter:data1')
  const fromMeta = sanitizePrice(direct)
  if (fromMeta) return fromMeta

  // JSON-LD offers: "price": "1899" / "lowPrice": 1899
  const ld = html.match(/"(?:price|lowPrice)"\s*:\s*"?([\d,]+(?:\.\d+)?)"?/)
  return sanitizePrice(ld?.[1])
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  const json = (body: unknown) =>
    new Response(JSON.stringify(body), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })

  let url: string
  try {
    const body = await req.json()
    url = String(body.url ?? '')
  } catch {
    return json({ status: 'failed', reason: 'bad_request' })
  }

  const platform = detectPlatform(url)
  if (!platform) {
    return json({ status: 'failed', reason: 'unsupported_platform' })
  }

  let html: string
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        // Product pages bot-block plain fetches; present as a desktop browser.
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-IN,en;q=0.9',
      },
    })
    clearTimeout(timeout)
    if (!res.ok) return json({ status: 'failed', reason: `http_${res.status}`, platform })
    html = await res.text()
  } catch {
    return json({ status: 'failed', reason: 'fetch_error', platform })
  }

  const name = extractName(html)
  if (!name) return json({ status: 'failed', reason: 'no_metadata', platform })

  const price = extractPrice(html)
  return json({
    status: price ? 'full' : 'partial', // partial = name/image pulled, price missing (§3)
    name,
    image_url: extractImage(html),
    price,
    platform,
  })
})
