<script setup lang="ts">
import type { MomentosPanelType } from '~/stores/momentos'
import type { MomentosState } from '~/stores/momentos'

// Page meta
definePageMeta({
  layout: false,
})

const pageTitle = 'Momentos - Studio Malek'
const pageDescription = 'Crea un collage personalizado con tus fotos favoritas con Studio Malek'

useHead({
  title: pageTitle,
})

useSeoMeta({
  title: pageTitle,
  description: pageDescription,
  ogTitle: pageTitle,
  ogDescription: pageDescription,
  ogUrl: 'https://hub.studiomalek.com/momentos',
  ogImage: '/og-image.jpg',
})

// Stores
const momentosStore = useMomentosStore()
const uiStore = useUIStore()

// Composables
const { isRendering, generateThumbnail } = useCanvasRenderer()
const { saveDesign, deleteDesign, designs } = useDesignHistory<MomentosState>('momentos')
const cart = useShopifyCart()

// Canvas ref for rendering
const canvasRef = ref<{ $el: HTMLElement } | null>(null)

// Cached thumbnail for beforeunload (can't do async there)
const cachedThumbnail = ref<string | null>(null)

// Computed
const pricing = computed(() => cart.calculateMomentosPrice(momentosStore.$state))

// Missing elements for cart warning modal
const missingElements = computed(() => {
  const missing: string[] = []
  const emptyCells = momentosStore.emptyCellCount
  if (emptyCells > 0) {
    missing.push(`${emptyCells} ${emptyCells === 1 ? 'espacio vacío' : 'espacios vacíos'} en el collage`)
  }
  // Add image size warnings
  const smallImageCount = [...momentosStore.imageWarnings.values()].filter(w => w !== null).length
  if (smallImageCount > 0) {
    missing.push(`${smallImageCount} ${smallImageCount === 1 ? 'imagen con resolución baja' : 'imágenes con resolución baja'}`)
  }
  return missing
})

// Can proceed with warnings - false if ALL cells are empty (must have at least one image)
const canProceedWithWarnings = computed(() => {
  return momentosStore.filledCellCount > 0
})

const isMobile = ref(false)
const isMobileSheetOpen = ref(false)

// Handle mobile panel selection
async function handleMobilePanelSelect(panel: MomentosPanelType) {
  momentosStore.setActivePanel(panel)
  // Wait for Vue to render the new panel before opening the sheet
  await nextTick()
  isMobileSheetOpen.value = true
}

function handleMobileSheetClose() {
  isMobileSheetOpen.value = false
}

// Track if design has been modified since last save
const lastSavedState = ref<string | null>(null)
const isDirty = computed(() => {
  const currentState = JSON.stringify(momentosStore.getSnapshot())
  return lastSavedState.value !== currentState
})

// Check if there's any meaningful content to save
// Must have actual displayable images (with valid URLs), not just array entries
const hasContent = computed(() => {
  // Check for filled cells on canvas
  if (momentosStore.filledCellCount > 0) return true

  // Check if any uploaded images have valid displayable URLs
  const hasDisplayableImages = momentosStore.uploadedImages.some(img => {
    // Must have at least one valid URL (blob, S3, or data URL)
    const hasValidUrl = (img.lowResUrl && img.lowResUrl.length > 0) ||
      (img.s3LowResUrl && img.s3LowResUrl.length > 0)
    return hasValidUrl
  })

  return hasDisplayableImages
})

// Generate design name
function getDesignName(): string {
  const format = momentosStore.format === 'square' ? 'Cuadrado' :
    momentosStore.format === 'horizontal' ? 'Horizontal' : 'Vertical'
  return `Momentos ${format} ${momentosStore.imageCount}`
}

// Handle loading a design from history
function handleLoadDesign(state: Partial<MomentosState>) {
  momentosStore.loadState(state)
}

// Save design to history (on navigation away, add-to-cart)
async function saveCurrentDesign() {
  const canvasElement = canvasRef.value?.$el
  // Don't save if no content or no changes
  if (!canvasElement || !isDirty.value || !hasContent.value) return

  try {
    // Always generate fresh thumbnail
    const thumbnail = await generateThumbnail(canvasElement)
    // Cache it for beforeunload (which can't do async)
    cachedThumbnail.value = thumbnail

    const persistentState = momentosStore.getSnapshot()

    saveDesign(persistentState as MomentosState, thumbnail, getDesignName())
    lastSavedState.value = JSON.stringify(momentosStore.getSnapshot())
  } catch (error) {
    console.error('[Momentos] Auto-save failed:', error)
  }
}

// Synchronous save for beforeunload (uses cached thumbnail)
function saveCurrentDesignSync() {
  // Don't save if no content or no changes
  if (!isDirty.value || !hasContent.value) return

  // Don't save without a valid thumbnail - prevents empty history items
  if (!cachedThumbnail.value) {
    console.log('[Momentos] Skipping sync save - no cached thumbnail')
    return
  }

  try {
    const persistentState = momentosStore.getSnapshot()
    const thumbnail = cachedThumbnail.value

    saveDesign(persistentState as MomentosState, thumbnail, getDesignName())
    lastSavedState.value = JSON.stringify(persistentState)
    console.log('[Momentos] Saved to history on unload')
  } catch (error) {
    console.error('[Momentos] Sync save failed:', error)
  }
}

// Auto-save settings
const AUTOSAVE_KEY = 'studiomalek_autosave_momentos'

// Check mobile on mount and initialize cart
onMounted(async () => {
  // Initialize Shopify cart and fetch momentos product variants
  await Promise.all([
    cart.init(),
    cart.fetchMomentosProduct(),
  ])

  // Restore from autosave if exists (from browser refresh/crash)
  try {
    const autosaved = localStorage.getItem(AUTOSAVE_KEY)
    if (autosaved) {
      const savedState = JSON.parse(autosaved)
      momentosStore.loadState(savedState)
      localStorage.removeItem(AUTOSAVE_KEY) // Clear after restore
    }
  } catch (e) {
    console.error('[Momentos] Failed to restore autosave:', e)
    localStorage.removeItem(AUTOSAVE_KEY)
  }

  // Store initial state to track changes (after autosave restore)
  lastSavedState.value = JSON.stringify(momentosStore.getSnapshot())

  const checkMobile = () => {
    isMobile.value = window.innerWidth < 768
  }
  checkMobile()
  window.addEventListener('resize', checkMobile)

  // Save to history on page unload (browser close/refresh)
  const handleBeforeUnload = () => {
    try {
      // Save to history with cached thumbnail
      saveCurrentDesignSync()

      // Also save raw state as backup for crash recovery
      const snapshot = momentosStore.getSnapshot()
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(snapshot))
    } catch (e) {
      console.error('[Momentos] Failed to save on unload:', e)
    }
  }
  window.addEventListener('beforeunload', handleBeforeUnload)

  onUnmounted(() => {
    window.removeEventListener('resize', checkMobile)
    window.removeEventListener('beforeunload', handleBeforeUnload)
    // Save to history when navigating away within the app
    saveCurrentDesign()
  })
})

// Save to history when navigating via Vue Router
onBeforeRouteLeave(async () => {
  await saveCurrentDesign()
  return true
})

// Panel navigation items
const navItems: { id: MomentosPanelType; label: string; icon: string }[] = [
  { id: 'diseno', label: 'Diseño', icon: 'design' },
  { id: 'archivos', label: 'Archivos', icon: 'upload' },
  { id: 'medidas', label: 'Medidas', icon: 'ruler' },
  { id: 'marco', label: 'Marco', icon: 'frame' },
]

// Handle edit from missing elements modal - navigate to images tab
async function handleEditFromModal() {
  momentosStore.setActivePanel('diseno')
  momentosStore.setActiveDisenoTab('imagenes')
  if (isMobile.value) {
    await nextTick()
    isMobileSheetOpen.value = true
  }
}

// Handle add to cart
async function handleAddToCart() {
  const canvasElement = canvasRef.value?.$el
  if (!canvasElement) return

  // Note: Empty cells are allowed - they will appear white in the final image.
  // The warning modal in AddToCartSection already informed the user about empty cells.

  try {
    uiStore.setLoading(true)

    // Add to cart (validates, generates image, uploads to S3, adds to Shopify)
    await cart.addMomentosToCart(canvasElement, momentosStore.$state)

    // Success - save to history and open cart
    const thumbnail = await generateThumbnail(canvasElement)
    saveDesign(momentosStore.getSnapshot() as MomentosState, thumbnail, getDesignName())
    lastSavedState.value = JSON.stringify(momentosStore.getSnapshot()) // Mark as saved

    uiStore.openCart()
  } catch (error) {
    console.error('Error adding to cart:', error)
    // Show user-friendly error message
    const message = error instanceof Error ? error.message : 'Error al agregar al carrito'
    alert(`No se pudo agregar al carrito: ${message}`)
  } finally {
    uiStore.setLoading(false)
  }
}
</script>

<template>
  <div class="momentos tool-page">
    <!-- Header -->
    <SharedTheHeader />

    <!-- Main Content -->
    <main class="momentos__main">
      <!-- Desktop: Sidebar Navigation -->
      <aside v-if="!isMobile" class="momentos__sidebar">
        <MomentosSidebarNavigation
          :items="navItems"
          :active-panel="momentosStore.activePanel"
          @select="momentosStore.setActivePanel"
        />
      </aside>

      <!-- Design Panel -->
      <div v-if="!isMobile" class="momentos__panel-wrapper">
        <!-- Panel Content (scrollable) -->
        <div class="momentos__panel-content">
          <MomentosDesignPanelWrapper :active-panel="momentosStore.activePanel" />
        </div>

        <!-- Add to Cart Section (fixed at bottom) -->
        <MomentosAddToCartSection
          :price="pricing.price"
          :compare-at-price="pricing.compareAtPrice"
          :is-loading="uiStore.isLoading || isRendering"
          :missing-elements="missingElements"
          :can-proceed="canProceedWithWarnings"
          @add-to-cart="handleAddToCart"
          @edit="handleEditFromModal"
        />
      </div>

      <!-- Canvas Area -->
      <div class="momentos__canvas-area">
        <!-- Undo/Redo buttons -->
        <div class="momentos__history-controls">
          <button
            class="momentos__history-btn"
            :disabled="!momentosStore.canUndo"
            title="Deshacer"
            @click="momentosStore.undo()"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 7v6h6"/>
              <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
            </svg>
          </button>
          <button
            class="momentos__history-btn"
            :disabled="!momentosStore.canRedo"
            title="Rehacer"
            @click="momentosStore.redo()"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 7v6h-6"/>
              <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/>
            </svg>
          </button>
        </div>

        <div class="momentos__canvas-container">
          <MomentosCanvas ref="canvasRef" />
        </div>
      </div>

      <!-- Desktop: History Panel -->
      <aside v-if="!isMobile" class="momentos__history">
        <MomentosHistoryPanel
          :designs="designs"
          :is-open="uiStore.isHistoryOpen"
          @toggle="uiStore.toggleHistory"
          @load="handleLoadDesign"
          @delete="deleteDesign"
        />
      </aside>
    </main>

    <!-- Mobile: Fixed Add to Cart Bar -->
    <MomentosMobileAddToCartBar
      v-if="isMobile"
      :price="pricing.price"
      :compare-at-price="pricing.compareAtPrice"
      :is-loading="uiStore.isLoading || isRendering"
      :missing-elements="missingElements"
      :can-proceed="canProceedWithWarnings"
      @add-to-cart="handleAddToCart"
      @edit="handleEditFromModal"
    />

    <!-- Mobile: Bottom Navbar -->
    <MomentosBottomNavbar
      v-if="isMobile"
      :items="navItems"
      :active-panel="isMobileSheetOpen ? momentosStore.activePanel : null"
      @select="handleMobilePanelSelect"
    />

    <!-- Mobile: Bottom Sheet -->
    <MomentosMobileBottomSheet
      v-if="isMobile"
      :is-open="isMobileSheetOpen"
      @close="handleMobileSheetClose"
    >
      <MomentosDesignPanelWrapper :active-panel="momentosStore.activePanel" />
    </MomentosMobileBottomSheet>

    <!-- Mobile Nav Wrapper (History/Home overlay) -->
    <MomentosMobileNavWrapper
      v-if="isMobile"
      :is-open="uiStore.isMobileNavWrapperOpen"
      :content="uiStore.mobileNavWrapperContent"
      @close="uiStore.closeMobileNavWrapper"
    />

    <!-- Cart Sidebar -->
    <SharedCartSidebar />
  </div>
</template>

<style lang="scss" scoped>
.momentos {
  display: flex;
  flex-direction: column;

  &__main {
    flex: 1;
    display: grid;
    grid-template-columns: $sidebar-width $panel-width 1fr 106px;
    overflow: hidden;
    background-color: $color-canvas;

    @include desktop {
      grid-template-columns: $sidebar-width-collapsed $panel-width-md 1fr 106px;
    }

    @include mobile {
      display: flex;
      flex-direction: column;
      grid-template-columns: none;
    }
  }

  &__sidebar {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  &__panel-wrapper {
    background: $color-bg-primary;

    border: 1px solid $color-border;
    border-radius: 12px;
    box-shadow: 0 7px 21px 0 rgba(51, 51, 51, 0.05);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    height: calc(100% - 12px);
    margin-top: auto;
  }

  &__panel-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    @include custom-scrollbar;
  }

  &__canvas-area {
    position: relative;
    background: $color-canvas;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $space-4xl $space-3xl $space-6xl;
    overflow: hidden;

    @include mobile {
      flex: 1;
      padding: $space-xl;
      align-items: flex-start;
    }
  }

  &__history-controls {
    position: absolute;
    top: $space-lg;
    right: $space-lg;
    display: flex;
    gap: 4px;
    z-index: 15;
  }

  &__history-btn {
    @include button-reset;
    @include flex-center;
    width: 32px;
    height: 32px;
    background: white;
    border-radius: 6px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
    color: #414651;
    transition: background-color $transition-fast, color $transition-fast;

    &:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    @include hover {
      &:not(:disabled) {
        background: $color-brand-light;
        color: $color-brand;
      }
    }
  }

  &__canvas-container {
    width: 100%;
    height: 90%;
    display: flex;
    align-items: center;
    justify-content: center;
    container-type: size;
    @include mobile {
      height: calc(100% - 136px);
      align-items: center;
    }
  }

  &__history {
    position: relative;
    width: 106px; // Fixed width: 82px panel + 24px margin
    background: $color-canvas;
    flex-shrink: 0;
  }
}
</style>
