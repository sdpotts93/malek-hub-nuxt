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
  { id: 'aq4', name: 'Aquarelle 4', category: 'aquarelle', thumbnail: '/posters/thumbnails/aq4_thumbnail.png', image: '/posters/aquarelle-4.png' },
  { id: 'aq5', name: 'Aquarelle 5', category: 'aquarelle', thumbnail: '/posters/thumbnails/aq5_thumbnail.png', image: '/posters/aquarelle-5.png' },
  // Chunky styles
  { id: 'chunky1', name: 'Chunky 1', category: 'chunky', thumbnail: '/posters/thumbnails/chunky1_thumbnail.png', image: '/posters/chunky-1.png' },
  { id: 'chunky2', name: 'Chunky 2', category: 'chunky', thumbnail: '/posters/thumbnails/chunky2_thumbnail.png', image: '/posters/chunky-2.png' },
  { id: 'chunky3', name: 'Chunky 3', category: 'chunky', thumbnail: '/posters/thumbnails/chunky3_thumbnail.png', image: '/posters/chunky-3.png' },
  { id: 'chunky4', name: 'Chunky 4', category: 'chunky', thumbnail: '/posters/thumbnails/chunky4_thumbnail.png', image: '/posters/chunky-4.png' },
  { id: 'chunky5', name: 'Chunky 5', category: 'chunky', thumbnail: '/posters/thumbnails/chunky5_thumbnail.png', image: '/posters/chunky-5.png' },
  // Classic styles
  { id: 'cl1', name: 'Classic 1', category: 'classic', thumbnail: '/posters/thumbnails/cl1_thumbnail.png', image: '/posters/cl1.png' },
  { id: 'cl2', name: 'Classic 2', category: 'classic', thumbnail: '/posters/thumbnails/cl2_thumbnail.png', image: '/posters/cl2.png' },
  { id: 'cl3', name: 'Classic 3', category: 'classic', thumbnail: '/posters/thumbnails/cl3_thumbnail.png', image: '/posters/cl3.png' },
  { id: 'cl4', name: 'Classic 4', category: 'classic', thumbnail: '/posters/thumbnails/cl4_thumbnail.png', image: '/posters/cl4.png' },
  { id: 'cl5', name: 'Classic 5', category: 'classic', thumbnail: '/posters/thumbnails/cl5_thumbnail.png', image: '/posters/cl5.png' },
  // Sketch styles
  { id: 'sketch1', name: 'Sketch 1', category: 'sketch', thumbnail: '/posters/thumbnails/sketch1_thumbnail.png', image: '/posters/sketch-1.png' },
  { id: 'sketch2', name: 'Sketch 2', category: 'sketch', thumbnail: '/posters/thumbnails/sketch2_thumbnail.png', image: '/posters/sketch-2.png' },
  { id: 'sketch3', name: 'Sketch 3', category: 'sketch', thumbnail: '/posters/thumbnails/sketch3_thumbnail.png', image: '/posters/sketch-3.png' },
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
  fechaNacimiento: new Date(2026, 0, 1),
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
