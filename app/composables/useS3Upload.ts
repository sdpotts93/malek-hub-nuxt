/**
 * S3 Upload Composable
 *
 * Handles uploading design images to S3 using presigned URLs.
 * Uses the same Lambda endpoint as malek-artist project.
 */

const PRESIGNED_URL_ENDPOINT = 'https://bs64vihq06.execute-api.us-west-1.amazonaws.com/v1/getPresignedPostData'
const S3_BUCKET = 'birth-poster'
const S3_BASE_URL = `https://${S3_BUCKET}.s3.us-west-1.amazonaws.com`

interface UploadResult {
  url: string
  filename: string
}

export function useS3Upload() {
  const isUploading = ref(false)
  const uploadProgress = ref(0)
  const error = ref<string | null>(null)

  /**
   * Get presigned URL from Lambda
   */
  async function getPresignedUrl(filename: string, contentType: string): Promise<string> {
    const response = await fetch(PRESIGNED_URL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: filename,
        contentType: contentType,
        bucket: S3_BUCKET,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to get presigned URL')
    }

    const result = await response.json()
    return result.presignedUrl
  }

  /**
   * Upload blob to S3 using presigned URL
   */
  async function uploadToS3(blob: Blob, presignedUrl: string, contentType: string): Promise<void> {
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      body: blob,
      headers: { 'Content-Type': contentType },
    })

    if (!response.ok) {
      throw new Error('Failed to upload to S3')
    }
  }

  /**
   * Generate unique filename for design image
   */
  function generateFilename(prefix: string = 'design'): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `${prefix}-${timestamp}-${random}.png`
  }

  /**
   * Upload design image to S3
   * @param blob - Image blob to upload
   * @param prefix - Filename prefix (e.g., 'birth-poster')
   * @returns Upload result with S3 URL
   */
  async function uploadDesignImage(blob: Blob, prefix: string = 'birth-poster'): Promise<UploadResult> {
    isUploading.value = true
    uploadProgress.value = 0
    error.value = null

    try {
      const filename = generateFilename(prefix)
      const contentType = 'image/png'

      // Get presigned URL
      uploadProgress.value = 20
      const presignedUrl = await getPresignedUrl(filename, contentType)

      // Upload to S3
      uploadProgress.value = 50
      await uploadToS3(blob, presignedUrl, contentType)

      uploadProgress.value = 100

      const url = `${S3_BASE_URL}/${filename}`
      console.log('[S3Upload] Uploaded:', url)

      return { url, filename }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      error.value = message
      console.error('[S3Upload] Error:', err)
      throw err
    } finally {
      isUploading.value = false
    }
  }

  return {
    // State
    isUploading,
    uploadProgress,
    error,

    // Actions
    uploadDesignImage,
  }
}
