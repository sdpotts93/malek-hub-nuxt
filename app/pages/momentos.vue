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
const { isRendering, generateThumbnail, warmup } = useCanvasRenderer()
const { saveDesign, deleteDesign, designs } = useDesignHistory<MomentosState>('momentos')
const cart = useShopifyCart()

// Canvas ref for rendering
const canvasRef = ref<{ $el: HTMLElement } | null>(null)

// Scrollable panel wrapper ref for desktop scroll navigation
const scrollablePanelRef = ref<{
  scrollToSection: (section: 'diseno' | 'medidas' | 'marco') => void
  containerRef: HTMLElement | null
} | null>(null)

// Active section in view (for desktop scroll mode when diseño tab is active)
const activeSectionInView = ref<'diseno' | 'medidas' | 'marco'>('diseno')

// Computed
const pricing = computed(() => cart.calculateMomentosPrice(momentosStore.$state))
const uploadingCount = computed(() => momentosStore.uploadedImages.filter(img => img.isUploading).length)
const uploadStatusMessage = computed(() => {
  if (uploadingCount.value === 0) return ''
  return uploadingCount.value === 1
    ? 'Procesando 1 imagen...'
    : `Procesando ${uploadingCount.value} imagenes...`
})

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
  if (uploadingCount.value > 0) {
    missing.push(`${uploadingCount.value} ${uploadingCount.value === 1 ? 'imagen' : 'imágenes'} aún se están cargando`)
  }
  return missing
})

// Can proceed with warnings - false if ALL cells are empty (must have at least one image)
const canProceedWithWarnings = computed(() => {
  return momentosStore.filledCellCount > 0 && uploadingCount.value === 0
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

const historySaveKey = computed(() => ({
  format: momentosStore.format,
  imageCount: momentosStore.imageCount,
  posterSize: momentosStore.posterSize,
  hasMargin: momentosStore.hasMargin,
  marginColor: momentosStore.marginColor,
  frameStyleId: momentosStore.frameStyle?.id || null,
  cells: momentosStore.canvasCells.map(cell => ({
    imageId: cell.imageId,
    rotation: cell.rotation,
    zoom: cell.zoom,
    filter: cell.filter,
    panX: cell.panX,
    panY: cell.panY,
  })),
  imageUrls: momentosStore.uploadedImages.map(img =>
    img.mediumResUrl || img.lowResUrl || img.s3MediumResUrl || img.s3LowResUrl || ''
  ),
}))

const historyKey = computed(() => JSON.stringify(historySaveKey.value))

const isDirty = computed(() => {
  return lastSavedState.value !== historyKey.value
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

    const persistentState = momentosStore.getSnapshot()

    saveDesign(persistentState as MomentosState, thumbnail, getDesignName())
    lastSavedState.value = historyKey.value
  } catch (error) {
    console.error('[Momentos] Auto-save failed:', error)
  }
}

// Auto-save settings
const AUTOSAVE_KEY = 'studiomalek_autosave_momentos'

// Check mobile on mount and initialize cart
onMounted(async () => {
  // Check mobile FIRST so the UI renders correctly immediately
  const checkMobile = () => {
    isMobile.value = window.innerWidth < 768
  }
  checkMobile()
  window.addEventListener('resize', checkMobile)

  // Initialize Shopify cart, fetch momentos product variants, and warm up renderer (non-blocking for UI)
  // Warming up html-to-image early prevents slow first render during add-to-cart
  // Note: We use initCartOnly() to avoid fetching birth poster product (not needed here)
  Promise.all([
    cart.initCartOnly(),
    cart.fetchMomentosProduct(),
    warmup(),
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
  lastSavedState.value = historyKey.value

  // Save state for crash recovery
  const saveAutosave = () => {
    try {
      const snapshot = momentosStore.getSnapshot()
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(snapshot))
    } catch (e) {
      console.error('[Momentos] Failed to save autosave:', e)
    }
  }

  // Save to history on page unload (browser close/refresh)
  const handleBeforeUnload = () => {
    try {
      // Save raw state as backup for crash recovery
      saveAutosave()
    } catch (e) {
      console.error('[Momentos] Failed to save on unload:', e)
    }
  }

  // pagehide is more reliable than beforeunload on mobile Safari
  const handlePageHide = (e: PageTransitionEvent) => {
    // Only save if page is actually being unloaded (not just hidden for bfcache)
    if (!e.persisted) {
      saveAutosave()
    }
  }

  // visibilitychange fires when user switches tabs or minimizes - save proactively
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      saveAutosave()
    }
  }

  window.addEventListener('beforeunload', handleBeforeUnload)
  window.addEventListener('pagehide', handlePageHide)
  document.addEventListener('visibilitychange', handleVisibilityChange)

  onUnmounted(() => {
    window.removeEventListener('resize', checkMobile)
    window.removeEventListener('beforeunload', handleBeforeUnload)
    window.removeEventListener('pagehide', handlePageHide)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
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

// Desktop: Handle sidebar click - scroll to section if on diseño tab, or switch tabs
function handleDesktopSidebarSelect(panel: MomentosPanelType) {
  if (panel === 'archivos') {
    // Switch to imágenes tab
    momentosStore.setActiveDisenoTab('imagenes')
    return
  }

  // For diseno, medidas, marco - scroll to section (will switch to diseño tab if needed)
  if (panel === 'diseno' || panel === 'medidas' || panel === 'marco') {
    scrollablePanelRef.value?.scrollToSection(panel)
  }
}

// Desktop: Update active indicator when section comes into view
function handleSectionInView(section: 'diseno' | 'medidas' | 'marco') {
  activeSectionInView.value = section
}

// Computed: determine which panel to show as active in sidebar
const sidebarActivePanel = computed(() => {
  // When on imágenes tab, show archivos as active
  if (momentosStore.activeDisenoTab === 'imagenes') {
    return 'archivos' as MomentosPanelType
  }
  // When on diseño tab, map section to panel
  return activeSectionInView.value as MomentosPanelType
})

// Handle edit from missing elements modal - navigate to images tab
async function handleEditFromModal() {
  momentosStore.setActivePanel('diseno')
  momentosStore.setActiveDisenoTab('imagenes')
  if (isMobile.value) {
    await nextTick()
    isMobileSheetOpen.value = true
  }
}

// Handle empty cell click from canvas - open archivos panel on mobile
async function handleEmptyCellClick() {
  if (isMobile.value) {
    await nextTick()
    isMobileSheetOpen.value = true
  }
}

// Handle image assigned to cell - close mobile sheet
function handleImageAssigned() {
  if (isMobile.value) {
    isMobileSheetOpen.value = false
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

    // Success - save to history and open cart (only if images were assigned)
    if (hasContent.value) {
      const thumbnail = await generateThumbnail(canvasElement)
      saveDesign(momentosStore.getSnapshot() as MomentosState, thumbnail, getDesignName())
      lastSavedState.value = historyKey.value // Mark as saved
    }

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
          :active-panel="sidebarActivePanel"
          @select="handleDesktopSidebarSelect"
        />
      </aside>

      <!-- Design Panel (Desktop: Scrollable with tabs) -->
      <div v-if="!isMobile" class="momentos__panel-wrapper">
        <!-- Panel Content (scrollable with tabs) -->
        <MomentosDesignPanelWrapperScrollable
          ref="scrollablePanelRef"
          class="momentos__panel-content"
          @section-in-view="handleSectionInView"
          @image-assigned="handleImageAssigned"
        />

        <!-- Add to Cart Section (fixed at bottom) -->
      <MomentosAddToCartSection
        :price="pricing.price"
        :compare-at-price="pricing.compareAtPrice"
        :is-loading="uiStore.isLoading || isRendering"
        :status-message="uploadStatusMessage"
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
          <MomentosCanvas ref="canvasRef" @empty-cell-click="handleEmptyCellClick" />
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
      :status-message="uploadStatusMessage"
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
      <MomentosDesignPanelWrapper :active-panel="momentosStore.activePanel" @image-assigned="handleImageAssigned" />
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

    @include mobile {
      display: none;
    }
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

    @include mobile {
      display: none;
    }
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

    @include mobile {
      display: none;
    }
  }
}
</style>
