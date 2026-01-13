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

// Cached thumbnail for history saves (updated periodically)
const cachedThumbnail = ref<string | null>(null)
const thumbnailCacheTimer = ref<ReturnType<typeof setTimeout> | null>(null)

// Computed
const pricing = computed(() => cart.calculateMomentosPrice(momentosStore.$state))

// Missing elements for cart warning modal
const missingElements = computed(() => {
  const missing: string[] = []
  const emptyCells = momentosStore.emptyCellCount
  if (emptyCells > 0) {
    missing.push(`${emptyCells} ${emptyCells === 1 ? 'espacio vacío' : 'espacios vacíos'} en el collage`)
  }
  return missing
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

// Check if there's any meaningful content to save (at least one image in library or on canvas)
const hasContent = computed(() => {
  return momentosStore.uploadedImages.length > 0 || momentosStore.filledCellCount > 0
})

// Check if images are ready for thumbnail generation
// We only need images that are ON the canvas to be ready (not uploading)
// Blob URLs are fine - useCanvasRenderer converts them to data URLs
const imagesReadyForThumbnail = computed(() => {
  // Get image IDs that are actually used on the canvas
  const usedImageIds = new Set(
    momentosStore.canvasCells
      .filter(cell => cell.imageId)
      .map(cell => cell.imageId)
  )

  if (usedImageIds.size === 0) return false

  // Only check images that are on the canvas
  return momentosStore.uploadedImages
    .filter(img => usedImageIds.has(img.id))
    .every(img =>
      !img.isUploading &&
      (img.mediumResUrl || img.s3MediumResUrl) // Either blob URL or S3 URL is fine
    )
})

// Update cached thumbnail (debounced) - only caches, doesn't save to history
// History is saved on: navigation away, page reload, and add-to-cart
async function updateCachedThumbnail() {
  const canvasElement = canvasRef.value?.$el

  if (!canvasElement) {
    return
  }

  if (!hasContent.value) {
    return
  }

  // Only generate thumbnail when images on canvas are ready (not uploading)
  if (!imagesReadyForThumbnail.value) {
    return
  }

  try {
    cachedThumbnail.value = await generateThumbnail(canvasElement)
  } catch (error) {
    console.error('[Momentos] Failed to cache thumbnail:', error)
  }
}

// Debounced thumbnail update - called when canvas changes
function scheduleThumbnailUpdate() {
  if (thumbnailCacheTimer.value) {
    clearTimeout(thumbnailCacheTimer.value)
  }
  // Update thumbnail 2 seconds after last change
  thumbnailCacheTimer.value = setTimeout(updateCachedThumbnail, 2000)
}

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

// Save design to history (used on navigation away and unmount)
async function saveCurrentDesign(useCachedThumbnail = false) {
  const canvasElement = canvasRef.value?.$el
  // Don't save if no content or no changes
  if (!canvasElement || !isDirty.value || !hasContent.value) return

  try {
    // Use cached thumbnail if available and requested, otherwise generate new one
    const thumbnail = useCachedThumbnail && cachedThumbnail.value
      ? cachedThumbnail.value
      : await generateThumbnail(canvasElement)

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

  try {
    const persistentState = momentosStore.getSnapshot()
    // Use cached thumbnail or empty string (will show placeholder in history)
    const thumbnail = cachedThumbnail.value || ''

    // Save even without thumbnail - the design state is more important
    saveDesign(persistentState as MomentosState, thumbnail, getDesignName())
    lastSavedState.value = JSON.stringify(persistentState)
    console.log('[Momentos] Saved to history on unload')
  } catch (error) {
    console.error('[Momentos] Sync save failed:', error)
  }
}

// Auto-save settings
const AUTOSAVE_KEY = 'studiomalek_autosave_momentos'

// Watch for canvas changes to keep thumbnail cached (for save on navigation)
watch(
  () => [
    momentosStore.canvasCells,
    momentosStore.uploadedImages,
    momentosStore.hasMargin,
    momentosStore.marginColor,
    momentosStore.format,
    momentosStore.imageCount,
  ],
  () => {
    scheduleThumbnailUpdate()
  },
  { deep: true }
)

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

  // Generate initial thumbnail cache if there's content (for save on navigation)
  if (hasContent.value) {
    setTimeout(updateCachedThumbnail, 500)
  }

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
    // Clear thumbnail cache timer
    if (thumbnailCacheTimer.value) {
      clearTimeout(thumbnailCacheTimer.value)
    }
    // Save to history when navigating away within the app
    saveCurrentDesign(true) // Use cached thumbnail
  })
})

// Save to history when navigating via Vue Router
onBeforeRouteLeave(async () => {
  await saveCurrentDesign(true) // Use cached thumbnail
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
          @add-to-cart="handleAddToCart"
          @edit="handleEditFromModal"
        />
      </div>

      <!-- Canvas Area -->
      <div class="momentos__canvas-area">
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
