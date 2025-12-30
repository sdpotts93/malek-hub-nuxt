/**
 * Canvas Renderer Composable
 *
 * Uses html2canvas to generate poster images from the canvas preview element.
 * This creates actual PNG images that can be saved or added to cart.
 */

import html2canvas from 'html2canvas'

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
   * Render an element to a canvas and return image data
   */
  async function renderElement(
    element: HTMLElement,
    options: RenderOptions = {}
  ): Promise<RenderResult> {
    const { scale = 2, backgroundColor = '#ffffff', quality = 0.92 } = options

    isRendering.value = true
    error.value = null

    try {
      // Wait for images to load
      await waitForImages(element)

      // Get computed dimensions before rendering (container queries don't work well with html2canvas)
      const rect = element.getBoundingClientRect()

      // Temporarily disable container-type to avoid container query issues
      const originalContainerType = element.style.containerType
      element.style.containerType = 'normal'

      // Force explicit dimensions
      const originalWidth = element.style.width
      const originalHeight = element.style.height
      element.style.width = `${rect.width}px`
      element.style.height = `${rect.height}px`

      // Render with html2canvas
      const canvas = await html2canvas(element, {
        scale,
        backgroundColor,
        useCORS: true,
        allowTaint: false,
        logging: false,
        width: rect.width,
        height: rect.height,
        // Ignore elements with data-html2canvas-ignore
        ignoreElements: (el) => el.hasAttribute('data-html2canvas-ignore'),
      })

      // Restore original styles
      element.style.containerType = originalContainerType
      element.style.width = originalWidth
      element.style.height = originalHeight

      // Get data URL
      const dataUrl = canvas.toDataURL('image/png', quality)

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b)
            else reject(new Error('Failed to create blob'))
          },
          'image/png',
          quality
        )
      })

      return {
        dataUrl,
        blob,
        width: canvas.width,
        height: canvas.height,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al generar imagen'
      error.value = message
      console.error('[CanvasRenderer] Error:', err)
      throw err
    } finally {
      isRendering.value = false
    }
  }

  /**
   * Generate a thumbnail (smaller version for history/previews)
   */
  async function generateThumbnail(
    element: HTMLElement,
    maxSize = 300
  ): Promise<string> {
    const result = await renderElement(element, { scale: 1 })

    // Create a smaller canvas for thumbnail
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Failed to get canvas context')

    // Calculate thumbnail dimensions
    const aspectRatio = result.width / result.height
    let thumbWidth = maxSize
    let thumbHeight = maxSize

    if (aspectRatio > 1) {
      thumbHeight = maxSize / aspectRatio
    } else {
      thumbWidth = maxSize * aspectRatio
    }

    canvas.width = thumbWidth
    canvas.height = thumbHeight

    // Draw resized image
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = reject
      img.src = result.dataUrl
    })

    ctx.drawImage(img, 0, 0, thumbWidth, thumbHeight)

    return canvas.toDataURL('image/png', 0.8)
  }

  /**
   * Generate poster image for cart/preview
   * Note: This is for order reference, not print production.
   * Print-ready files should be generated server-side with proper dimensions.
   */
  async function generatePosterImage(
    element: HTMLElement,
    _posterSizeCm: { width: number; height: number }
  ): Promise<RenderResult> {
    // Use 2x scale for good quality preview without memory issues
    // The actual print file will be generated server-side based on the stored configuration
    return renderElement(element, {
      scale: 2,
      backgroundColor: '#ffffff',
    })
  }

  /**
   * Wait for all images in an element to load
   */
  async function waitForImages(element: HTMLElement): Promise<void> {
    const images = element.querySelectorAll('img')
    const imagePromises = Array.from(images).map((img) => {
      if (img.complete) return Promise.resolve()
      return new Promise<void>((resolve) => {
        img.onload = () => resolve()
        img.onerror = () => resolve() // Don't fail on image error
      })
    })
    await Promise.all(imagePromises)
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
    generatePosterImage,
    downloadImage,
    copyToClipboard,
  }
}
