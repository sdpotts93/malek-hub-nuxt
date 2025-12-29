import { defineStore } from 'pinia'
import type {
  BirthPosterState,
  BabyConfig,
  PanelType,
  PosterSize,
  FrameStyle,
  BabyOrientation,
  HoraNacimiento,
} from '~/types'
import { createDefaultBabyConfig, createDefaultBirthPosterState } from '~/types'

// Default configurations for each baby position (0-indexed)
// Baby 1: aq1, derecha (but izquierda if only 1 baby)
// Baby 2: aq2, izquierda
// Baby 3: aq3, derecha
// Baby 4: aq5, izquierda (aq4 doesn't exist)
const BABY_POSITION_DEFAULTS: Array<{ styleId: string; orientation: BabyOrientation }> = [
  { styleId: 'aq1', orientation: 'derecha' },
  { styleId: 'aq2', orientation: 'izquierda' },
  { styleId: 'aq3', orientation: 'derecha' },
  { styleId: 'aq5', orientation: 'izquierda' },
]

// Create a baby config with position-specific defaults
const createBabyConfigForPosition = (index: number, totalCount: number): BabyConfig => {
  const base = createDefaultBabyConfig()
  const positionDefaults = BABY_POSITION_DEFAULTS[index]

  if (positionDefaults) {
    base.styleId = positionDefaults.styleId
    // If only 1 baby, keep default orientation (izquierda), otherwise use position default
    base.orientation = totalCount === 1 ? 'izquierda' : positionDefaults.orientation
  }

  return base
}

export const useBirthPosterStore = defineStore('birthPoster', {
  state: (): BirthPosterState => createDefaultBirthPosterState(),

  getters: {
    // Get current baby config based on active tab
    currentBaby(state): BabyConfig {
      return state.babies[state.activeBabyTab] || state.babies[0]
    },

    // Check if poster should be horizontal (3-4 babies)
    isHorizontal(state): boolean {
      return state.babyCount >= 3
    },

    // Get available poster sizes based on baby count
    availableSizes(state): PosterSize[] {
      if (state.babyCount <= 2) {
        return ['30x40', '40x50', '50x70', '70x100']
      }
      return ['40x30', '50x40', '70x50', '100x70']
    },

    // Check if current poster size is valid for baby count
    isSizeValid(state): boolean {
      const verticalSizes: PosterSize[] = ['30x40', '40x50', '50x70', '70x100']
      const horizontalSizes: PosterSize[] = ['40x30', '50x40', '70x50', '100x70']

      if (state.babyCount <= 2) {
        return verticalSizes.includes(state.posterSize)
      }
      return horizontalSizes.includes(state.posterSize)
    },

    // Get the 1:1 scale size based on baby count
    scaleSize(state): PosterSize {
      return state.babyCount <= 2 ? '50x70' : '100x70'
    },

    // Check if current poster size is the 1:1 scale size
    isScaleSize(state): boolean {
      const scaleSize = state.babyCount <= 2 ? '50x70' : '100x70'
      return state.posterSize === scaleSize
    },

    // Generate TEXT EDIT content for canvas
    generateTextContent(state): string[] {
      const lines: string[] = []

      state.babies.forEach((baby, index) => {
        // Line 1: SCALE 1:1 OF {nombre}
        const nameLine = `SCALE 1:1 OF ${baby.nombre || `Bebé ${index + 1}`}`
        lines.push(nameLine)

        // Line 2: Build data line
        const dataParts: string[] = []

        // Always show altura
        dataParts.push(`${baby.altura} cm`)

        // Optional peso
        if (baby.peso) {
          dataParts.push(`${baby.peso} gramos`)
        }

        // Optional fecha
        if (baby.fechaNacimiento) {
          const date = new Date(baby.fechaNacimiento)
          const formatted = date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
          dataParts.push(formatted)
        }

        // Optional lugar
        if (baby.lugarNacimiento) {
          dataParts.push(baby.lugarNacimiento)
        }

        lines.push(dataParts.join(' / '))
      })

      return lines
    },

    // Check if design has unsaved changes
    hasChanges(state): boolean {
      const defaultState = createDefaultBirthPosterState()
      return JSON.stringify(state) !== JSON.stringify(defaultState)
    },

    // Check if a specific baby has missing mandatory data (nombre is required)
    babyHasMissingData: (state) => (index: number): boolean => {
      const baby = state.babies[index]
      if (!baby) return false
      return !baby.nombre || baby.nombre.trim() === ''
    },

    // Get count of babies with missing mandatory data
    babiesWithMissingDataCount(state): number {
      return state.babies.filter(baby => !baby.nombre || baby.nombre.trim() === '').length
    },

    // Check if any baby has missing mandatory data
    hasMissingDatosData(state): boolean {
      return state.babies.some(baby => !baby.nombre || baby.nombre.trim() === '')
    },
  },

  actions: {
    // Set baby count and adjust babies array
    setBabyCount(count: 1 | 2 | 3 | 4) {
      const previousCount = this.babyCount
      this.babyCount = count

      // Rebuild babies array with position-specific defaults
      const newBabies: BabyConfig[] = []
      for (let i = 0; i < count; i++) {
        const existingBaby = this.babies[i]
        if (existingBaby) {
          // Keep existing baby data but update orientation if count changed
          const positionDefaults = BABY_POSITION_DEFAULTS[i]
          if (positionDefaults && previousCount !== count) {
            // Update orientation based on new count
            existingBaby.orientation = count === 1 ? 'izquierda' : positionDefaults.orientation
          }
          newBabies.push(existingBaby)
        } else {
          // Create new baby with position-specific defaults
          newBabies.push(createBabyConfigForPosition(i, count))
        }
      }
      this.babies = newBabies

      // Reset active tab if out of bounds
      if (this.activeBabyTab >= count) {
        this.activeBabyTab = 0
      }

      // Fix poster size if needed - use 1:1 scale sizes as default
      if (!this.isSizeValid) {
        this.posterSize = count <= 2 ? '50x70' : '100x70'
      }
    },

    // Set background color
    setBackgroundColor(color: string) {
      this.backgroundColor = color
    },

    // Set active panel
    setActivePanel(panel: PanelType) {
      this.activePanel = panel
    },

    // Set active baby tab
    setActiveBabyTab(index: number) {
      if (index >= 0 && index < this.babyCount) {
        this.activeBabyTab = index
      }
    },

    // Update current baby config
    updateCurrentBaby(updates: Partial<BabyConfig>) {
      const baby = this.babies[this.activeBabyTab]
      if (baby) {
        Object.assign(baby, updates)
      }
    },

    // Set baby orientation
    setBabyOrientation(orientation: BabyOrientation) {
      this.updateCurrentBaby({ orientation })
    },

    // Set baby style
    setBabyStyle(styleId: string) {
      this.updateCurrentBaby({ styleId })
    },

    // Set baby illustration color
    setBabyColor(color: string) {
      this.updateCurrentBaby({ illustrationColor: color })
    },

    // Set baby data
    setBabyNombre(nombre: string) {
      this.updateCurrentBaby({ nombre })
    },

    setBabyAltura(altura: number) {
      this.updateCurrentBaby({ altura })
    },

    setBabyPeso(peso: number | null) {
      this.updateCurrentBaby({ peso })
    },

    setBabyFechaNacimiento(fecha: Date | null) {
      this.updateCurrentBaby({ fechaNacimiento: fecha })
    },

    setBabyLugarNacimiento(lugar: string | null) {
      this.updateCurrentBaby({ lugarNacimiento: lugar })
    },

    setBabyHoraNacimiento(hora: HoraNacimiento | null) {
      this.updateCurrentBaby({ horaNacimiento: hora })
    },

    // Set poster size
    setPosterSize(size: PosterSize) {
      // Validate size matches baby count
      const verticalSizes: PosterSize[] = ['30x40', '40x50', '50x70', '70x100']
      const horizontalSizes: PosterSize[] = ['40x30', '50x40', '70x50', '100x70']

      if (this.babyCount <= 2 && verticalSizes.includes(size)) {
        this.posterSize = size
        // Toggle showScale for all babies based on whether it's the 1:1 scale size
        const showScale = size === '50x70'
        this.babies.forEach(baby => baby.showScale = showScale)
      } else if (this.babyCount >= 3 && horizontalSizes.includes(size)) {
        this.posterSize = size
        // Toggle showScale for all babies based on whether it's the 1:1 scale size
        const showScale = size === '100x70'
        this.babies.forEach(baby => baby.showScale = showScale)
      }
    },

    // Set frame style
    setFrameStyle(frame: FrameStyle | null) {
      this.frameStyle = frame
    },

    // Set show scale text for current baby
    setBabyShowScale(show: boolean) {
      this.updateCurrentBaby({ showScale: show })
    },

    // Load state from saved design
    loadState(state: BirthPosterState) {
      this.$patch(state)
    },

    // Reset to default state
    reset() {
      this.$patch(createDefaultBirthPosterState())
    },

    // Get state snapshot for saving
    getSnapshot(): BirthPosterState {
      return JSON.parse(JSON.stringify(this.$state))
    },
  },
})
