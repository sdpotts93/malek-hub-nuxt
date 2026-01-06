/**
 * Canvas Renderer Composable
 *
 * Uses html-to-image to generate poster images from the canvas preview element.
 * This library handles modern CSS features better than html2canvas.
 */

import { toPng, toBlob } from 'html-to-image'

interface RenderOptions {
  scale?: number // Scale factor for resolution (default: 2 for retina)
  backgroundColor?: string
  quality?: number // 0-1 for JPEG quality
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
   */
  async function prepareElementForRender(element: HTMLElement): Promise<HTMLElement> {
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

    // Convert blob URLs to data URLs in the clone
    const images = clone.querySelectorAll('img')
    for (const img of Array.from(images)) {
      if (img.src.startsWith('blob:')) {
        try {
          const dataUrl = await blobUrlToDataUrl(img.src)
          img.src = dataUrl
          // Wait for the new src to load
          await new Promise<void>((resolve) => {
            if (img.complete && img.naturalWidth > 0) {
              resolve()
            } else {
              img.onload = () => resolve()
              img.onerror = () => resolve()
              // Timeout fallback
              setTimeout(resolve, 500)
            }
          })
        } catch (err) {
          console.warn('[CanvasRenderer] Failed to convert blob URL:', err)
        }
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
    const { scale = 2, backgroundColor = '#ffffff' } = options

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
      clone = await prepareElementForRender(element)

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

      // Generate PNG data URL from clone
      const dataUrl = await toPng(clone, renderOptions)

      // Generate blob from clone
      const blob = await toBlob(clone, renderOptions)
      if (!blob) throw new Error('Failed to create blob')

      return {
        dataUrl,
        blob,
        width: width * scale,
        height: height * scale,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al generar imagen'
      error.value = message
      console.error('[CanvasRenderer] Error:', err)
      throw err
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
   * Generate poster image for cart/preview
   * Note: This is for order reference, not print production.
   * Print-ready files should be generated server-side with proper dimensions.
   */
  async function generatePosterImage(
    element: HTMLElement,
    backgroundColor?: string
  ): Promise<RenderResult> {
    // Use 6x scale for high quality image
    // Higher scales (10+) can cause SVG filter rendering issues in some browsers
    // Use element's computed background color if not specified
    const computedBg = backgroundColor ?? window.getComputedStyle(element).backgroundColor
    return renderElement(element, {
      scale: 6,
      backgroundColor: computedBg,
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
