/**
 * Server-side Render Function for All Shop Orders
 *
 * This is a Netlify Background Function that runs when a Shopify order is created.
 * It uses Browserless.io to render high-res images from design configs.
 *
 * Supports:
 * - Momentos: Photo collage posters
 * - BirthPoster: Baby birth announcement posters
 * - Personaliza: Custom image posters with text
 *
 * Flow:
 * 1. Shopify sends order webhook
 * 2. For each line item with _config attribute
 * 3. Detect shop type from _shop property
 * 4. Call Browserless to screenshot the appropriate /render/{shop} page
 * 5. Upload the screenshot to S3
 * 6. Update order notes with final image URLs (visible in Shopify admin "Notas")
 *
 * Environment Variables Required:
 * - BROWSERLESS_API_KEY: Your Browserless.io API key
 * - SITE_URL: Your site URL (e.g., https://hub.studiomalek.com)
 * - SHOPIFY_ADMIN_API_TOKEN: Shopify Admin API access token (for updating order metafields)
 * - SHOPIFY_STORE_DOMAIN: Your Shopify store domain (e.g., studiomalek.myshopify.com)
 *
 * The presigned URL endpoint is used for S3 uploads (no AWS credentials needed).
 */

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'

// Types
type ShopType = 'Momentos' | 'BirthPoster' | 'Personaliza'

interface ShopifyLineItem {
  id: number
  title: string
  quantity: number
  properties: Array<{ name: string; value: string }>
}

interface ShopifyOrder {
  id: number
  order_number: number
  line_items: ShopifyLineItem[]
}

interface RenderResult {
  lineItemId: number
  shopType: ShopType
  configUrl: string
  imageUrl: string | null
  error: string | null
}

// Config
const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY || ''
const SITE_URL = process.env.SITE_URL || process.env.URL || 'https://hub.studiomalek.com'
const PRESIGNED_URL_ENDPOINT = 'https://bs64vihq06.execute-api.us-west-1.amazonaws.com/v1/getPresignedPostData'
const S3_BUCKET = 'momentos-malek'
const S3_BASE_URL = `https://${S3_BUCKET}.s3.us-west-1.amazonaws.com`

// Shopify Admin API for updating order metafields
const SHOPIFY_ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN || ''
const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || 'studiomalek.myshopify.com'

// Viewport sizes for different formats (150 DPI for 70x100cm)
// Used by Momentos and Personaliza
const VIEWPORT_SIZES = {
  square: { width: 2953, height: 2953 }, // 50x50cm at 150 DPI
  horizontal: { width: 5906, height: 4134 }, // 100x70cm at 150 DPI
  vertical: { width: 4134, height: 5906 }, // 70x100cm at 150 DPI
}

// Birth Poster viewport sizes (aspect ratio 5:7 for 1-2 babies, 7:5 for 3-4)
const BIRTH_POSTER_VIEWPORT_SIZES = {
  vertical: { width: 4134, height: 5906 }, // 70x100cm at 150 DPI (1-2 babies)
  horizontal: { width: 5906, height: 4134 }, // 100x70cm at 150 DPI (3-4 babies)
}

// Map shop type to render page path
const SHOP_RENDER_PATHS: Record<ShopType, string> = {
  Momentos: '/render/momentos',
  BirthPoster: '/render/birth-poster',
  Personaliza: '/render/personaliza',
}

// Map shop type to S3 bucket
const SHOP_S3_BUCKETS: Record<ShopType, string> = {
  Momentos: 'momentos-malek',
  BirthPoster: 'momentos-malek',
  Personaliza: 'custom-prints',
}

/**
 * Get presigned URL from Lambda for S3 upload
 */
async function getPresignedUrl(filename: string, contentType: string, bucket: string = S3_BUCKET): Promise<string> {
  const response = await fetch(PRESIGNED_URL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: filename,
      contentType: contentType,
      bucket: bucket,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to get presigned URL')
  }

  const result = await response.json()
  return result.presignedUrl
}

/**
 * Upload buffer to S3 using presigned URL
 */
async function uploadToS3(buffer: ArrayBuffer, filename: string, bucket: string = S3_BUCKET): Promise<string> {
  const presignedUrl = await getPresignedUrl(filename, 'image/png', bucket)

  const response = await fetch(presignedUrl, {
    method: 'PUT',
    body: buffer,
    headers: { 'Content-Type': 'image/png' },
  })

  if (!response.ok) {
    throw new Error('Failed to upload to S3')
  }

  const baseUrl = `https://${bucket}.s3.us-west-1.amazonaws.com`
  return `${baseUrl}/${filename}`
}

/**
 * Update order with rendered image URLs using Shopify Admin API
 * Appends to existing notes (preserves customer notes)
 */
async function updateOrderWithImages(orderId: number, results: RenderResult[]): Promise<void> {
  if (!SHOPIFY_ADMIN_API_TOKEN) {
    console.warn('[RenderOrder] SHOPIFY_ADMIN_API_TOKEN not configured, skipping order update')
    return
  }

  const successfulResults = results.filter(r => r.imageUrl)
  if (successfulResults.length === 0) {
    console.log('[RenderOrder] No successful renders, skipping order update')
    return
  }

  const apiUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/orders/${orderId}.json`

  // First, get current order to preserve existing notes
  console.log(`[RenderOrder] Fetching order ${orderId} to get existing notes...`)
  const getResponse = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_TOKEN,
    },
  })

  if (!getResponse.ok) {
    const errorText = await getResponse.text()
    console.error(`[RenderOrder] Failed to fetch order: ${getResponse.status} - ${errorText}`)
    throw new Error(`Failed to fetch order: ${getResponse.status}`)
  }

  const orderData = await getResponse.json()
  const existingNote = orderData.order?.note || ''

  // Build note with image URLs (extra spacing between items)
  // Group by shop type for clearer organization
  const shopGroups = successfulResults.reduce((acc, r) => {
    if (!acc[r.shopType]) acc[r.shopType] = []
    acc[r.shopType].push(r.imageUrl!)
    return acc
  }, {} as Record<ShopType, string[]>)

  const shopLines = Object.entries(shopGroups).map(([shop, urls]) => {
    const urlList = urls.map((url, i) => `${i + 1}. ${url}`).join('\n\n')
    return `${shop}:\n${urlList}`
  }).join('\n\n---\n\n')

  const newNote = `Imágenes renderizadas:\n\n${shopLines}`

  // Append to existing notes (preserve customer notes)
  const finalNote = existingNote ? `${existingNote}\n\n---\n${newNote}` : newNote

  console.log(`[RenderOrder] Updating order ${orderId} notes...`)

  const response = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_TOKEN,
    },
    body: JSON.stringify({
      order: {
        id: orderId,
        note: finalNote,
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`[RenderOrder] Failed to update order: ${response.status} - ${errorText}`)
    throw new Error(`Failed to update order: ${response.status}`)
  }

  console.log(`[RenderOrder] ✓ Order notes updated with ${successfulResults.length} rendered images`)
}

/**
 * Get viewport size for a shop type and format
 */
function getViewportSize(shopType: ShopType, format: string, babyCount?: number): { width: number; height: number } {
  if (shopType === 'BirthPoster') {
    // Birth poster: vertical for 1-2 babies, horizontal for 3-4
    const orientation = (babyCount && babyCount > 2) ? 'horizontal' : 'vertical'
    return BIRTH_POSTER_VIEWPORT_SIZES[orientation]
  }

  // Momentos and Personaliza use the same viewport sizes based on format
  return VIEWPORT_SIZES[format as keyof typeof VIEWPORT_SIZES] || VIEWPORT_SIZES.vertical
}

/**
 * Render a design using Browserless
 */
async function renderWithBrowserless(
  configUrl: string,
  shopType: ShopType,
  format: string,
  babyCount?: number
): Promise<ArrayBuffer> {
  if (!BROWSERLESS_API_KEY) {
    throw new Error('BROWSERLESS_API_KEY not configured')
  }

  // Get render page path for this shop
  const renderPath = SHOP_RENDER_PATHS[shopType]

  // Determine viewport size based on shop type and format
  const viewport = getViewportSize(shopType, format, babyCount)

  const renderUrl = `${SITE_URL}${renderPath}?configUrl=${encodeURIComponent(configUrl)}`

  console.log(`[RenderOrder] Rendering ${shopType}: ${renderUrl}`)
  console.log(`[RenderOrder] Viewport: ${viewport.width}x${viewport.height}`)

  // Browserless API - token in URL query parameter
  const browserlessUrl = `https://chrome.browserless.io/screenshot?token=${BROWSERLESS_API_KEY}`

  const response = await fetch(browserlessUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: renderUrl,
      options: {
        type: 'png',
        fullPage: false,
      },
      gotoOptions: {
        waitUntil: 'networkidle2',
        timeout: 30000,
      },
      viewport: viewport,
      waitForSelector: {
        selector: '.render-canvas',
        timeout: 10000,
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Browserless error: ${response.status} - ${errorText}`)
  }

  return response.arrayBuffer()
}

/**
 * Detect shop type from line item properties
 */
function detectShopType(item: ShopifyLineItem): ShopType {
  const shopProp = item.properties.find(p => p.name === '_shop')
  if (shopProp) {
    const value = shopProp.value as ShopType
    if (['Momentos', 'BirthPoster', 'Personaliza'].includes(value)) {
      return value
    }
  }
  // Default to Momentos for backwards compatibility
  return 'Momentos'
}

/**
 * Get format from config based on shop type
 */
function getFormatFromConfig(config: Record<string, unknown>, shopType: ShopType): string {
  if (shopType === 'Momentos') {
    return (config.format as string) || 'vertical'
  }
  if (shopType === 'Personaliza') {
    // Personaliza uses imageFormat like '5:7', '7:5', '1:1'
    const imageFormat = config.imageFormat as string
    if (imageFormat === '1:1') return 'square'
    if (imageFormat === '7:5') return 'horizontal'
    return 'vertical'
  }
  // BirthPoster - format is determined by babyCount
  return 'vertical'
}

/**
 * Process a single line item
 */
async function processLineItem(item: ShopifyLineItem, orderNumber: number): Promise<RenderResult> {
  // Find _config property
  const configProp = item.properties.find(p => p.name === '_config')
  if (!configProp) {
    return {
      lineItemId: item.id,
      shopType: 'Momentos',
      configUrl: '',
      imageUrl: null,
      error: 'No _config property found',
    }
  }

  const configUrl = configProp.value
  const shopType = detectShopType(item)

  try {
    // Fetch config to get format and other details
    const configResponse = await fetch(configUrl)
    if (!configResponse.ok) {
      throw new Error(`Failed to fetch config: ${configResponse.status}`)
    }
    const config = await configResponse.json() as Record<string, unknown>
    const format = getFormatFromConfig(config, shopType)
    const babyCount = shopType === 'BirthPoster' ? (config.babyCount as number) : undefined

    console.log(`[RenderOrder] Processing ${shopType} order ${orderNumber}, item ${item.id}, format: ${format}${babyCount ? `, babies: ${babyCount}` : ''}`)

    // Render with Browserless
    const imageBuffer = await renderWithBrowserless(configUrl, shopType, format, babyCount)
    console.log(`[RenderOrder] Rendered image: ${(imageBuffer.byteLength / 1024 / 1024).toFixed(2)}MB`)

    // Upload to S3 (use appropriate bucket for each shop)
    const bucket = SHOP_S3_BUCKETS[shopType]
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const shopPrefix = shopType.toLowerCase().replace('poster', '-poster')
    const filename = `${shopPrefix}-final-${orderNumber}-${item.id}-${timestamp}-${random}.png`

    const imageUrl = await uploadToS3(imageBuffer, filename, bucket)
    console.log(`[RenderOrder] Uploaded to S3: ${imageUrl}`)

    return {
      lineItemId: item.id,
      shopType,
      configUrl,
      imageUrl,
      error: null,
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[RenderOrder] Error processing ${shopType} item ${item.id}:`, errorMessage)
    return {
      lineItemId: item.id,
      shopType,
      configUrl,
      imageUrl: null,
      error: errorMessage,
    }
  }
}

/**
 * Main handler
 */
const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  console.log('[RenderOrder] Function triggered')

  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  // Parse the order from Shopify webhook
  let order: ShopifyOrder
  try {
    order = JSON.parse(event.body || '{}')
  } catch (err) {
    console.error('[RenderOrder] Failed to parse webhook body:', err)
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    }
  }

  console.log(`[RenderOrder] Processing order #${order.order_number} with ${order.line_items?.length || 0} items`)

  // Find line items that need rendering (have _config property)
  const itemsToRender = order.line_items?.filter(item =>
    item.properties?.some(p => p.name === '_config')
  ) || []

  if (itemsToRender.length === 0) {
    console.log('[RenderOrder] No items to render, skipping')
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'No items to render', results: [] }),
    }
  }

  console.log(`[RenderOrder] Found ${itemsToRender.length} items to render`)

  // Process each item
  const results: RenderResult[] = []
  for (const item of itemsToRender) {
    const result = await processLineItem(item, order.order_number)
    results.push(result)
  }

  // Log summary
  const successful = results.filter(r => r.imageUrl).length
  const failed = results.filter(r => r.error).length
  console.log(`[RenderOrder] Completed: ${successful} successful, ${failed} failed`)

  // Update order tags with rendered image URLs (visible in Shopify admin)
  try {
    await updateOrderWithImages(order.id, results)
  } catch (err) {
    console.error('[RenderOrder] Failed to update order:', err)
    // Don't fail the whole request - images are already uploaded to S3
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Render complete',
      orderNumber: order.order_number,
      results,
    }),
  }
}

export { handler }
