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

export type ToolType = 'birth-poster' | 'momentos' | 'personaliza'

// Import MomentosState for type union
import type { MomentosState } from '~/stores/momentos'

// Union type for all possible design states
export type DesignState = BirthPosterState | PersonalizaState | MomentosState

// Personaliza types
export type PersonalizaPanelType = 'archivo' | 'texto' | 'margen' | 'medidas' | 'marco'
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
  scrollToWarningTrigger: number
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
  { id: 'none', name: 'Negro', hex: '#000000', filter: 'none' },
  { id: 'cream-light', name: 'Crema claro', hex: '#8B8680', filter: 'invert(55%) sepia(8%) saturate(200%) hue-rotate(15deg) brightness(90%) contrast(88%)' },
  { id: 'cream', name: 'Crema', hex: '#7A7166', filter: 'invert(47%) sepia(10%) saturate(250%) hue-rotate(15deg) brightness(88%) contrast(86%)' },
  { id: 'light-blue', name: 'Azul', hex: '#2A525C', filter: 'invert(30%) sepia(25%) saturate(600%) hue-rotate(160deg) brightness(80%) contrast(92%)' },
  { id: 'light-gray', name: 'Gris', hex: '#6B6D6E', filter: 'invert(45%) sepia(3%) saturate(100%) hue-rotate(180deg) brightness(90%) contrast(90%)' },
  { id: 'peach-light', name: 'Durazno', hex: '#9B8672', filter: 'invert(55%) sepia(15%) saturate(350%) hue-rotate(15deg) brightness(88%) contrast(86%)' },
  { id: 'salmon', name: 'Salmón', hex: '#A67B70', filter: 'invert(52%) sepia(20%) saturate(400%) hue-rotate(340deg) brightness(88%) contrast(88%)' },
  { id: 'tan', name: 'Caramelo', hex: '#8B6B4A', filter: 'invert(42%) sepia(25%) saturate(500%) hue-rotate(15deg) brightness(85%) contrast(88%)' },
]

export const BACKGROUND_COLORS = [
  { id: 'white', name: 'Blanco', hex: '#fafafa' },
  { id: 'cream-light', name: 'Crema claro', hex: '#f6f4f2' },
  { id: 'cream', name: 'Crema', hex: '#f3eeea' },
  { id: 'light-blue', name: 'Azul claro', hex: '#cee5eb' },
  { id: 'light-gray', name: 'Gris claro', hex: '#e6e7e8' },
  { id: 'peach-light', name: 'Durazno claro', hex: '#f5eadd' },
  { id: 'salmon', name: 'Salmón', hex: '#e6cac0' },
  { id: 'tan', name: 'Caramelo', hex: '#e1b794' },
]

// Baby illustration styles with thumbnails and full images
export interface BabyStyleConfig {
  id: string
  name: string
  category: 'acuarela' | 'crayon' | 'pluma' | 'plumon'
  thumbnail: string
  image: string
}

export const BABY_STYLES: BabyStyleConfig[] = [
  // Acuarela styles
  { id: 'ac1', name: 'Acuarela 1', category: 'acuarela', thumbnail: '/posters/thumbnails/ac1_thumbnail.png', image: '/posters/acuarela-1.png' },
  { id: 'ac2', name: 'Acuarela 2', category: 'acuarela', thumbnail: '/posters/thumbnails/ac2_thumbnail.png', image: '/posters/acuarela-2.png' },
  { id: 'ac3', name: 'Acuarela 3', category: 'acuarela', thumbnail: '/posters/thumbnails/ac3_thumbnail.png', image: '/posters/acuarela-3.png' },
  // Crayon styles
  { id: 'cr1', name: 'Crayon 1', category: 'crayon', thumbnail: '/posters/thumbnails/cr1_thumbnail.png', image: '/posters/crayon-1.png' },
  { id: 'cr2', name: 'Crayon 2', category: 'crayon', thumbnail: '/posters/thumbnails/cr2_thumbnail.png', image: '/posters/crayon-2.png' },
  { id: 'cr3', name: 'Crayon 3', category: 'crayon', thumbnail: '/posters/thumbnails/cr3_thumbnail.png', image: '/posters/crayon-3.png' },
  // Pluma styles
  { id: 'pl1', name: 'Pluma 1', category: 'pluma', thumbnail: '/posters/thumbnails/pluma1_thumbnail.png', image: '/posters/pluma-1.png' },
  { id: 'pl2', name: 'Pluma 2', category: 'pluma', thumbnail: '/posters/thumbnails/pluma2_thumbnail.png', image: '/posters/pluma-2.png' },
  { id: 'pl3', name: 'Pluma 3', category: 'pluma', thumbnail: '/posters/thumbnails/pluma3_thumbnail.png', image: '/posters/pluma-3.png' },
  // Plumon styles
  { id: 'plm1', name: 'Plumon 1', category: 'plumon', thumbnail: '/posters/thumbnails/plumon1_thumbnail.png', image: '/posters/plumon-1.png' },
  { id: 'plm2', name: 'Plumon 2', category: 'plumon', thumbnail: '/posters/thumbnails/plumon2_thumbnail.png', image: '/posters/plumon-2.png' },
  { id: 'plm3', name: 'Plumon 3', category: 'plumon', thumbnail: '/posters/thumbnails/plumon3_thumbnail.png', image: '/posters/plumon-3.png' },
]

// Helper to get style by ID
export const getStyleById = (styleId: string): BabyStyleConfig | undefined => {
  return BABY_STYLES.find(s => s.id === styleId)
}

// Default baby configuration
export const createDefaultBabyConfig = (): BabyConfig => ({
  orientation: 'izquierda',
  styleId: 'ac1',
  illustrationColor: '#000000', // First color in ILLUSTRATION_COLORS (Negro/none)
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
