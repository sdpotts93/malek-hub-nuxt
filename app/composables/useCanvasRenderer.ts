/**
 * Canvas Renderer Composable
 *
 * Uses html-to-image to generate poster images from the canvas preview element.
 * This library handles modern CSS features better than html2canvas.
 */

import { toBlob } from 'html-to-image'

// DPI and print size configuration for large format printing
const PRINT_CONFIG = {
  targetDpi: 150, // 150 DPI for high quality prints (consistent across all tools)
  // Largest poster: 70x100cm - use actual max dimensions
  largestPrintCm: { width: 70, height: 100 },
  cmToInches: 0.393701,
}

interface RenderOptions {
  scale?: number // Scale factor for resolution (default: 2 for retina)
  backgroundColor?: string
  quality?: number // 0-1 for JPEG quality
  // Optional URL resolver to swap display URLs with higher resolution versions
  // Used for final print rendering to use high-res images instead of medium-res preview
  urlResolver?: (displayUrl: string) => string | null
}

interface RenderResult {
  dataUrl: string
  blob: Blob
  width: number
  height: number
}

export function useCanvasRenderer() {
  const isRendering = ref(false)
  const error = ref<string | null>(null)

  /**
   * Convert a blob URL to a data URL
   */
  async function blobUrlToDataUrl(blobUrl: string): Promise<string> {
    const response = await fetch(blobUrl)
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  /**
   * Extract data URL from an already-loaded image element by drawing to canvas
   * This works for same-origin images (including blob URLs) without taint issues
   */
  function imageToDataUrl(img: HTMLImageElement): string | null {
    if (!img.complete || img.naturalWidth === 0) {
      return null
    }
    try {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return null
      ctx.drawImage(img, 0, 0)
      return canvas.toDataURL('image/png')
    } catch (e) {
      console.warn('[CanvasRenderer] Failed to extract image via canvas:', e)
      return null
    }
  }

  /**
   * Load a remote image URL as a data URL using Image + Canvas
   * This handles CORS by using crossorigin attribute
   */
  async function loadImageAsDataUrl(imageUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Failed to get canvas context'))
            return
          }
          ctx.drawImage(img, 0, 0)
          const dataUrl = canvas.toDataURL('image/png')
          resolve(dataUrl)
        } catch (err) {
          reject(err)
        }
      }

      img.onerror = () => {
        reject(new Error('Image failed to load'))
      }

      // Timeout to avoid hanging
      setTimeout(() => reject(new Error('Image load timeout')), 10000)

      img.src = imageUrl
    })
  }

  /**
   * Wait for all images in an element to load
   */
  async function waitForImages(element: HTMLElement): Promise<void> {
    const images = element.querySelectorAll('img')

    // Wait for all images to load
    const imagePromises = Array.from(images).map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve()
      return new Promise<void>((resolve) => {
        img.onload = () => resolve()
        img.onerror = () => resolve() // Don't fail on image error
        // Timeout fallback in case events don't fire
        setTimeout(resolve, 1000)
      })
    })
    await Promise.all(imagePromises)
    // Additional small delay to ensure browser has painted
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  /**
   * Convert an SVG filter element to an inline data URL
   * This makes the filter self-contained and avoids ID conflicts when cloning
   */
  function svgFilterToDataUrl(filterElement: SVGFilterElement): string {
    // Clone the filter and give it a simple ID
    const filterClone = filterElement.cloneNode(true) as SVGFilterElement
    filterClone.setAttribute('id', 'f')

    // Create minimal SVG containing just this filter
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg"><defs>${filterClone.outerHTML}</defs></svg>`

    // Encode for CSS url()
    const encoded = encodeURIComponent(svgContent)
      .replace(/'/g, '%27')
      .replace(/"/g, '%22')

    return `url("data:image/svg+xml,${encoded}#f")`
  }

  /**
   * Clone element and convert blob URLs to data URLs for reliable rendering
   * @param urlResolver - Optional function to resolve display URLs to higher-res versions
   */
  async function prepareElementForRender(
    element: HTMLElement,
    urlResolver?: (displayUrl: string) => string | null
  ): Promise<HTMLElement> {
    // Get computed styles and dimensions from original
    const rect = element.getBoundingClientRect()
    const computedStyle = window.getComputedStyle(element)

    // Clone the element
    const clone = element.cloneNode(true) as HTMLElement

    // Create a wrapper to maintain container query context
    const wrapper = document.createElement('div')
    wrapper.style.position = 'fixed'
    wrapper.style.left = '-9999px'
    wrapper.style.top = '0'
    wrapper.style.width = `${rect.width}px`
    wrapper.style.height = `${rect.height}px`
    wrapper.style.overflow = 'hidden'
    wrapper.style.containerType = 'size' // Enable container queries

    // Apply explicit dimensions to clone to preserve layout
    clone.style.width = `${rect.width}px`
    clone.style.height = `${rect.height}px`
    clone.style.position = 'relative'
    clone.style.left = '0'
    clone.style.top = '0'

    // Copy background color
    clone.style.backgroundColor = computedStyle.backgroundColor

    wrapper.appendChild(clone)
    document.body.appendChild(wrapper)

    // Make elements marked with data-render-transparent have transparent backgrounds
    // This is used for empty cells that should show the canvas background color in exports
    const transparentElements = clone.querySelectorAll('[data-render-transparent]')
    for (const el of Array.from(transparentElements)) {
      const htmlEl = el as HTMLElement
      htmlEl.style.backgroundColor = 'transparent'
    }

    // Convert SVG filter url(#id) references to inline data URL filters
    // This prevents ID conflicts when multiple clones exist in the DOM
    const elementsWithFilters = clone.querySelectorAll('[style*="filter"]')
    for (const el of Array.from(elementsWithFilters)) {
      const htmlEl = el as HTMLElement
      const filterStyle = htmlEl.style.filter

      // Check if filter references a local SVG filter via url(#id)
      const filterMatch = filterStyle.match(/url\(["']?#([^"')]+)["']?\)/)
      if (filterMatch) {
        const filterId = filterMatch[1]

        // Find the filter in the ORIGINAL element (before cloning messed up IDs)
        const originalFilter = element.querySelector(`#${filterId}`) as SVGFilterElement | null
        if (originalFilter && originalFilter.tagName.toLowerCase() === 'filter') {
          // Convert to inline data URL filter
          const dataUrlFilter = svgFilterToDataUrl(originalFilter)
          htmlEl.style.filter = dataUrlFilter
        }
      }
    }

    // Convert all image URLs to data URLs for reliable rendering
    // This handles both blob URLs and S3/remote URLs
    const clonedImages = clone.querySelectorAll('img')
    const originalImages = element.querySelectorAll('img')
    console.log(`[CanvasRenderer] Processing ${clonedImages.length} images in clone`)

    for (let i = 0; i < clonedImages.length; i++) {
      const img = clonedImages[i]
      if (!img) continue // TypeScript guard

      const originalImg = originalImages[i] // Corresponding original image (already loaded)
      let originalSrc = img.src

      // Skip empty or placeholder images
      if (!originalSrc || originalSrc === 'undefined' || originalSrc === 'null') {
        img.removeAttribute('src')
        continue
      }

      // If a URL resolver is provided, try to get a higher-res version
      // This is used for final print rendering to swap medium-res preview URLs with high-res
      if (urlResolver) {
        const resolvedUrl = urlResolver(originalSrc)
        if (resolvedUrl) {
          console.log(`[CanvasRenderer] Resolved to high-res:`, resolvedUrl.substring(0, 60))
          originalSrc = resolvedUrl
        }
      }

      const urlType = originalSrc.startsWith('blob:') ? 'blob' :
        originalSrc.startsWith('data:') ? 'data' :
        originalSrc.startsWith('http') ? 's3/remote' : 'local'
      console.log(`[CanvasRenderer] Processing ${urlType} URL:`, originalSrc.substring(0, 60))

      try {
        let dataUrl: string | null = null

        // Handle blob URLs - convert directly to data URLs
        if (originalSrc.startsWith('blob:')) {
          try {
            dataUrl = await blobUrlToDataUrl(originalSrc)
            console.log('[CanvasRenderer] ✓ Blob URL converted successfully')
          } catch (e) {
            console.warn('[CanvasRenderer] ✗ Blob URL fetch failed, trying canvas extraction...', e)
            // Fallback: Extract from original loaded image via canvas
            if (originalImg) {
              dataUrl = imageToDataUrl(originalImg)
              if (dataUrl) {
                console.log('[CanvasRenderer] ✓ Blob URL extracted via canvas from original')
              }
            }
          }
        }
        // Handle S3/remote URLs - try canvas extraction first (fastest, no network)
        else if (originalSrc.startsWith('https://') || originalSrc.startsWith('http://')) {
          // First, try extracting from already-loaded original image (no network request!)
          if (originalImg && originalImg.complete && originalImg.naturalWidth > 0) {
            dataUrl = imageToDataUrl(originalImg)
            if (dataUrl) {
              console.log('[CanvasRenderer] ✓ S3 image extracted via canvas (no network)')
            }
          }

          // Fallback: try CORS fetch if canvas extraction failed
          if (!dataUrl) {
            try {
              dataUrl = await loadImageAsDataUrl(originalSrc)
              console.log('[CanvasRenderer] ✓ S3 URL converted via CORS fetch')
            } catch (err) {
              console.warn('[CanvasRenderer] ✗ S3 CORS failed, trying direct fetch...', err)
              // Last resort: Try fetching directly as blob
              try {
                const response = await fetch(originalSrc, { mode: 'cors', credentials: 'omit' })
                if (response.ok) {
                  const blob = await response.blob()
                  dataUrl = await blobUrlToDataUrl(URL.createObjectURL(blob))
                  console.log('[CanvasRenderer] ✓ S3 URL converted via direct fetch')
                }
              } catch (fetchErr) {
                console.warn('[CanvasRenderer] ✗ S3 direct fetch also failed:', fetchErr)
              }
            }
          }
        }

        // If we got a data URL, use it
        if (dataUrl) {
          img.src = dataUrl
          // Remove crossorigin for data URLs (not needed and can cause issues)
          img.removeAttribute('crossorigin')
          // Wait for the data URL image to be ready
          await new Promise<void>((resolve) => {
            if (img.complete && img.naturalWidth > 0) {
              resolve()
            } else {
              img.onload = () => resolve()
              img.onerror = () => resolve()
              setTimeout(resolve, 500)
            }
          })
        } else if (originalSrc.startsWith('blob:')) {
          // Blob URL conversion failed and canvas extraction failed
          // Try one more time with the original image if available
          if (originalImg && originalImg.complete && originalImg.naturalWidth > 0) {
            console.log('[CanvasRenderer] Trying final canvas extraction from original...')
            dataUrl = imageToDataUrl(originalImg)
            if (dataUrl) {
              img.src = dataUrl
              img.removeAttribute('crossorigin')
              console.log('[CanvasRenderer] ✓ Final canvas extraction succeeded')
            } else {
              console.warn('[CanvasRenderer] ✗ All blob URL conversion methods failed - removing image')
              // Remove the image from DOM to prevent html-to-image from failing
              img.remove()
            }
          } else {
            console.warn('[CanvasRenderer] ✗ Original image not loaded - removing image')
            // Remove the image from DOM to prevent html-to-image from failing
            img.remove()
          }
        } else if (!originalSrc.startsWith('http')) {
          // Local path or already a data URL - keep as is
        } else {
          // Remote URL - all methods failed (canvas, CORS, fetch)
          console.warn('[CanvasRenderer] ✗ All conversion methods failed - removing image:', originalSrc.substring(0, 50))
          img.remove()
        }
      } catch (err) {
        // Error processing image - keep original src and let html-to-image try
        console.warn('[CanvasRenderer] Error processing image, keeping original src:', err)
      }
    }

    // Store wrapper reference on clone for cleanup
    (clone as any).__wrapper = wrapper

    return clone
  }

  /**
   * Render an element to an image using html-to-image
   */
  async function renderElement(
    element: HTMLElement,
    options: RenderOptions = {}
  ): Promise<RenderResult> {
    const { scale = 2, backgroundColor = '#ffffff', urlResolver } = options

    isRendering.value = true
    error.value = null

    let clone: HTMLElement | null = null

    try {
      // Wait for images to load in original element
      await waitForImages(element)

      // Get actual dimensions from original element
      const rect = element.getBoundingClientRect()
      const width = Math.round(rect.width)
      const height = Math.round(rect.height)

      // Prepare clone with blob URLs converted to data URLs
      // Pass urlResolver to swap in high-res URLs if provided
      clone = await prepareElementForRender(element, urlResolver)

      // html-to-image options
      const renderOptions = {
        width: width * scale,
        height: height * scale,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${width}px`,
          height: `${height}px`,
        },
        backgroundColor,
        pixelRatio: 1, // We handle scaling manually
        cacheBust: false, // Don't cache bust - causes issues with blob URLs
        skipFonts: true, // Skip font loading issues
        includeQueryParams: true,
        // Skip elements with this attribute
        filter: (node: HTMLElement) => {
          if (node.hasAttribute?.('data-html2canvas-ignore')) return false
          return true
        },
      }

      // Generate blob from clone (single call to avoid race conditions)
      // Use JPEG at 90% quality - visually identical to PNG but 5-10x smaller
      console.log('[CanvasRenderer] Starting toBlob render (JPEG 90%)...')
      const blob = await toBlob(clone, { ...renderOptions, type: 'image/jpeg', quality: 0.9 })
      if (!blob) throw new Error('Failed to create blob')
      console.log('[CanvasRenderer] toBlob succeeded, converting to data URL...')

      // Convert blob to data URL
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
      console.log('[CanvasRenderer] Render complete!')

      return {
        dataUrl,
        blob,
        width: width * scale,
        height: height * scale,
      }
    } catch (err) {
      // html-to-image can throw Event objects when images fail to load
      let message: string
      if (err instanceof Error) {
        message = err.message
        console.error('[CanvasRenderer] Error (Error):', err.message, err.stack)
      } else if (err instanceof Event) {
        message = 'Error loading image - possible CORS issue or invalid image URL'
        // Log more details about the Event
        const target = (err as any).target
        if (target) {
          console.error('[CanvasRenderer] Event target:', target.tagName, target.src || target.href)
        }
      } else {
        message = 'Error al generar imagen'
        console.error('[CanvasRenderer] Unknown error type:', typeof err, err)
      }
      error.value = message
      console.error('[CanvasRenderer] Error:', err)
      throw new Error(message)
    } finally {
      // Clean up clone and its wrapper
      if (clone) {
        const wrapper = (clone as any).__wrapper
        if (wrapper && wrapper.parentNode) {
          wrapper.parentNode.removeChild(wrapper)
        } else if (clone.parentNode) {
          clone.parentNode.removeChild(clone)
        }
      }
      isRendering.value = false
    }
  }

  /**
   * Generate a thumbnail (smaller version for history/previews)
   * Uses JPEG format with compression to minimize storage size
   * Used for standalone thumbnail generation (e.g., autosave on page exit)
   */
  async function generateThumbnail(
    element: HTMLElement,
    maxSize = 200 // Match cart thumbnail size
  ): Promise<string> {
    // Use element's computed background color
    const computedBg = window.getComputedStyle(element).backgroundColor
    // Use scale 2 for standalone thumbnails (faster, less memory)
    const result = await renderElement(element, { scale: 2, backgroundColor: computedBg })
    return resizeToThumbnail(result.dataUrl, maxSize, computedBg)
  }

  /**
   * Resize an existing image (data URL) to a thumbnail
   * Useful for generating thumbnail from high-res image without re-rendering
   */
  async function resizeToThumbnail(
    imageDataUrl: string,
    maxSize = 150,
    backgroundColor = '#ffffff'
  ): Promise<string> {
    // Load the image to get dimensions
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = reject
      img.src = imageDataUrl
    })

    // Create a smaller canvas for thumbnail
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Failed to get canvas context')

    // Calculate thumbnail dimensions
    const aspectRatio = img.width / img.height
    let thumbWidth = maxSize
    let thumbHeight = maxSize

    if (aspectRatio > 1) {
      thumbHeight = maxSize / aspectRatio
    } else {
      thumbWidth = maxSize * aspectRatio
    }

    canvas.width = thumbWidth
    canvas.height = thumbHeight

    // Fill with background color (for JPEG transparency)
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, thumbWidth, thumbHeight)

    // Draw resized image
    ctx.drawImage(img, 0, 0, thumbWidth, thumbHeight)

    // Use JPEG with 0.6 quality for much smaller file size
    return canvas.toDataURL('image/jpeg', 0.6)
  }

  /**
   * Calculate dynamic scale factor based on target DPI and largest print size
   * This ensures consistent print quality regardless of canvas element size
   */
  function calculateDynamicScale(elementWidth: number, elementHeight: number): number {
    const { targetDpi, largestPrintCm, cmToInches } = PRINT_CONFIG

    // Calculate required pixels for target DPI at largest print size
    const requiredWidth = largestPrintCm.width * cmToInches * targetDpi
    const requiredHeight = largestPrintCm.height * cmToInches * targetDpi

    // Calculate scale needed for each dimension
    const scaleX = requiredWidth / elementWidth
    const scaleY = requiredHeight / elementHeight

    // Use the larger scale to ensure both dimensions meet target DPI
    // Round up to ensure we meet or exceed target quality
    return Math.ceil(Math.max(scaleX, scaleY))
  }

  /**
   * Generate poster image for cart/preview
   * Uses dynamic scale calculation to achieve target DPI for 70x100cm prints
   * Note: This is for order reference, not print production.
   * Print-ready files should be generated server-side with proper dimensions.
   * @param urlResolver - Optional function to resolve display URLs to high-res versions
   */
  async function generatePosterImage(
    element: HTMLElement,
    backgroundColor?: string,
    urlResolver?: (displayUrl: string) => string | null
  ): Promise<RenderResult> {
    // Get current element dimensions
    const rect = element.getBoundingClientRect()

    // Calculate scale dynamically based on target DPI
    const scale = calculateDynamicScale(rect.width, rect.height)

    // Use element's computed background color if not specified
    const computedBg = backgroundColor ?? window.getComputedStyle(element).backgroundColor
    return renderElement(element, {
      scale,
      backgroundColor: computedBg,
      urlResolver,
    })
  }

  /**
   * Download rendered image
   */
  function downloadImage(dataUrl: string, filename = 'poster.png'): void {
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  /**
   * Copy image to clipboard
   */
  async function copyToClipboard(blob: Blob): Promise<boolean> {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ])
      return true
    } catch (err) {
      console.error('[CanvasRenderer] Copy to clipboard failed:', err)
      return false
    }
  }

  return {
    // State
    isRendering,
    error,

    // Actions
    renderElement,
    generateThumbnail,
    resizeToThumbnail,
    generatePosterImage,
    downloadImage,
    copyToClipboard,
  }
}
