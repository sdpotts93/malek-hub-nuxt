/**
 * Design History Composable
 *
 * Manages saving and loading design states from localStorage.
 * Each tool has its own separate history.
 */

import type { SavedDesign, ToolType, BirthPosterState } from '~/types'

const HISTORY_STORAGE_KEY = 'studiomalek_design_history'
const MAX_SAVED_DESIGNS = 20

export function useDesignHistory(tool: ToolType) {
  const designs = ref<SavedDesign[]>([])
  const isLoading = ref(false)

  /**
   * Load designs from localStorage
   */
  function loadDesigns() {
    if (!import.meta.client) return

    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY)
      if (stored) {
        const allDesigns: SavedDesign[] = JSON.parse(stored)
        // Filter by tool and parse dates
        designs.value = allDesigns
          .filter((d) => d.tool === tool)
          .map((d) => ({
            ...d,
            createdAt: new Date(d.createdAt),
            updatedAt: new Date(d.updatedAt),
          }))
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      }
    } catch (error) {
      console.error('[DesignHistory] Error loading designs:', error)
      designs.value = []
    }
  }

  /**
   * Save all designs to localStorage
   */
  function persistDesigns() {
    if (!import.meta.client) return

    try {
      // Get all designs from storage
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY)
      let allDesigns: SavedDesign[] = stored ? JSON.parse(stored) : []

      // Remove designs for current tool
      allDesigns = allDesigns.filter((d) => d.tool !== tool)

      // Add current tool's designs
      allDesigns.push(...designs.value)

      // Limit total designs per tool
      const toolDesigns = new Map<ToolType, SavedDesign[]>()
      for (const design of allDesigns) {
        const list = toolDesigns.get(design.tool) || []
        list.push(design)
        toolDesigns.set(design.tool, list)
      }

      // Keep only MAX_SAVED_DESIGNS per tool
      const limitedDesigns: SavedDesign[] = []
      for (const [_, toolList] of toolDesigns) {
        const sorted = toolList.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        limitedDesigns.push(...sorted.slice(0, MAX_SAVED_DESIGNS))
      }

      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(limitedDesigns))
    } catch (error) {
      console.error('[DesignHistory] Error persisting designs:', error)
    }
  }

  /**
   * Generate a unique ID
   */
  function generateId(): string {
    return `design_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Save a new design
   */
  function saveDesign(state: BirthPosterState, thumbnail: string, name?: string): SavedDesign {
    const now = new Date()

    const design: SavedDesign = {
      id: generateId(),
      tool,
      name: name || `Diseño ${designs.value.length + 1}`,
      createdAt: now,
      updatedAt: now,
      thumbnail,
      state: JSON.parse(JSON.stringify(state)), // Deep clone
    }

    // Add to beginning of list
    designs.value.unshift(design)

    // Limit to max designs
    if (designs.value.length > MAX_SAVED_DESIGNS) {
      designs.value = designs.value.slice(0, MAX_SAVED_DESIGNS)
    }

    persistDesigns()

    console.log('[DesignHistory] Saved design:', design.id)
    return design
  }

  /**
   * Update an existing design
   */
  function updateDesign(
    id: string,
    state: BirthPosterState,
    thumbnail: string,
    name?: string
  ): SavedDesign | null {
    const index = designs.value.findIndex((d) => d.id === id)
    if (index < 0) return null

    const design = designs.value[index]
    design.state = JSON.parse(JSON.stringify(state))
    design.thumbnail = thumbnail
    design.updatedAt = new Date()
    if (name) design.name = name

    // Move to top of list
    designs.value.splice(index, 1)
    designs.value.unshift(design)

    persistDesigns()

    console.log('[DesignHistory] Updated design:', design.id)
    return design
  }

  /**
   * Delete a design
   */
  function deleteDesign(id: string): boolean {
    const index = designs.value.findIndex((d) => d.id === id)
    if (index < 0) return false

    designs.value.splice(index, 1)
    persistDesigns()

    console.log('[DesignHistory] Deleted design:', id)
    return true
  }

  /**
   * Get a design by ID
   */
  function getDesign(id: string): SavedDesign | null {
    return designs.value.find((d) => d.id === id) || null
  }

  /**
   * Clear all designs for current tool
   */
  function clearHistory() {
    designs.value = []
    persistDesigns()
    console.log('[DesignHistory] Cleared history for:', tool)
  }

  /**
   * Rename a design
   */
  function renameDesign(id: string, name: string): boolean {
    const design = designs.value.find((d) => d.id === id)
    if (!design) return false

    design.name = name
    design.updatedAt = new Date()
    persistDesigns()

    return true
  }

  // Initialize on mount
  onMounted(() => {
    loadDesigns()
  })

  return {
    // State
    designs: computed(() => designs.value),
    isLoading,
    isEmpty: computed(() => designs.value.length === 0),
    count: computed(() => designs.value.length),

    // Actions
    saveDesign,
    updateDesign,
    deleteDesign,
    getDesign,
    clearHistory,
    renameDesign,
    loadDesigns,
  }
}
