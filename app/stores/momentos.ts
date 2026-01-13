import { defineStore } from 'pinia'
import type { FrameStyle } from '~/types'

// ==========================================================================
// Momentos Types
// ==========================================================================

export type MomentosPanelType = 'diseno' | 'archivos' | 'medidas' | 'marco'
export type DisenoTabType = 'diseno' | 'imagenes'

// Format/orientation options
export type MomentosFormat = 'square' | 'horizontal' | 'vertical'

// Image count options based on format
export type SquareImageCount = 4 | 25 | 64
export type VerticalImageCount = 12 | 35 | 88
export type HorizontalImageCount = 12 | 35 | 88
export type MomentosImageCount = SquareImageCount | VerticalImageCount | HorizontalImageCount

// Size options by orientation
type SquareSize = '50x50'
type HorizontalSize = '40x30' | '50x40' | '70x50' | '100x70'
type VerticalSize = '30x40' | '40x50' | '50x70' | '70x100'
export type MomentosSize = SquareSize | HorizontalSize | VerticalSize

// Image filter types
export type ImageFilter = 'none' | 'grayscale' | 'sepia' | 'contrast' | 'brightness' | 'vintage'

// Uploaded image structure
export interface UploadedImage {
  id: string
  file: File
  // Three resolutions
  lowResUrl: string // 200px for thumbnails
  mediumResUrl: string // 2000px for canvas preview
  highResUrl: string // Original/max for final render
  // S3 URLs (after upload)
  s3LowResUrl?: string
  s3MediumResUrl?: string
  s3HighResUrl?: string
  // Metadata
  width: number
  height: number
  uploadProgress: number // 0-100
  isUploading: boolean
}

// Canvas grid cell structure
export interface CanvasCell {
  id: string
  imageId: string | null // Reference to UploadedImage.id
  // Per-cell adjustments
  rotation: number // 0, 90, 180, 270
  zoom: number // 1 = 100%, 1.5 = 150%, etc.
  filter: ImageFilter
  // Pan offset (for zoom)
  panX: number
  panY: number
}

// Undo/redo action types
export type ActionType =
  | 'SET_IMAGE'
  | 'REMOVE_IMAGE'
  | 'ROTATE_IMAGE'
  | 'ZOOM_IMAGE'
  | 'SET_FILTER'
  | 'PAN_IMAGE'
  | 'AUTO_FILL'
  | 'CLEAR_ALL'

// Undo/redo action structure
export interface HistoryAction {
  type: ActionType
  cellId: string | null // null for batch actions
  previousState: Partial<CanvasCell> | CanvasCell[] | null
  newState: Partial<CanvasCell> | CanvasCell[] | null
  timestamp: number
}

// Size data structure
interface SizeData {
  width: number
  height: number
  label: string
}

// ==========================================================================
// Constants
// ==========================================================================

// Available image counts by format
export const IMAGE_COUNTS: Record<MomentosFormat, number[]> = {
  square: [4, 25, 64],
  vertical: [12, 35, 88],
  horizontal: [12, 35, 88],
}

// Available sizes by orientation
export const MOMENTOS_SIZES: Record<MomentosFormat, Record<string, SizeData>> = {
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

// Background/margin colors
export const MARGIN_COLORS = [
  { id: 'white', name: 'Blanco', hex: '#ffffff' },
  { id: 'black', name: 'Negro', hex: '#000000' },
  { id: 'cream-1', name: 'Crema', hex: '#f8f6f2' },
  { id: 'cream-2', name: 'Crema claro', hex: '#faf8f4' },
  { id: 'light-blue', name: 'Azul claro', hex: '#d9ebf1' },
  { id: 'medium-blue', name: 'Azul medio', hex: '#80b2cd' },
  { id: 'light-purple', name: 'Lila', hex: '#dedae8' },
  { id: 'gray', name: 'Gris', hex: '#d2d3d4' },
  { id: 'peach', name: 'Durazno', hex: '#fbf1e8' },
]

// Filter presets with CSS filter values
export const IMAGE_FILTERS: Record<ImageFilter, { label: string; cssFilter: string }> = {
  none: { label: 'Normal', cssFilter: 'none' },
  grayscale: { label: 'B&N', cssFilter: 'grayscale(100%)' },
  sepia: { label: 'Sepia', cssFilter: 'sepia(80%)' },
  contrast: { label: 'Contraste', cssFilter: 'contrast(120%)' },
  brightness: { label: 'Brillo', cssFilter: 'brightness(110%)' },
  vintage: { label: 'Vintage', cssFilter: 'sepia(30%) contrast(90%) brightness(95%)' },
}

// Shopify product ID for Momentos
export const MOMENTOS_PRODUCT_ID = '9281694335211'

// Maximum images allowed
export const MAX_IMAGES = 100
export const MAX_IMAGE_SIZE_MB = 20

// ==========================================================================
// Helper Functions
// ==========================================================================

const getDefaultSize = (format: MomentosFormat): MomentosSize => {
  switch (format) {
    case 'square':
      return '50x50'
    case 'horizontal':
      return '40x30'
    case 'vertical':
      return '30x40'
  }
}

export const getDefaultImageCount = (format: MomentosFormat): MomentosImageCount => {
  switch (format) {
    case 'square':
      return 4
    case 'horizontal':
    case 'vertical':
      return 12
  }
}

// Generate unique ID
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

// Create empty canvas cell
export const createEmptyCell = (id?: string): CanvasCell => ({
  id: id || generateId(),
  imageId: null,
  rotation: 0,
  zoom: 1,
  filter: 'none',
  panX: 50, // object-position percentage (0-100)
  panY: 50, // object-position percentage (0-100)
})

// Calculate grid dimensions based on image count and format
export const calculateGridDimensions = (
  imageCount: MomentosImageCount,
  format: MomentosFormat
): { cols: number; rows: number } => {
  if (format === 'square') {
    const sqrt = Math.sqrt(imageCount)
    return { cols: sqrt, rows: sqrt }
  }

  // For horizontal/vertical, we need to find the best fit
  // Based on common grid layouts for these counts
  if (format === 'horizontal') {
    switch (imageCount) {
      case 12:
        return { cols: 4, rows: 3 }
      case 35:
        return { cols: 7, rows: 5 }
      case 88:
        return { cols: 11, rows: 8 }
      default:
        return { cols: 4, rows: 3 }
    }
  }

  // Vertical
  switch (imageCount) {
    case 12:
      return { cols: 3, rows: 4 }
    case 35:
      return { cols: 5, rows: 7 }
    case 88:
      return { cols: 8, rows: 11 }
    default:
      return { cols: 3, rows: 4 }
  }
}

// ==========================================================================
// State Interface
// ==========================================================================

export interface MomentosState {
  // Format & Layout
  format: MomentosFormat
  imageCount: MomentosImageCount
  posterSize: MomentosSize

  // Margin
  hasMargin: boolean
  marginColor: string

  // Frame
  frameStyle: FrameStyle | null

  // Uploaded images library
  uploadedImages: UploadedImage[]

  // Canvas grid cells
  canvasCells: CanvasCell[]

  // Currently selected cell (for editing)
  selectedCellId: string | null

  // UI State
  activePanel: MomentosPanelType
  activeDisenoTab: DisenoTabType

  // Undo/Redo
  undoStack: HistoryAction[]
  redoStack: HistoryAction[]

  // Loading/Processing states
  isGeneratingImage: boolean
}

// ==========================================================================
// Create Default State
// ==========================================================================

export const createDefaultMomentosState = (): MomentosState => {
  const defaultFormat: MomentosFormat = 'square'
  const defaultImageCount = getDefaultImageCount(defaultFormat)

  // Create initial empty cells
  const cells: CanvasCell[] = []
  for (let i = 0; i < defaultImageCount; i++) {
    cells.push(createEmptyCell())
  }

  return {
    // Format & Layout
    format: defaultFormat,
    imageCount: defaultImageCount,
    posterSize: getDefaultSize(defaultFormat),

    // Margin
    hasMargin: true,
    marginColor: '#ffffff',

    // Frame
    frameStyle: null,

    // Images
    uploadedImages: [],
    canvasCells: cells,
    selectedCellId: null,

    // UI
    activePanel: 'diseno',
    activeDisenoTab: 'diseno',

    // History
    undoStack: [],
    redoStack: [],

    // Loading
    isGeneratingImage: false,
  }
}

// ==========================================================================
// Store Definition
// ==========================================================================

export const useMomentosStore = defineStore('momentos', {
  state: (): MomentosState => createDefaultMomentosState(),

  getters: {
    // Get available sizes for current format
    availableSizes(state): Record<string, SizeData> {
      return MOMENTOS_SIZES[state.format]
    },

    // Get available image counts for current format
    availableImageCounts(state): number[] {
      return IMAGE_COUNTS[state.format]
    },

    // Get grid dimensions
    gridDimensions(state): { cols: number; rows: number } {
      return calculateGridDimensions(state.imageCount, state.format)
    },

    // Get count of filled cells
    filledCellCount(state): number {
      return state.canvasCells.filter(c => c.imageId !== null).length
    },

    // Get count of empty cells
    emptyCellCount(state): number {
      return state.canvasCells.filter(c => c.imageId === null).length
    },

    // Check if all cells are filled
    allCellsFilled(state): boolean {
      return state.canvasCells.every(c => c.imageId !== null)
    },

    // Check if can add more images
    canAddMoreImages(state): boolean {
      return state.uploadedImages.length < MAX_IMAGES
    },

    // Get uploaded image by ID
    getImageById: (state) => (id: string): UploadedImage | undefined => {
      return state.uploadedImages.find(img => img.id === id)
    },

    // Get cell by ID
    getCellById: (state) => (id: string): CanvasCell | undefined => {
      return state.canvasCells.find(cell => cell.id === id)
    },

    // Get selected cell
    selectedCell(state): CanvasCell | null {
      if (!state.selectedCellId) return null
      return state.canvasCells.find(c => c.id === state.selectedCellId) || null
    },

    // Check if can undo
    canUndo(state): boolean {
      return state.undoStack.length > 0
    },

    // Check if can redo
    canRedo(state): boolean {
      return state.redoStack.length > 0
    },

    // Check if design is ready for cart
    isReadyForCart(state): boolean {
      // All cells must have an image
      return state.canvasCells.every(c => c.imageId !== null)
    },

    // Get aspect ratio based on format
    aspectRatio(state): number {
      switch (state.format) {
        case 'square':
          return 1
        case 'horizontal':
          return 7 / 5
        case 'vertical':
          return 5 / 7
      }
    },
  },

  actions: {
    // ==========================================================================
    // Format & Layout Actions
    // ==========================================================================

    setFormat(format: MomentosFormat) {
      if (this.format === format) return

      this.format = format

      // Update image count to valid value for new format
      const availableCounts = IMAGE_COUNTS[format]
      if (!availableCounts.includes(this.imageCount)) {
        this.imageCount = getDefaultImageCount(format)
      }

      // Update poster size to valid value for new format
      const availableSizes = Object.keys(MOMENTOS_SIZES[format])
      if (!availableSizes.includes(this.posterSize)) {
        this.posterSize = getDefaultSize(format)
      }

      // Regenerate canvas cells
      this._regenerateCanvasCells()
    },

    setImageCount(count: MomentosImageCount) {
      if (this.imageCount === count) return

      this.imageCount = count
      this._regenerateCanvasCells()
    },

    setPosterSize(size: MomentosSize) {
      this.posterSize = size
    },

    // Regenerate canvas cells when format/count changes
    _regenerateCanvasCells() {
      // Save existing image assignments
      const existingAssignments = new Map<number, string | null>()
      this.canvasCells.forEach((cell, index) => {
        if (cell.imageId) {
          existingAssignments.set(index, cell.imageId)
        }
      })

      // Create new cells
      const newCells: CanvasCell[] = []
      for (let i = 0; i < this.imageCount; i++) {
        const cell = createEmptyCell()
        // Restore image assignment if index exists
        if (existingAssignments.has(i)) {
          cell.imageId = existingAssignments.get(i)!
        }
        newCells.push(cell)
      }

      this.canvasCells = newCells
      this.selectedCellId = null

      // Clear history since layout changed
      this.undoStack = []
      this.redoStack = []
    },

    // ==========================================================================
    // Margin Actions
    // ==========================================================================

    setHasMargin(hasMargin: boolean) {
      this.hasMargin = hasMargin
    },

    setMarginColor(color: string) {
      this.marginColor = color
    },

    // ==========================================================================
    // Frame Actions
    // ==========================================================================

    setFrameStyle(frame: FrameStyle | null) {
      this.frameStyle = frame
    },

    // ==========================================================================
    // Image Library Actions
    // ==========================================================================

    addUploadedImage(image: UploadedImage) {
      if (this.uploadedImages.length >= MAX_IMAGES) {
        console.warn('[Momentos] Max images reached')
        return
      }
      this.uploadedImages.push(image)
    },

    updateUploadedImage(id: string, updates: Partial<UploadedImage>) {
      const index = this.uploadedImages.findIndex(img => img.id === id)
      const existing = this.uploadedImages[index]
      if (index !== -1 && existing) {
        this.uploadedImages[index] = { ...existing, ...updates }
      }
    },

    removeUploadedImage(id: string) {
      // Remove from uploaded images
      const index = this.uploadedImages.findIndex(img => img.id === id)
      const img = this.uploadedImages[index]
      if (index !== -1 && img) {
        // Revoke blob URLs
        if (img.lowResUrl.startsWith('blob:')) URL.revokeObjectURL(img.lowResUrl)
        if (img.mediumResUrl.startsWith('blob:')) URL.revokeObjectURL(img.mediumResUrl)
        if (img.highResUrl.startsWith('blob:')) URL.revokeObjectURL(img.highResUrl)

        this.uploadedImages.splice(index, 1)
      }

      // Remove from any canvas cells using this image
      this.canvasCells.forEach(cell => {
        if (cell.imageId === id) {
          cell.imageId = null
          cell.rotation = 0
          cell.zoom = 1
          cell.filter = 'none'
          cell.panX = 50
          cell.panY = 50
        }
      })
    },

    // ==========================================================================
    // Canvas Cell Actions (with undo/redo support)
    // ==========================================================================

    _pushUndoAction(action: Omit<HistoryAction, 'timestamp'>) {
      this.undoStack.push({
        ...action,
        timestamp: Date.now(),
      })
      // Clear redo stack when new action is performed
      this.redoStack = []

      // Limit undo stack size
      if (this.undoStack.length > 50) {
        this.undoStack.shift()
      }
    },

    setImageToCell(cellId: string, imageId: string | null) {
      const cell = this.canvasCells.find(c => c.id === cellId)
      if (!cell) return

      // Save previous state for undo
      const previousState: Partial<CanvasCell> = {
        imageId: cell.imageId,
        rotation: cell.rotation,
        zoom: cell.zoom,
        filter: cell.filter,
        panX: cell.panX,
        panY: cell.panY,
      }

      // Update cell
      cell.imageId = imageId
      // Reset adjustments when setting or removing image
      cell.rotation = 0
      cell.zoom = 1
      cell.filter = 'none'
      cell.panX = 50
      cell.panY = 50

      this._pushUndoAction({
        type: imageId ? 'SET_IMAGE' : 'REMOVE_IMAGE',
        cellId,
        previousState,
        newState: {
          imageId: cell.imageId,
          rotation: cell.rotation,
          zoom: cell.zoom,
          filter: cell.filter,
          panX: cell.panX,
          panY: cell.panY,
        },
      })
    },

    rotateCell(cellId: string, direction: 'cw' | 'ccw' = 'cw') {
      const cell = this.canvasCells.find(c => c.id === cellId)
      if (!cell || !cell.imageId) return

      const previousRotation = cell.rotation
      cell.rotation = direction === 'cw'
        ? (cell.rotation + 90) % 360
        : (cell.rotation - 90 + 360) % 360

      this._pushUndoAction({
        type: 'ROTATE_IMAGE',
        cellId,
        previousState: { rotation: previousRotation },
        newState: { rotation: cell.rotation },
      })
    },

    zoomCell(cellId: string, delta: number) {
      const cell = this.canvasCells.find(c => c.id === cellId)
      if (!cell || !cell.imageId) return

      const previousZoom = cell.zoom
      cell.zoom = Math.max(1, Math.min(3, cell.zoom + delta))

      // Reset pan if zoom goes back to 1
      if (cell.zoom === 1) {
        cell.panX = 50
        cell.panY = 50
      }

      this._pushUndoAction({
        type: 'ZOOM_IMAGE',
        cellId,
        previousState: { zoom: previousZoom },
        newState: { zoom: cell.zoom },
      })
    },

    setCellFilter(cellId: string, filter: ImageFilter) {
      const cell = this.canvasCells.find(c => c.id === cellId)
      if (!cell || !cell.imageId) return

      const previousFilter = cell.filter
      cell.filter = filter

      this._pushUndoAction({
        type: 'SET_FILTER',
        cellId,
        previousState: { filter: previousFilter },
        newState: { filter: cell.filter },
      })
    },

    // Live pan without history (used during drag)
    panCellLive(cellId: string, panX: number, panY: number) {
      const cell = this.canvasCells.find(c => c.id === cellId)
      if (!cell || !cell.imageId) return
      cell.panX = panX
      cell.panY = panY
    },

    // Pan with history (used when drag ends)
    panCell(cellId: string, panX: number, panY: number, previousPanX: number, previousPanY: number) {
      const cell = this.canvasCells.find(c => c.id === cellId)
      if (!cell || !cell.imageId) return

      cell.panX = panX
      cell.panY = panY

      this._pushUndoAction({
        type: 'PAN_IMAGE',
        cellId,
        previousState: { panX: previousPanX, panY: previousPanY },
        newState: { panX, panY },
      })
    },

    // Auto-fill empty cells with available images
    autoFillCells() {
      const emptyCells = this.canvasCells.filter(c => c.imageId === null)
      const availableImages = this.uploadedImages.filter(
        img => !this.canvasCells.some(c => c.imageId === img.id)
      )

      if (emptyCells.length === 0 || availableImages.length === 0) return

      // Save previous state for batch undo
      const previousCells = this.canvasCells.map(c => ({ ...c }))

      // Fill cells in order
      const fillCount = Math.min(emptyCells.length, availableImages.length)
      for (let i = 0; i < fillCount; i++) {
        const cell = emptyCells[i]
        const image = availableImages[i]
        if (cell && image) {
          cell.imageId = image.id
        }
      }

      this._pushUndoAction({
        type: 'AUTO_FILL',
        cellId: null,
        previousState: previousCells,
        newState: this.canvasCells.map(c => ({ ...c })),
      })
    },

    // Clear all images from canvas
    clearAllCells() {
      // Save previous state for undo
      const previousCells = this.canvasCells.map(c => ({ ...c }))

      // Clear all cells
      this.canvasCells.forEach(cell => {
        cell.imageId = null
        cell.rotation = 0
        cell.zoom = 1
        cell.filter = 'none'
        cell.panX = 50
        cell.panY = 50
      })

      this._pushUndoAction({
        type: 'CLEAR_ALL',
        cellId: null,
        previousState: previousCells,
        newState: this.canvasCells.map(c => ({ ...c })),
      })
    },

    // ==========================================================================
    // Selection Actions
    // ==========================================================================

    selectCell(cellId: string | null) {
      this.selectedCellId = cellId
    },

    // ==========================================================================
    // Undo/Redo Actions
    // ==========================================================================

    undo() {
      if (this.undoStack.length === 0) return

      const action = this.undoStack.pop()!
      this.redoStack.push(action)

      // Restore previous state
      if (action.type === 'AUTO_FILL' || action.type === 'CLEAR_ALL') {
        // Batch restore
        this.canvasCells = (action.previousState as CanvasCell[]).map(c => ({ ...c }))
      } else if (action.cellId) {
        // Single cell restore
        const cell = this.canvasCells.find(c => c.id === action.cellId)
        if (cell && action.previousState) {
          Object.assign(cell, action.previousState)
        }
      }
    },

    redo() {
      if (this.redoStack.length === 0) return

      const action = this.redoStack.pop()!
      this.undoStack.push(action)

      // Apply new state
      if (action.type === 'AUTO_FILL' || action.type === 'CLEAR_ALL') {
        // Batch apply
        this.canvasCells = (action.newState as CanvasCell[]).map(c => ({ ...c }))
      } else if (action.cellId) {
        // Single cell apply
        const cell = this.canvasCells.find(c => c.id === action.cellId)
        if (cell && action.newState) {
          Object.assign(cell, action.newState)
        }
      }
    },

    // ==========================================================================
    // UI Actions
    // ==========================================================================

    setActivePanel(panel: MomentosPanelType) {
      this.activePanel = panel

      // If switching to archivos, also switch to imagenes tab
      if (panel === 'archivos') {
        this.activePanel = 'diseno'
        this.activeDisenoTab = 'imagenes'
      }
      // If switching to diseno directly, switch to diseno tab
      else if (panel === 'diseno') {
        this.activeDisenoTab = 'diseno'
      }
    },

    setActiveDisenoTab(tab: DisenoTabType) {
      this.activeDisenoTab = tab
    },

    setIsGeneratingImage(isGenerating: boolean) {
      this.isGeneratingImage = isGenerating
    },

    // ==========================================================================
    // State Management
    // ==========================================================================

    // Reset to default state
    reset() {
      // Clean up blob URLs
      this.uploadedImages.forEach(img => {
        if (img.lowResUrl.startsWith('blob:')) URL.revokeObjectURL(img.lowResUrl)
        if (img.mediumResUrl.startsWith('blob:')) URL.revokeObjectURL(img.mediumResUrl)
        if (img.highResUrl.startsWith('blob:')) URL.revokeObjectURL(img.highResUrl)
      })

      const defaults = createDefaultMomentosState()
      this.$patch(defaults)
    },

    // Load state from saved design
    loadState(state: Partial<MomentosState>) {
      // Clean up existing blob URLs
      this.uploadedImages.forEach(img => {
        if (img.lowResUrl.startsWith('blob:')) URL.revokeObjectURL(img.lowResUrl)
        if (img.mediumResUrl.startsWith('blob:')) URL.revokeObjectURL(img.mediumResUrl)
        if (img.highResUrl.startsWith('blob:')) URL.revokeObjectURL(img.highResUrl)
      })

      this.$patch(state)
    },

    // Get state snapshot for saving (excluding non-serializable data)
    getSnapshot(): Omit<MomentosState, 'undoStack' | 'redoStack' | 'isGeneratingImage'> {
      const { undoStack, redoStack, isGeneratingImage, ...rest } = this.$state

      // Filter out blob URLs from uploadedImages - only keep S3 URLs
      const cleanedImages = rest.uploadedImages.map(img => ({
        ...img,
        lowResUrl: img.s3LowResUrl || '',
        mediumResUrl: img.s3MediumResUrl || '',
        highResUrl: img.s3HighResUrl || '',
        file: null as unknown as File, // Can't serialize File objects
        isUploading: false,
        uploadProgress: 100,
      }))

      return {
        ...rest,
        uploadedImages: cleanedImages,
      }
    },
  },
})
