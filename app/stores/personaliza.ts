import { defineStore } from 'pinia'
import type { FrameStyle } from '~/types'

// ==========================================================================
// Personaliza Types
// ==========================================================================

export type PersonalizaPanelType = 'archivo' | 'texto' | 'medidas' | 'marco'

// Image format options (matches poster aspect ratios)
export type ImageFormat = '1:1' | '7:5' | '5:7'

// Map format to orientation for product lookup
export type ImageOrientation = 'square' | 'horizontal' | 'vertical'

// Text style options
export type TextStyle = 'moderno' | 'clasico' | 'minimalista'

// Poster sizes by orientation
export type SquareSize = '50x50'
export type HorizontalSize = '40x30' | '50x40' | '70x50' | '100x70'
export type VerticalSize = '30x40' | '40x50' | '50x70' | '70x100'
export type PersonalizaSize = SquareSize | HorizontalSize | VerticalSize

// Size data structure
export interface SizeData {
  width: number
  height: number
  label: string
}

// Print resolutions for size warnings (from malekcustomposter)
export const PRINT_RESOLUTIONS: Record<ImageOrientation, Record<string, { size: string }>> = {
  vertical: {
    '30x40': { size: '1063x1417' },
    '40x50': { size: '1417x1771' },
    '50x70': { size: '1771x2380' },
    '70x100': { size: '2480x2543' },
  },
  horizontal: {
    '40x30': { size: '1417x1063' },
    '50x40': { size: '1771x1417' },
    '70x50': { size: '2380x1771' },
    '100x70': { size: '2543x2480' },
  },
  square: {
    '50x50': { size: '1771x1771' },
  },
}

// Available sizes by orientation
export const PERSONALIZA_SIZES: Record<ImageOrientation, Record<string, SizeData>> = {
  vertical: {
    '30x40': { width: 30, height: 40, label: '30 x 40 cm' },
    '40x50': { width: 40, height: 50, label: '40 x 50 cm' },
    '50x70': { width: 50, height: 70, label: '50 x 70 cm' },
    '70x100': { width: 70, height: 100, label: '70 x 100 cm' },
  },
  horizontal: {
    '40x30': { width: 40, height: 30, label: '40 x 30 cm' },
    '50x40': { width: 50, height: 40, label: '50 x 40 cm' },
    '70x50': { width: 70, height: 50, label: '70 x 50 cm' },
    '100x70': { width: 100, height: 70, label: '100 x 70 cm' },
  },
  square: {
    '50x50': { width: 50, height: 50, label: '50 x 50 cm' },
  },
}

// Background/margin colors (reuse from birth poster)
export const MARGIN_COLORS = [
  { id: 'white', name: 'Blanco', hex: '#fafafa' },
  { id: 'cream-1', name: 'Crema', hex: '#f8f6f2' },
  { id: 'cream-2', name: 'Crema claro', hex: '#faf8f4' },
  { id: 'light-blue', name: 'Azul claro', hex: '#d9ebf1' },
  { id: 'medium-blue', name: 'Azul medio', hex: '#80b2cd' },
  { id: 'light-purple', name: 'Lila', hex: '#dedae8' },
  { id: 'gray', name: 'Gris', hex: '#d2d3d4' },
  { id: 'peach', name: 'Durazno', hex: '#fbf1e8' },
]

// Shopify product IDs for each orientation
export const PRODUCT_IDS = {
  square: '8111419293931',
  horizontal: '8111405891819',
  vertical: '8111389442283',
}

// Crop coordinates for persistence (from vue-advanced-cropper)
export interface CropCoordinates {
  left: number
  top: number
  width: number
  height: number
}

// CropperJS instance type (minimal interface for what we need)
export interface CropperInstance {
  getCroppedCanvas(options?: {
    maxWidth?: number
    maxHeight?: number
    imageSmoothingEnabled?: boolean
    imageSmoothingQuality?: ImageSmoothingQuality
  }): HTMLCanvasElement
}

// High-res crop settings
const HIGH_RES_CROP_OPTIONS = {
  maxWidth: 4000,
  maxHeight: 4000,
  imageSmoothingEnabled: true,
  imageSmoothingQuality: 'high' as ImageSmoothingQuality,
}

// ==========================================================================
// State Interface
// ==========================================================================

export interface PersonalizaState {
  // Image state
  imageFile: File | null
  imageUrl: string | null // Object URL for preview (temporary)
  imageS3Url: string | null // Persistent S3 URL for original image
  imageDimensions: { width: number; height: number } | null
  imageFormat: ImageFormat
  zoomLevel: number // 0-100 percentage
  isUploadingToS3: boolean // Track S3 upload status

  // Cropped image data (from vue-advanced-cropper)
  croppedImageUrl: string | null // Blob URL for live preview (not persisted)
  croppedBlob: Blob | null // Blob for live preview (not persisted)
  cropCoordinates: CropCoordinates | null // Saved for persistence

  // Text state
  textStyle: TextStyle
  title: string
  subtitle: string

  // Margin state
  hasMargin: boolean
  marginColor: string

  // Poster settings
  posterSize: PersonalizaSize
  frameStyle: FrameStyle | null
  hasFrame: boolean

  // UI state
  activePanel: PersonalizaPanelType
  showSizeWarning: boolean
  sizeWarningAcknowledged: boolean
  isImageReady: boolean // True after image is uploaded and cropped
}

// ==========================================================================
// Helper Functions
// ==========================================================================

export const getOrientationFromFormat = (format: ImageFormat): ImageOrientation => {
  switch (format) {
    case '1:1':
      return 'square'
    case '7:5':
      return 'horizontal'
    case '5:7':
    default:
      return 'vertical'
  }
}

export const getAspectRatio = (format: ImageFormat): number => {
  switch (format) {
    case '1:1':
      return 1
    case '7:5':
      return 7 / 5
    case '5:7':
    default:
      return 5 / 7
  }
}

// Detect best format based on image dimensions
export const detectFormatFromDimensions = (width: number, height: number): ImageFormat => {
  const ratio = width / height
  // If close to square (within 10%), use 1:1
  if (ratio >= 0.9 && ratio <= 1.1) {
    return '1:1'
  }
  // If horizontal (wider than tall), use 7:5
  if (ratio > 1) {
    return '7:5'
  }
  // Otherwise vertical, use 5:7
  return '5:7'
}

export const getDefaultSize = (orientation: ImageOrientation): PersonalizaSize => {
  switch (orientation) {
    case 'square':
      return '50x50'
    case 'horizontal':
      return '40x30'
    case 'vertical':
      return '30x40'
  }
}

// Create default state
export const createDefaultPersonalizaState = (): PersonalizaState => ({
  // Image state
  imageFile: null,
  imageUrl: null,
  imageS3Url: null,
  imageDimensions: null,
  imageFormat: '5:7',
  zoomLevel: 0,
  isUploadingToS3: false,
  croppedImageUrl: null,
  croppedBlob: null,
  cropCoordinates: null,

  // Text state
  textStyle: 'moderno',
  title: '',
  subtitle: '',

  // Margin state
  hasMargin: true,
  marginColor: '#fafafa',

  // Poster settings
  posterSize: '30x40',
  frameStyle: null,
  hasFrame: true,

  // UI state
  activePanel: 'archivo',
  showSizeWarning: false,
  sizeWarningAcknowledged: false,
  isImageReady: false,
})

// ==========================================================================
// Cropper Instance Registry (outside Pinia for non-serializable data)
// ==========================================================================

let _cropperInstance: CropperInstance | null = null

export function registerCropper(cropper: CropperInstance) {
  _cropperInstance = cropper
}

export function unregisterCropper() {
  _cropperInstance = null
}

export function getCropperInstance(): CropperInstance | null {
  return _cropperInstance
}

/**
 * Check if the cropper instance is ready
 */
export function isCropperReady(): boolean {
  return _cropperInstance !== null
}

/**
 * Wait for the cropper instance to become available
 * @param timeoutMs Maximum time to wait in milliseconds (default 5000ms)
 * @returns Promise that resolves when cropper is ready, or rejects on timeout
 */
export function waitForCropper(timeoutMs = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (_cropperInstance) {
      resolve()
      return
    }

    const startTime = Date.now()
    const checkInterval = setInterval(() => {
      if (_cropperInstance) {
        clearInterval(checkInterval)
        resolve()
      } else if (Date.now() - startTime > timeoutMs) {
        clearInterval(checkInterval)
        reject(new Error('Timeout waiting for cropper instance'))
      }
    }, 100)
  })
}

/**
 * Generate a high-resolution cropped image from the current cropper state.
 * Returns a blob URL that can be used in the canvas for rendering.
 * This should be called before generating the final poster image.
 */
export async function generateHighResCrop(): Promise<Blob | null> {
  if (!_cropperInstance) {
    console.error('[Personaliza] No cropper instance registered')
    return null
  }

  return new Promise((resolve) => {
    const canvas = _cropperInstance!.getCroppedCanvas(HIGH_RES_CROP_OPTIONS)
    canvas.toBlob(
      (blob) => resolve(blob),
      'image/png',
      1 // Max quality
    )
  })
}

// ==========================================================================
// Store Definition
// ==========================================================================

export const usePersonalizaStore = defineStore('personaliza', {
  state: (): PersonalizaState => createDefaultPersonalizaState(),

  getters: {
    // Get current orientation from format
    orientation(state): ImageOrientation {
      return getOrientationFromFormat(state.imageFormat)
    },

    // Get aspect ratio for cropper
    aspectRatio(state): number {
      return getAspectRatio(state.imageFormat)
    },

    // Get available sizes for current orientation
    availableSizes(state): Record<string, SizeData> {
      return PERSONALIZA_SIZES[this.orientation]
    },

    // Check if image is uploaded (either blob URL or S3 URL)
    hasImage(state): boolean {
      return state.imageUrl !== null || state.imageS3Url !== null
    },

    // Check if design can be added to cart
    canAddToCart(state): boolean {
      return state.isImageReady && (!state.showSizeWarning || state.sizeWarningAcknowledged)
    },

    // Get required resolution for current size
    requiredResolution(state): { width: number; height: number } | null {
      const resolutions = PRINT_RESOLUTIONS[this.orientation]
      const sizeData = resolutions[state.posterSize]
      if (!sizeData) return null
      const [width, height] = sizeData.size.split('x').map(Number)
      if (width === undefined || height === undefined) return null
      return { width, height }
    },

    // Check if current size is valid for orientation
    isSizeValid(state): boolean {
      const sizes = Object.keys(PERSONALIZA_SIZES[this.orientation])
      return sizes.includes(state.posterSize)
    },

    // Get product ID for current orientation
    productId(): string {
      return PRODUCT_IDS[this.orientation]
    },
  },

  actions: {
    // Set image file and generate preview URL
    setImage(file: File) {
      // Revoke previous URL if exists
      if (this.imageUrl) {
        URL.revokeObjectURL(this.imageUrl)
      }

      this.imageFile = file
      this.imageUrl = URL.createObjectURL(file)
      this.isImageReady = false
      this.croppedImageUrl = null
      this.croppedBlob = null
      this.cropCoordinates = null

      // Load image to get dimensions and auto-detect format
      const img = new Image()
      img.onload = () => {
        this.imageDimensions = { width: img.width, height: img.height }

        // Auto-detect format based on image orientation
        const detectedFormat = detectFormatFromDimensions(img.width, img.height)
        this.imageFormat = detectedFormat

        // Update poster size to match the new orientation
        const orientation = getOrientationFromFormat(detectedFormat)
        this.posterSize = getDefaultSize(orientation)

        this.checkSizeWarning()
      }
      img.src = this.imageUrl
    },

    // Clear image
    clearImage() {
      if (this.imageUrl) {
        URL.revokeObjectURL(this.imageUrl)
      }
      // Only revoke blob URLs, not S3 URLs
      if (this.croppedImageUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(this.croppedImageUrl)
      }
      this.imageFile = null
      this.imageUrl = null
      this.imageS3Url = null
      this.imageDimensions = null
      this.croppedImageUrl = null
      this.croppedBlob = null
      this.cropCoordinates = null
      this.isImageReady = false
      this.isUploadingToS3 = false
      this.showSizeWarning = false
      this.sizeWarningAcknowledged = false
      this.zoomLevel = 0
    },

    // Set cropped image data (blob URL for preview)
    setCroppedImage(blob: Blob) {
      // Only revoke blob URLs, not S3 URLs
      if (this.croppedImageUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(this.croppedImageUrl)
      }
      this.croppedBlob = blob
      this.croppedImageUrl = URL.createObjectURL(blob)
      this.isImageReady = true
    },

    // Set crop coordinates (for persistence)
    setCropCoordinates(coordinates: CropCoordinates | null) {
      this.cropCoordinates = coordinates
    },

    // Set original image S3 URL
    setImageS3Url(url: string) {
      this.imageS3Url = url
    },

    // Set S3 upload status
    setIsUploadingToS3(uploading: boolean) {
      this.isUploadingToS3 = uploading
    },

    // Set image format and update size accordingly
    setImageFormat(format: ImageFormat) {
      this.imageFormat = format

      // Update poster size to match orientation
      const orientation = getOrientationFromFormat(format)
      if (!Object.keys(PERSONALIZA_SIZES[orientation]).includes(this.posterSize)) {
        this.posterSize = getDefaultSize(orientation)
      }

      this.checkSizeWarning()
    },

    // Set zoom level
    setZoomLevel(level: number) {
      this.zoomLevel = Math.max(0, Math.min(100, level))
    },

    // Set text style
    setTextStyle(style: TextStyle) {
      this.textStyle = style
    },

    // Set title
    setTitle(title: string) {
      this.title = title
    },

    // Set subtitle
    setSubtitle(subtitle: string) {
      this.subtitle = subtitle
    },

    // Toggle margin
    setHasMargin(hasMargin: boolean) {
      this.hasMargin = hasMargin
    },

    // Set margin color
    setMarginColor(color: string) {
      this.marginColor = color
    },

    // Set poster size
    setPosterSize(size: PersonalizaSize) {
      this.posterSize = size
      this.checkSizeWarning()
    },

    // Set frame style
    setFrameStyle(frame: FrameStyle | null) {
      this.frameStyle = frame
      this.hasFrame = frame !== null
    },

    // Toggle frame
    setHasFrame(hasFrame: boolean) {
      this.hasFrame = hasFrame
      if (!hasFrame) {
        this.frameStyle = null
      }
    },

    // Set active panel
    setActivePanel(panel: PersonalizaPanelType) {
      this.activePanel = panel
    },

    // Check if size warning should be shown
    checkSizeWarning() {
      if (!this.imageDimensions) {
        this.showSizeWarning = false
        return
      }

      const required = this.requiredResolution
      if (!required) {
        this.showSizeWarning = false
        return
      }

      this.showSizeWarning =
        this.imageDimensions.width < required.width ||
        this.imageDimensions.height < required.height

      // Reset acknowledgment when warning changes
      if (!this.showSizeWarning) {
        this.sizeWarningAcknowledged = false
      }
    },

    // Acknowledge size warning
    acknowledgeSizeWarning() {
      this.sizeWarningAcknowledged = true
    },

    // Reset to default state
    reset() {
      const defaults = createDefaultPersonalizaState()

      // Clean up blob URLs before reset (not S3 URLs)
      if (this.imageUrl?.startsWith('blob:')) URL.revokeObjectURL(this.imageUrl)
      if (this.croppedImageUrl?.startsWith('blob:')) URL.revokeObjectURL(this.croppedImageUrl)

      this.$patch(defaults)
    },

    // Load state from saved design
    loadState(state: Partial<PersonalizaState>) {
      // Clean up existing blob URLs before loading new state
      if (this.imageUrl?.startsWith('blob:')) URL.revokeObjectURL(this.imageUrl)
      if (this.croppedImageUrl?.startsWith('blob:')) URL.revokeObjectURL(this.croppedImageUrl)

      this.$patch(state)
    },

    // Get state snapshot for saving (excluding File, Blob, and transient state)
    getSnapshot(): Omit<PersonalizaState, 'imageFile' | 'croppedBlob' | 'croppedImageUrl' | 'isUploadingToS3'> {
      const { imageFile, croppedBlob, croppedImageUrl, isUploadingToS3, ...rest } = this.$state
      return rest
    },
  },
})
