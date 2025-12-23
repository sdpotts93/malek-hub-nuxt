import { defineStore } from 'pinia'
import type {
  BirthPosterState,
  BabyConfig,
  PanelType,
  PosterSize,
  FrameStyle,
  BabyOrientation,
} from '~/types'
import { createDefaultBabyConfig, createDefaultBirthPosterState } from '~/types'

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
  },

  actions: {
    // Set baby count and adjust babies array
    setBabyCount(count: 1 | 2 | 3 | 4) {
      this.babyCount = count

      // Adjust babies array
      while (this.babies.length < count) {
        this.babies.push(createDefaultBabyConfig())
      }
      while (this.babies.length > count) {
        this.babies.pop()
      }

      // Reset active tab if out of bounds
      if (this.activeBabyTab >= count) {
        this.activeBabyTab = 0
      }

      // Fix poster size if needed
      if (!this.isSizeValid) {
        this.posterSize = count <= 2 ? '30x40' : '40x30'
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

    // Set poster size
    setPosterSize(size: PosterSize) {
      // Validate size matches baby count
      const verticalSizes: PosterSize[] = ['30x40', '40x50', '50x70', '70x100']
      const horizontalSizes: PosterSize[] = ['40x30', '50x40', '70x50', '100x70']

      if (this.babyCount <= 2 && verticalSizes.includes(size)) {
        this.posterSize = size
      } else if (this.babyCount >= 3 && horizontalSizes.includes(size)) {
        this.posterSize = size
      }
    },

    // Set frame style
    setFrameStyle(frame: FrameStyle | null) {
      this.frameStyle = frame
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
