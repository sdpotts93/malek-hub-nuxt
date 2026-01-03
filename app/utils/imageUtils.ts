/**
 * Image utility functions for compression and conversion
 */

/**
 * Convert a blob URL to a compressed base64 data URL
 * @param blobUrl - The blob URL to convert
 * @param maxWidth - Maximum width (height scales proportionally)
 * @param quality - JPEG quality (0-1)
 * @returns Promise resolving to base64 data URL or null if failed
 */
export async function blobUrlToBase64(
  blobUrl: string,
  maxWidth: number = 800,
  quality: number = 0.75
): Promise<string | null> {
  if (!blobUrl) return null

  // If already a data URL, return as-is (or recompress if needed)
  if (blobUrl.startsWith('data:')) {
    return blobUrl
  }

  try {
    // Fetch the blob
    const response = await fetch(blobUrl)
    const blob = await response.blob()

    // Create an image element
    const img = new Image()
    const imageLoadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      img.onload = () => resolve(img)
      img.onerror = reject
    })

    // Load the blob as image
    const objectUrl = URL.createObjectURL(blob)
    img.src = objectUrl

    await imageLoadPromise

    // Calculate new dimensions
    let width = img.width
    let height = img.height

    if (width > maxWidth) {
      height = (height * maxWidth) / width
      width = maxWidth
    }

    // Draw to canvas and compress
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      URL.revokeObjectURL(objectUrl)
      return null
    }

    ctx.drawImage(img, 0, 0, width, height)

    // Clean up object URL
    URL.revokeObjectURL(objectUrl)

    // Convert to base64
    const dataUrl = canvas.toDataURL('image/jpeg', quality)

    return dataUrl
  } catch (error) {
    console.error('[imageUtils] Failed to convert blob URL to base64:', error)
    return null
  }
}

/**
 * Check if a URL is a blob URL (which won't persist across sessions)
 */
export function isBlobUrl(url: string | null): boolean {
  return url?.startsWith('blob:') ?? false
}

/**
 * Check if a URL is a data URL (which will persist)
 */
export function isDataUrl(url: string | null): boolean {
  return url?.startsWith('data:') ?? false
}
