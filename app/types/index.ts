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
  image: string
  price: number
}

export interface BabyStyle {
  id: string
  name: string
  imageLeft: string  // Image for "izquierda" orientation
  imageRight: string // Image for "derecha" orientation
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
  lugarNacimiento: string | null // optional
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

export interface SavedDesign {
  id: string
  tool: ToolType
  name: string
  createdAt: Date
  updatedAt: Date
  thumbnail: string // Base64 or blob URL
  state: BirthPosterState // | MomentsState | PersonalizaState (for future)
}

// ==========================================================================
// UI Types
// ==========================================================================

export interface UIState {
  isCartOpen: boolean
  isHistoryOpen: boolean
  isMobileMenuOpen: boolean
  isMobileNavWrapperOpen: boolean
  mobileNavWrapperContent: 'history' | 'home' | null
  isLoading: boolean
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
  { id: 'gray', name: 'Gris', hex: '#6b7280', filter: 'invert(46%) sepia(7%) saturate(528%) hue-rotate(182deg) brightness(93%) contrast(88%)' },
  { id: 'brown', name: 'Marrón', hex: '#92400e', filter: 'invert(26%) sepia(43%) saturate(1426%) hue-rotate(23deg) brightness(91%) contrast(93%)' },
  { id: 'navy', name: 'Azul marino', hex: '#1e3a5f', filter: 'invert(18%) sepia(34%) saturate(1326%) hue-rotate(185deg) brightness(94%) contrast(92%)' },
  { id: 'forest', name: 'Verde bosque', hex: '#166534', filter: 'invert(29%) sepia(68%) saturate(553%) hue-rotate(95deg) brightness(92%) contrast(92%)' },
  { id: 'terracotta', name: 'Terracota', hex: '#c2410c', filter: 'invert(29%) sepia(78%) saturate(1631%) hue-rotate(16deg) brightness(89%) contrast(91%)' },
]

export const BACKGROUND_COLORS = [
  { id: 'white', name: 'Blanco', hex: '#ffffff' },
  { id: 'cream', name: 'Crema', hex: '#fef9f3' },
  { id: 'soft-pink', name: 'Rosa suave', hex: '#fdf2f8' },
  { id: 'soft-blue', name: 'Azul suave', hex: '#eff6ff' },
  { id: 'soft-green', name: 'Verde suave', hex: '#f0fdf4' },
  { id: 'soft-yellow', name: 'Amarillo suave', hex: '#fefce8' },
  { id: 'light-gray', name: 'Gris claro', hex: '#f9fafb' },
]

// Default baby configuration
export const createDefaultBabyConfig = (): BabyConfig => ({
  orientation: 'derecha',
  styleId: 'style-1',
  illustrationColor: '#000000',
  nombre: '',
  altura: 50,
  peso: null,
  fechaNacimiento: null,
  lugarNacimiento: null,
})

// Default birth poster state
export const createDefaultBirthPosterState = (): BirthPosterState => ({
  babyCount: 1,
  backgroundColor: '#ffffff',
  babies: [createDefaultBabyConfig()],
  posterSize: '30x40',
  frameStyle: null,
  activePanel: 'general',
  activeBabyTab: 0,
})
