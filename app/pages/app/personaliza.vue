<script setup lang="ts">
import type { PersonalizaPanelType } from '~/stores/personaliza'
import PersonalizaMobileEditorPanel from '~/components/personaliza/MobileEditorPanel.vue'
import type { PersonalizaState } from '~/types'
import { isBlobUrl } from '~/utils/imageUtils'

// Page meta
definePageMeta({
  layout: false,
})

const pageTitle = 'Personaliza - Studio Malek'
const pageDescription = 'Crea un poster personalizado con tu propia imagen con Studio Malek'

useHead({
  title: pageTitle,
})

useSeoMeta({
  title: pageTitle,
  description: pageDescription,
  ogTitle: pageTitle,
  ogDescription: pageDescription,
  ogUrl: 'https://creaciones.studiomalek.com/app/personaliza',
  ogImage: 'https://creaciones.studiomalek.com/personaliza-og.jpg',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  twitterTitle: pageTitle,
  twitterDescription: pageDescription,
  twitterImage: 'https://creaciones.studiomalek.com/personaliza-og.jpg',
})

// Stores
const personalizaStore = usePersonalizaStore()
const uiStore = useUIStore()
const route = useRoute()
const router = useRouter()

// Composables
const { isRendering, warmup } = useCanvasRenderer()
const { saveDesign, deleteDesign, designs } = useDesignHistory<PersonalizaState>('personaliza')
const cart = useShopifyCart()

// Canvas ref for rendering
const canvasRef = ref<{ $el: HTMLElement } | null>(null)

// Scrollable panel wrapper ref for desktop scroll navigation
const scrollablePanelRef = ref<{
  scrollToSection: (panel: PersonalizaPanelType) => void
  containerRef: HTMLElement | null
  openArchivoDialog?: () => void
} | null>(null)

// Active section in view (for desktop scroll mode)
const activeSectionInView = ref<PersonalizaPanelType>('archivo')

// Computed
const pricing = computed(() => cart.calculatePersonalizaPrice(personalizaStore.$state))

// Missing elements for cart warning modal
const missingElements = computed(() => {
  const missing: string[] = []
  // Check if no image at all (blocking)
  if (!personalizaStore.hasImage) {
    missing.push('No has subido ninguna imagen')
  }
  // Check if image has quality issues (warning, can proceed)
  else if (personalizaStore.showSizeWarning && !personalizaStore.sizeWarningAcknowledged) {
    missing.push('Tu imagen tiene una resolucion menor a la recomendada para el tamaño seleccionado.')
  }
  return missing
})

// Can only proceed if there's an image (low-res warning is just a warning)
const canProceed = computed(() => personalizaStore.hasImage)

const isMobile = ref(false)
const isMobileSheetOpen = ref(false)
const isMobileEditorOpen = ref(false)
const hasDismissedNoImageSheet = ref(false)
const archivoPanelRef = ref<{ openFileDialog: () => void } | null>(null)
const mobileStyleVars = computed<Record<string, string> | undefined>(() => {
  if (!isMobile.value) return undefined

  let canvasOffset = '88px'
  if (isMobileSheetOpen.value || !personalizaStore.hasImage) {
    canvasOffset = '0px'
  }

  return {
    '--personaliza-mobile-nav-height': '88px',
    '--personaliza-mobile-canvas-offset': canvasOffset,
  }
})

// Handle mobile panel selection
async function handleMobilePanelSelect(panel: PersonalizaPanelType) {
  if (!personalizaStore.hasImage) return
  personalizaStore.setActivePanel(panel)
  await nextTick()
  isMobileSheetOpen.value = false
  isMobileEditorOpen.value = true
}

function handleMobileSheetClose() {
  isMobileSheetOpen.value = false
  if (!personalizaStore.hasImage) {
    hasDismissedNoImageSheet.value = true
  }
}

function toggleMobileEditor() {
  if (!personalizaStore.hasImage) return
  const nextOpen = !isMobileEditorOpen.value
  isMobileEditorOpen.value = nextOpen
  if (nextOpen) {
    isMobileSheetOpen.value = false
  }
}

function closeMobileEditor() {
  isMobileEditorOpen.value = false
}

function openArchivoSheet() {
  personalizaStore.setActivePanel('archivo')
  isMobileSheetOpen.value = true
  hasDismissedNoImageSheet.value = false
}

async function openArchivoSheetAndSelect() {
  openArchivoSheet()
  await nextTick()
  archivoPanelRef.value?.openFileDialog()
}

async function triggerUploadFromQuery() {
  const uploadQuery = route.query.upload
  const shouldUpload = uploadQuery === '1' || uploadQuery === 'true'
  if (!shouldUpload) return
  if (personalizaStore.hasImage) {
    clearUploadQuery()
    return
  }

  if (isMobile.value) {
    await openArchivoSheetAndSelect()
  } else {
    // Desktop: scroll to archivo section and open file dialog
    scrollablePanelRef.value?.scrollToSection('archivo')
    await nextTick()
    scrollablePanelRef.value?.openArchivoDialog?.()
  }

  clearUploadQuery()
}

function clearUploadQuery() {
  const nextQuery = { ...route.query }
  delete nextQuery.upload
  router.replace({ query: nextQuery })
}

// Track if design has been modified since last save
// Use getSnapshot() to exclude transient properties (blob URLs, File, etc.)
const lastSavedState = ref<string | null>(null)
const isDirty = computed(() => {
  const currentState = JSON.stringify(personalizaStore.getSnapshot())
  return lastSavedState.value !== currentState
})

// Generate design name from title or subtitle
function getDesignName(): string {
  const title = personalizaStore.title?.trim()
  const subtitle = personalizaStore.subtitle?.trim()
  if (title) return title
  if (subtitle) return subtitle
  return 'Mi Poster'
}

// Handle loading a design from history
// Fetches S3 image and caches as blob for instant orientation changes
// Uses loadRequestId to handle race conditions when user rapidly switches designs
let loadRequestId = 0

async function handleLoadDesign(originalState: Partial<PersonalizaState>) {
  const thisRequestId = ++loadRequestId

  // Clone state to avoid mutating the saved design in history
  // (otherwise the blob URL we set gets revoked on next load, but history still references it)
  const state = { ...originalState }

  // If the design has an S3 URL, always fetch and cache as blob
  // Don't trust existing blob URLs - they may have been revoked
  const needsCache = !!state.imageS3Url

  if (needsCache) {
    try {
      const response = await fetch(state.imageS3Url!, { mode: 'cors' })

      // Check if a newer request was started while we were fetching
      if (thisRequestId !== loadRequestId) {
        return // Discard stale result
      }

      if (response.ok) {
        const blob = await response.blob()

        // Check again after blob conversion (could be slow for large images)
        if (thisRequestId !== loadRequestId) {
          return
        }

        state.imageUrl = URL.createObjectURL(blob)
      }
    } catch (error) {
      console.error('[Personaliza] Failed to cache S3 image as blob:', error)
    }
  }

  // Final check before loading state
  if (thisRequestId !== loadRequestId) {
    // Clean up orphaned blob if we created one
    if (state.imageUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(state.imageUrl)
    }
    return
  }

  personalizaStore.loadState(state)

  // If the design has an image, navigate to archivo panel so Cropper can regenerate
  if (state.imageS3Url || state.imageUrl) {
    if (isMobile.value) {
      personalizaStore.setActivePanel('archivo')
    } else {
      // Desktop: scroll to archivo section
      nextTick(() => {
        scrollablePanelRef.value?.scrollToSection('archivo')
      })
    }
  }
}

// Prepare state for persistence
// We save: imageS3Url (original) + cropCoordinates + all settings
// Cropped image is regenerated on load from original + coordinates
function prepareStateForPersistence(): Omit<PersonalizaState, 'imageFile' | 'croppedBlob' | 'croppedImageUrl' | 'isUploadingToS3'> | null {
  const snapshot = personalizaStore.getSnapshot()

  // Check if we have a persistent image URL
  if (!snapshot.imageS3Url) {
    console.error('[Personaliza] Cannot save: original image not uploaded to S3 yet')
    return null
  }

  // Clear the temporary blob URL for original image (S3 URL is in imageS3Url)
  snapshot.imageUrl = null

  return snapshot
}

// Save design to history (auto-save helper)
async function saveCurrentDesign() {
  const canvasElement = canvasRef.value?.$el
  // Don't save if no image uploaded or no changes
  if (!canvasElement || !isDirty.value || !personalizaStore.hasImage) return

  try {
    const thumbnail = await cart.generatePersonalizaThumbnail(canvasElement, personalizaStore.$state)
    const persistentState = prepareStateForPersistence()
    if (!persistentState) return

    saveDesign(persistentState, thumbnail, getDesignName())
    lastSavedState.value = JSON.stringify(personalizaStore.getSnapshot())
  } catch (error) {
    console.error('[Personaliza] Auto-save failed:', error)
  }
}

// Auto-save settings
const AUTOSAVE_KEY = 'studiomalek_autosave_personaliza'

// Track if we restored from autosave (needs thumbnail generation)
const restoredFromAutosave = ref(false)

// Watch for cropped image to become available after autosave restore
// Once ready, generate thumbnail and save to history (if not already saved)
watch(() => personalizaStore.croppedImageUrl, async (newUrl) => {
  if (!newUrl || !restoredFromAutosave.value) return

  // Clear flag immediately to prevent double execution
  // (croppedImageUrl may update multiple times during restore)
  restoredFromAutosave.value = false

  // Wait for next tick to ensure canvas is rendered
  await nextTick()

  const canvasElement = canvasRef.value?.$el
  if (!canvasElement) return

  // Only save if we have an S3 URL (persistent image)
  if (!personalizaStore.imageS3Url) return

  // Check if this design already exists in history (compare state)
  const currentStateJson = JSON.stringify(prepareStateForPersistence())
  const existingDesign = designs.value.find((d) => {
    // Compare the persistent state (excluding thumbnail and dates)
    return JSON.stringify(d.state) === currentStateJson
  })

  if (existingDesign) {
    // Design already exists in history, no need to save again
    console.log('[Personaliza] Design already exists in history, skipping save')
    lastSavedState.value = JSON.stringify(personalizaStore.getSnapshot())
    return
  }

  try {
    const thumbnail = await cart.generatePersonalizaThumbnail(canvasElement, personalizaStore.$state)
    const persistentState = prepareStateForPersistence()
    if (persistentState) {
      saveDesign(persistentState, thumbnail, getDesignName())
      lastSavedState.value = JSON.stringify(personalizaStore.getSnapshot())
      console.log('[Personaliza] Saved restored design to history with thumbnail')
    }
  } catch (error) {
    console.error('[Personaliza] Failed to save restored design:', error)
  }
})

// Event handlers defined at module level for cleanup
let checkMobile: (() => void) | null = null
let handleBeforeUnload: (() => void) | null = null
let handlePageHide: ((e: PageTransitionEvent) => void) | null = null
let handleVisibilityChange: (() => void) | null = null

// Register onUnmounted BEFORE onMounted to avoid lifecycle issues
onUnmounted(() => {
  // Remove event listeners with proper null guards
  const cm = checkMobile
  const hbu = handleBeforeUnload
  const hph = handlePageHide
  const hvc = handleVisibilityChange
  if (cm) window.removeEventListener('resize', cm)
  if (hbu) window.removeEventListener('beforeunload', hbu)
  if (hph) window.removeEventListener('pagehide', hph)
  if (hvc) document.removeEventListener('visibilitychange', hvc)
  // Save when navigating away within the app
  saveCurrentDesign()
})

// Check mobile on mount and initialize cart
onMounted(async () => {
  // Check mobile FIRST so the upload sheet shows immediately if needed
  checkMobile = () => {
    isMobile.value = window.innerWidth < 768
  }
  checkMobile()
  window.addEventListener('resize', checkMobile)

  // Initialize Shopify cart, fetch personaliza product variants, and warm up renderer
  // Warming up html-to-image early prevents slow first render during add-to-cart
  // Note: We use initCartOnly() to avoid fetching birth poster product (not needed here)
  await Promise.all([
    cart.initCartOnly(),
    cart.fetchPersonalizaProducts(),
    warmup(),
  ])

  // Restore from autosave if exists (from browser refresh/crash)
  try {
    const autosaved = localStorage.getItem(AUTOSAVE_KEY)
    if (autosaved) {
      const savedState = JSON.parse(autosaved)

      // Cache S3 image as blob for instant orientation changes (same as handleLoadDesign)
      const needsCache = savedState.imageS3Url && (!savedState.imageUrl || !savedState.imageUrl.startsWith('blob:'))
      if (needsCache) {
        try {
          const response = await fetch(savedState.imageS3Url, { mode: 'cors' })
          if (response.ok) {
            const blob = await response.blob()
            savedState.imageUrl = URL.createObjectURL(blob)
          }
        } catch (error) {
          console.error('[Personaliza] Failed to cache autosave image as blob:', error)
        }
      }

      personalizaStore.loadState(savedState)
      localStorage.removeItem(AUTOSAVE_KEY) // Clear after restore

      // Navigate to archivo panel if there's an image to restore
      // This ensures the Cropper mounts and regenerates the cropped preview
      if (savedState.imageS3Url || savedState.imageUrl) {
        // For mobile, set active panel. For desktop, scroll will be automatic since archivo is first
        personalizaStore.setActivePanel('archivo')
        // Mark that we need to generate thumbnail once image is ready
        restoredFromAutosave.value = true
      }
    }
  } catch (e) {
    console.error('[Personaliza] Failed to restore autosave:', e)
    localStorage.removeItem(AUTOSAVE_KEY)
  }

  // Store initial state to track changes (after autosave restore)
  lastSavedState.value = JSON.stringify(personalizaStore.getSnapshot())

  // Save state for crash recovery
  const saveAutosave = () => {
    try {
      const snapshot = personalizaStore.getSnapshot()
      // Clear blob URL since it won't work after page reload
      // (S3 URL in imageS3Url + cropCoordinates are preserved)
      if (isBlobUrl(snapshot.imageUrl)) {
        snapshot.imageUrl = null
      }
      // isImageReady will be restored when crop is regenerated on load
      snapshot.isImageReady = false
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(snapshot))
    } catch (e) {
      console.error('[Personaliza] Failed to save autosave:', e)
    }
  }

  // Auto-save on page unload (browser close/refresh)
  handleBeforeUnload = () => {
    saveAutosave()
  }

  // pagehide is more reliable than beforeunload on mobile Safari
  handlePageHide = (e: PageTransitionEvent) => {
    // Only save if page is actually being unloaded (not just hidden for bfcache)
    if (!e.persisted) {
      saveAutosave()
    }
  }

  // visibilitychange fires when user switches tabs or minimizes - save proactively
  handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      saveAutosave()
    }
  }

  window.addEventListener('beforeunload', handleBeforeUnload)
  window.addEventListener('pagehide', handlePageHide)
  document.addEventListener('visibilitychange', handleVisibilityChange)

  await nextTick()
  await triggerUploadFromQuery()
})

watch(
  [isMobile, () => personalizaStore.hasImage],
  ([isMobileValue, hasImage], [wasMobile, hadImage]) => {
    if (!isMobileValue) {
      isMobileSheetOpen.value = false
      isMobileEditorOpen.value = false
      if (personalizaStore.activePanel === 'margen') {
        personalizaStore.setActivePanel('texto')
      }
      return
    }

    if (!hasImage) {
      personalizaStore.setActivePanel('archivo')
      // Don't auto-open archivo sheet if there's history (user can load a saved design)
      if (!hasDismissedNoImageSheet.value && designs.value.length === 0) {
        isMobileSheetOpen.value = true
      }
      isMobileEditorOpen.value = false
      return
    }

    if (wasMobile && !hadImage && hasImage) {
      // Keep archivo sheet open after selecting an image so user can adjust crop/format
      hasDismissedNoImageSheet.value = false
    }

    if (personalizaStore.activePanel === 'margen' && !isMobileEditorOpen.value) {
      personalizaStore.setActivePanel('texto')
    }
  }
)

// Also save when navigating via Vue Router
onBeforeRouteLeave(async () => {
  await saveCurrentDesign()
  return true
})

// Panel navigation items
const navItemsDesktop: { id: PersonalizaPanelType; label: string; icon: string }[] = [
  { id: 'archivo', label: 'Archivo', icon: 'upload' },
  { id: 'margen', label: 'Margen', icon: 'margin' },
  { id: 'texto', label: 'Texto', icon: 'text' },
  { id: 'medidas', label: 'Medidas', icon: 'ruler' },
  { id: 'marco', label: 'Marco', icon: 'frame' },
]

const navItemsMobile: { id: PersonalizaPanelType; label: string; icon: string }[] = [
  { id: 'archivo', label: 'Archivo', icon: 'upload' },
  { id: 'margen', label: 'Margen', icon: 'margin' },
  { id: 'texto', label: 'Texto', icon: 'text' },
  { id: 'medidas', label: 'Medidas', icon: 'ruler' },
  { id: 'marco', label: 'Marco', icon: 'frame' },
]

// Desktop: Handle sidebar click as scroll navigation (bookmark mode)
function handleDesktopSidebarSelect(panel: PersonalizaPanelType) {
  scrollablePanelRef.value?.scrollToSection(panel)
}

// Desktop: Update active indicator when section comes into view
function handleSectionInView(panel: PersonalizaPanelType) {
  activeSectionInView.value = panel
}

// Handle edit from missing elements modal - navigate to archivo panel
async function handleEditFromModal() {
  if (isMobile.value) {
    personalizaStore.setActivePanel('archivo')
    await nextTick()
    isMobileEditorOpen.value = false
    isMobileSheetOpen.value = true
  } else {
    // Desktop: scroll to archivo section
    scrollablePanelRef.value?.scrollToSection('archivo')
  }
  // If there's a size warning, scroll to it
  if (personalizaStore.showSizeWarning && !personalizaStore.sizeWarningAcknowledged) {
    await nextTick()
    setTimeout(() => {
      personalizaStore.triggerScrollToWarning()
    }, 250)
  }
}

// Handle add to cart
async function handleAddToCart() {
  const canvasElement = canvasRef.value?.$el
  if (!canvasElement) return

  // Note: The "no image" blocking case is handled by the modal (canProceed=false).
  // This function is only called when user clicks "Continuar" after seeing the warning,
  // which means either there's no warning or the user accepted the low-res warning.

  // If there's a size warning and user is proceeding anyway (via "Continuar" in modal),
  // acknowledge it so the cart validation passes
  if (personalizaStore.showSizeWarning && !personalizaStore.sizeWarningAcknowledged) {
    personalizaStore.acknowledgeSizeWarning()
  }

  try {
    uiStore.setLoading(true)

    // Add to cart (validates, generates image, uploads to S3, adds to Shopify)
    await cart.addPersonalizaToCart(canvasElement, personalizaStore.$state)

    // Success - save to history and open cart (only if image was uploaded)
    if (personalizaStore.hasImage) {
      const thumbnail = await cart.generatePersonalizaThumbnail(canvasElement, personalizaStore.$state)
      saveDesign(personalizaStore.getSnapshot(), thumbnail, getDesignName())
      lastSavedState.value = JSON.stringify(personalizaStore.getSnapshot()) // Mark as saved
    }

    uiStore.openCart()
  } catch (error) {
    console.error('Error adding to cart:', error)
  } finally {
    uiStore.setLoading(false)
  }
}
</script>

<template>
  <div class="personaliza tool-page" :style="mobileStyleVars">
    <!-- Header -->
    <SharedTheHeader />

    <!-- Main Content -->
    <main class="personaliza__main">
      <!-- Desktop: Sidebar Navigation -->
      <aside v-if="!isMobile" class="personaliza__sidebar">
        <PersonalizaSidebarNavigation
          :items="navItemsDesktop"
          :active-panel="activeSectionInView"
          @select="handleDesktopSidebarSelect"
        />
      </aside>

      <!-- Design Panel (Desktop: Scrollable with all sections) -->
      <div v-if="!isMobile" class="personaliza__panel-wrapper">
        <!-- Panel Content (all sections stacked, scrollable) -->
        <PersonalizaDesignPanelWrapperScrollable
          ref="scrollablePanelRef"
          class="personaliza__panel-content"
          :show-margin-controls="false"
          @section-in-view="handleSectionInView"
        />

        <!-- Add to Cart Section (fixed at bottom) -->
        <PersonalizaAddToCartSection
          :price="pricing.price"
          :compare-at-price="pricing.compareAtPrice"
          :is-loading="uiStore.isLoading || isRendering"
          :missing-elements="missingElements"
          :can-proceed="canProceed"
          @add-to-cart="handleAddToCart"
          @edit="handleEditFromModal"
        />
      </div>

      <!-- Canvas Area -->
      <div class="personaliza__canvas-area">
        <div class="personaliza__canvas-container">
          <PersonalizaCanvas
            ref="canvasRef"
            :mobile-panel-open="isMobile && isMobileEditorOpen && !isMobileSheetOpen"
          />
        </div>
      </div>

      <!-- Desktop: History Panel -->
      <aside v-if="!isMobile" class="personaliza__history">
        <PersonalizaHistoryPanel
          :designs="designs"
          :is-open="uiStore.isHistoryOpen"
          @toggle="uiStore.toggleHistory"
          @load="handleLoadDesign"
          @delete="deleteDesign"
        />
      </aside>
    </main>

    <!-- Mobile: Inline Edit Panel -->
    <div
      v-if="isMobile && isMobileEditorOpen && !isMobileSheetOpen && personalizaStore.hasImage"
      class="personaliza__mobile-panel"
    >
      <div class="personaliza__mobile-panel-content">
        <PersonalizaMobileEditorPanel
          :active-panel="personalizaStore.activePanel"
          @change-image="openArchivoSheet"
        />
      </div>
    </div>

    <!-- Mobile: Floating Edit Button -->
    <button
      v-if="isMobile && personalizaStore.hasImage && !isMobileEditorOpen && !isMobileSheetOpen"
      type="button"
      class="personaliza__mobile-edit-button"
      aria-label="Editar"
      @click="toggleMobileEditor"
    >
      <span class="personaliza__mobile-edit-icon" aria-hidden="true">
        <img src="/personaliza-icons/icon/edit-icon.svg" alt="">
      </span>
    </button>

    <!-- Mobile: Fixed Add to Cart Bar -->
    <PersonalizaMobileAddToCartBar
      v-if="isMobile && !isMobileEditorOpen && !isMobileSheetOpen"
      :price="pricing.price"
      :compare-at-price="pricing.compareAtPrice"
      :has-image="personalizaStore.hasImage"
      :is-loading="uiStore.isLoading || isRendering"
      :missing-elements="missingElements"
      :can-proceed="canProceed"
      @add-to-cart="handleAddToCart"
      @edit="handleEditFromModal"
      @upload="openArchivoSheetAndSelect"
    />

    <!-- Mobile: Bottom Navbar -->
    <PersonalizaBottomNavbar
      v-if="isMobile && isMobileEditorOpen && !isMobileSheetOpen"
      :items="navItemsMobile"
      :active-panel="personalizaStore.activePanel"
      @select="handleMobilePanelSelect"
      @close="closeMobileEditor"
    />

    <!-- Mobile: Bottom Sheet -->
    <PersonalizaMobileBottomSheet
      v-if="isMobile"
      :is-open="isMobileSheetOpen"
      @close="handleMobileSheetClose"
    >
      <PersonalizaPanelsPanelArchivo
        ref="archivoPanelRef"
        show-continue-button
        @close="handleMobileSheetClose"
      />
    </PersonalizaMobileBottomSheet>

    <!-- Mobile Nav Wrapper (History/Home overlay) -->
    <PersonalizaMobileNavWrapper
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
.personaliza {
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
      height: calc(100% - var(--personaliza-mobile-canvas-offset, 136px));
      align-items: center;
    }

  }

  &__mobile-panel {
    position: fixed;
    left: 0;
    right: 0;
    bottom: var(--personaliza-mobile-nav-height, #{$bottom-navbar-height});
    background: #ffffff;
    border-top: 1px solid #f5f5f5;
    box-shadow: 0 -1px 3px rgba(10, 13, 18, 0.05);
    z-index: $z-fixed + 1;
    padding: 16px 24px;
  }

  &__mobile-panel-content {
    width: 100%;
  }

  &__mobile-edit-button {
    @include button-reset;
    position: fixed;
    bottom: 104px;
    right: 20px;
    width: 64px;
    height: 64px;
    border-radius: 100px;
    border: none;
    background: #ffffff;
    color: #414651;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
    z-index: $z-fixed + 3;
    transition: transform $transition-fast;

    &:active {
      transform: scale(0.98);
    }
  }

  &__mobile-edit-icon {
    display: flex;
    align-items: center;
    justify-content: center;

    img {
      width: 20px;
      height: 20px;
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
