// ==========================================================================
// TypeScript Types & Interfaces
// ==========================================================================

// ==========================================================================
// Birth Poster Types
// ==========================================================================

export type BabyOrientation = 'derecha' | 'izquierda'

export type PanelType = 'general' | 'diseno' | 'datos' | 'medidas' | 'marco'

// Poster sizes: vertical for 1-2 babies, horizontal for 3-4 babies
export type PosterSizeVertical = '30x40' | '40x50' | '50x70' | '70x100'
export type PosterSizeHorizontal = '40x30' | '50x40' | '70x50' | '100x70'
export type PosterSize = PosterSizeVertical | PosterSizeHorizontal

export interface FrameStyle {
  id: string
  name: string
  image: string // Thumbnail for selection panel
  frameImage: string // Actual frame image for canvas overlay (vertical)
  frameImageHorizontal: string // Horizontal frame image for 3-4 babies
  frameImageSquare: string // Square frame image for 1:1 aspect ratio
  price: number
}

export interface BabyStyle {
  id: string
  name: string
  imageLeft: string  // Image for "izquierda" orientation
  imageRight: string // Image for "derecha" orientation
}

export interface HoraNacimiento {
  hour: number // 1-12
  minute: number // 0-59
  period: 'AM' | 'PM'
}

export interface BabyConfig {
  // Design (Diseño)
  orientation: BabyOrientation
  styleId: string
  illustrationColor: string // Hex color or CSS filter value

  // Data (Datos)
  nombre: string
  altura: number // in cm
  peso: number | null // in grams, optional
  fechaNacimiento: Date | null // optional
  horaNacimiento: HoraNacimiento | null // optional
  lugarNacimiento: string | null // optional

  // Display settings
  showScale: boolean // Whether to show "ESCALA 1:1 DE..." text for this baby
}

export interface BirthPosterState {
  // General settings
  babyCount: 1 | 2 | 3 | 4
  backgroundColor: string

  // Per-baby settings
  babies: BabyConfig[]

  // Poster settings
  posterSize: PosterSize
  frameStyle: FrameStyle | null

  // UI state
  activePanel: PanelType
  activeBabyTab: number // 0-indexed, for multi-baby tabs
}

// ==========================================================================
// Cart Types
// ==========================================================================

export interface CartLineItem {
  id: string
  variantId: string
  quantity: number
  title: string
  price: number
  image?: string
  customAttributes?: Record<string, string>
  // For birth poster, store the design config
  designConfig?: BirthPosterState
  designThumbnail?: string // Base64 image
}

export interface Cart {
  id: string
  lines: CartLineItem[]
  totalQuantity: number
  subtotal: number
  checkoutUrl: string
}

// ==========================================================================
// Design History Types
// ==========================================================================

export type ToolType = 'birth-poster' | 'moments' | 'personaliza'

// Union type for all possible design states
export type DesignState = BirthPosterState | PersonalizaState

// Personaliza types
export type PersonalizaPanelType = 'archivo' | 'texto' | 'medidas' | 'marco'
export type ImageFormat = '1:1' | '7:5' | '5:7'
export type TextStyle = 'moderno' | 'clasico' | 'minimalista'
export type SquareSize = '50x50'
export type HorizontalSize = '40x30' | '50x40' | '70x50' | '100x70'
export type VerticalSize = '30x40' | '40x50' | '50x70' | '70x100'
export type PersonalizaSize = SquareSize | HorizontalSize | VerticalSize

// Crop coordinates for persistence
export interface CropCoordinates {
  left: number
  top: number
  width: number
  height: number
}

// Personaliza state type for saved designs (excludes non-serializable fields)
export interface PersonalizaState {
  imageUrl: string | null // Not persisted (blob URL)
  imageS3Url: string | null // Persistent S3 URL for original image
  imageDimensions: { width: number; height: number } | null
  imageFormat: ImageFormat
  zoomLevel: number
  cropCoordinates: CropCoordinates | null // Saved crop position
  textStyle: TextStyle
  title: string
  subtitle: string
  hasMargin: boolean
  marginColor: string
  posterSize: PersonalizaSize
  frameStyle: FrameStyle | null
  hasFrame: boolean
  activePanel: PersonalizaPanelType
  showSizeWarning: boolean
  sizeWarningAcknowledged: boolean
  isImageReady: boolean
}

export interface SavedDesign<T = DesignState> {
  id: string
  tool: ToolType
  name: string
  createdAt: Date
  updatedAt: Date
  thumbnail: string // Base64 or blob URL
  state: T
}

// ==========================================================================
// UI Types
// ==========================================================================

export type ToastType = 'info' | 'success' | 'warning' | 'error'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

export interface UIState {
  isCartOpen: boolean
  isHistoryOpen: boolean
  isMobileMenuOpen: boolean
  isMobileNavWrapperOpen: boolean
  mobileNavWrapperContent: 'history' | 'home' | null
  isLoading: boolean
  toasts: Toast[]
}

// ==========================================================================
// Shopify Types (simplified for mock)
// ==========================================================================

export interface ShopifyProduct {
  id: string
  title: string
  handle: string
  description: string
  images: { src: string; alt: string }[]
  variants: ShopifyVariant[]
}

export interface ShopifyVariant {
  id: string
  title: string
  price: number
  compareAtPrice?: number
  available: boolean
  sku?: string
}

// ==========================================================================
// Predefined Data
// ==========================================================================

export const POSTER_SIZES: Record<PosterSize, { width: number; height: number; label: string }> = {
  // Vertical sizes (1-2 babies)
  '30x40': { width: 30, height: 40, label: '30 x 40 cm' },
  '40x50': { width: 40, height: 50, label: '40 x 50 cm' },
  '50x70': { width: 50, height: 70, label: '50 x 70 cm' },
  '70x100': { width: 70, height: 100, label: '70 x 100 cm' },
  // Horizontal sizes (3-4 babies)
  '40x30': { width: 40, height: 30, label: '40 x 30 cm' },
  '50x40': { width: 50, height: 40, label: '50 x 40 cm' },
  '70x50': { width: 70, height: 50, label: '70 x 50 cm' },
  '100x70': { width: 100, height: 70, label: '100 x 70 cm' },
}

export const ILLUSTRATION_COLORS = [
  { id: 'black', name: 'Negro', hex: '#000000', filter: 'none' },
  { id: 'dark-cream', name: 'Crema', hex: '#8B7355', filter: 'invert(44%) sepia(15%) saturate(735%) hue-rotate(357deg) brightness(93%) contrast(87%)' },
  { id: 'dark-tan', name: 'Arena', hex: '#A0826D', filter: 'invert(53%) sepia(12%) saturate(737%) hue-rotate(351deg) brightness(92%) contrast(88%)' },
  { id: 'dark-blue', name: 'Azul', hex: '#2C5F7C', filter: 'invert(32%) sepia(25%) saturate(884%) hue-rotate(165deg) brightness(93%) contrast(89%)' },
  { id: 'medium-dark-blue', name: 'Azul medio', hex: '#3D6B8A', filter: 'invert(40%) sepia(20%) saturate(746%) hue-rotate(165deg) brightness(89%) contrast(88%)' },
  { id: 'dark-purple', name: 'Lila', hex: '#5D4E6D', filter: 'invert(32%) sepia(10%) saturate(872%) hue-rotate(229deg) brightness(93%) contrast(87%)' },
  { id: 'dark-gray', name: 'Gris', hex: '#4A4A4A', filter: 'invert(27%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(56%) contrast(89%)' },
  { id: 'dark-peach', name: 'Durazno', hex: '#A66B4F', filter: 'invert(44%) sepia(25%) saturate(689%) hue-rotate(338deg) brightness(88%) contrast(87%)' },
]

export const BACKGROUND_COLORS = [
  { id: 'white', name: 'Blanco', hex: '#fafafa' },
  { id: 'cream-1', name: 'Crema', hex: '#f8f6f2' },
  { id: 'cream-2', name: 'Crema claro', hex: '#faf8f4' },
  { id: 'light-blue', name: 'Azul claro', hex: '#d9ebf1' },
  { id: 'medium-blue', name: 'Azul medio', hex: '#80b2cd' },
  { id: 'light-purple', name: 'Lila', hex: '#dedae8' },
  { id: 'gray', name: 'Gris', hex: '#d2d3d4' },
  { id: 'peach', name: 'Durazno', hex: '#fbf1e8' },
]

// Baby illustration styles with thumbnails and full images
export interface BabyStyleConfig {
  id: string
  name: string
  category: 'aquarelle' | 'chunky' | 'classic' | 'sketch'
  thumbnail: string
  image: string
}

export const BABY_STYLES: BabyStyleConfig[] = [
  // Aquarelle styles
  { id: 'aq1', name: 'Aquarelle 1', category: 'aquarelle', thumbnail: '/posters/thumbnails/aq1_thumbnail.png', image: '/posters/aquarelle-1.png' },
  { id: 'aq2', name: 'Aquarelle 2', category: 'aquarelle', thumbnail: '/posters/thumbnails/aq2_thumbnail.png', image: '/posters/aquarelle-2.png' },
  { id: 'aq3', name: 'Aquarelle 3', category: 'aquarelle', thumbnail: '/posters/thumbnails/aq3_thumbnail.png', image: '/posters/aquarelle-3.png' },
  // { id: 'aq4', name: 'Aquarelle 4', category: 'aquarelle', thumbnail: '/posters/thumbnails/aq4_thumbnail.png', image: '/posters/aquarelle-4.png' },
  { id: 'aq5', name: 'Aquarelle 5', category: 'aquarelle', thumbnail: '/posters/thumbnails/aq5_thumbnail.png', image: '/posters/aquarelle-5.png' },
  // Chunky styles
  { id: 'chunky1', name: 'Chunky 1', category: 'chunky', thumbnail: '/posters/thumbnails/chunky1_thumbnail.png', image: '/posters/chunky-1.png' },
  { id: 'chunky2', name: 'Chunky 2', category: 'chunky', thumbnail: '/posters/thumbnails/chunky2_thumbnail.png', image: '/posters/chunky-2.png' },
  { id: 'chunky3', name: 'Chunky 3', category: 'chunky', thumbnail: '/posters/thumbnails/chunky3_thumbnail.png', image: '/posters/chunky-3.png' },
  // { id: 'chunky4', name: 'Chunky 4', category: 'chunky', thumbnail: '/posters/thumbnails/chunky4_thumbnail.png', image: '/posters/chunky-4.png' },
  { id: 'chunky5', name: 'Chunky 5', category: 'chunky', thumbnail: '/posters/thumbnails/chunky5_thumbnail.png', image: '/posters/chunky-5.png' },
  // Classic styles
  { id: 'cl1', name: 'Classic 1', category: 'classic', thumbnail: '/posters/thumbnails/cl1_thumbnail.png', image: '/posters/cl1.png' },
  { id: 'cl2', name: 'Classic 2', category: 'classic', thumbnail: '/posters/thumbnails/cl2_thumbnail.png', image: '/posters/cl2.png' },
  { id: 'cl3', name: 'Classic 3', category: 'classic', thumbnail: '/posters/thumbnails/cl3_thumbnail.png', image: '/posters/cl3.png' },
  // { id: 'cl4', name: 'Classic 4', category: 'classic', thumbnail: '/posters/thumbnails/cl4_thumbnail.png', image: '/posters/cl4.png' },
  { id: 'cl5', name: 'Classic 5', category: 'classic', thumbnail: '/posters/thumbnails/cl5_thumbnail.png', image: '/posters/cl5.png' },
  // Sketch styles
  { id: 'sketch1', name: 'Sketch 1', category: 'sketch', thumbnail: '/posters/thumbnails/sketch1_thumbnail.png', image: '/posters/sketch-1.png' },
  { id: 'sketch2', name: 'Sketch 2', category: 'sketch', thumbnail: '/posters/thumbnails/sketch2_thumbnail.png', image: '/posters/sketch-2.png' },
  // { id: 'sketch3', name: 'Sketch 3', category: 'sketch', thumbnail: '/posters/thumbnails/sketch3_thumbnail.png', image: '/posters/sketch-3.png' },
  { id: 'sketch4', name: 'Sketch 4', category: 'sketch', thumbnail: '/posters/thumbnails/sketch4_thumbnail.png', image: '/posters/sketch-4.png' },
  { id: 'sketch5', name: 'Sketch 5', category: 'sketch', thumbnail: '/posters/thumbnails/sketch5_thumbnail.png', image: '/posters/sketch-5.png' },
]

// Helper to get style by ID
export const getStyleById = (styleId: string): BabyStyleConfig | undefined => {
  return BABY_STYLES.find(s => s.id === styleId)
}

// Default baby configuration
export const createDefaultBabyConfig = (): BabyConfig => ({
  orientation: 'izquierda',
  styleId: 'aq1',
  illustrationColor: '#000000',
  nombre: '',
  altura: 50,
  peso: null,
  fechaNacimiento: new Date(new Date().getFullYear(), 0, 1),
  horaNacimiento: null,
  lugarNacimiento: null,
  showScale: true,
})

// Default birth poster state
export const createDefaultBirthPosterState = (): BirthPosterState => ({
  babyCount: 1,
  backgroundColor: '#fafafa', // First color in BACKGROUND_COLORS (Blanco)
  babies: [createDefaultBabyConfig()],
  posterSize: '50x70', // Default to 1:1 scale size
  frameStyle: null,
  activePanel: 'general',
  activeBabyTab: 0,
})
