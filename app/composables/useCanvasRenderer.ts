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
   * Render an element to an image using html-to-image
   */
  async function renderElement(
    element: HTMLElement,
    options: RenderOptions = {}
  ): Promise<RenderResult> {
    const { scale = 2, backgroundColor = '#ffffff' } = options

    isRendering.value = true
    error.value = null

    try {
      // Wait for images to load
      await waitForImages(element)

      // Get actual dimensions
      const rect = element.getBoundingClientRect()
      const width = Math.round(rect.width)
      const height = Math.round(rect.height)

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
        cacheBust: true,
        skipFonts: true, // Skip font loading issues
        // Skip elements with this attribute
        filter: (node: HTMLElement) => {
          if (node.hasAttribute?.('data-html2canvas-ignore')) return false
          return true
        },
      }

      // Generate PNG data URL
      const dataUrl = await toPng(element, renderOptions)

      // Generate blob
      const blob = await toBlob(element, renderOptions)
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
    element: HTMLElement
  ): Promise<RenderResult> {
    // Use 4x scale for high quality image
    // The actual print file will be generated server-side based on the stored configuration
    return renderElement(element, {
      scale: 4,
      backgroundColor: '#ffffff',
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
    generatePosterImage,
    downloadImage,
    copyToClipboard,
  }
}
