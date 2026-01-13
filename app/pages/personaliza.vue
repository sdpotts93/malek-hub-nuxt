<script setup lang="ts">
import type { PersonalizaPanelType } from '~/stores/personaliza'
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
  ogUrl: 'https://hub.studiomalek.com/personaliza',
  ogImage: '/og-image.jpg',
})

// Stores
const personalizaStore = usePersonalizaStore()
const uiStore = useUIStore()

// Composables
const { isRendering, generateThumbnail } = useCanvasRenderer()
const { saveDesign, deleteDesign, designs } = useDesignHistory<PersonalizaState>('personaliza')
const cart = useShopifyCart()

// Canvas ref for rendering
const canvasRef = ref<{ $el: HTMLElement } | null>(null)

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
    missing.push('Tu imagen tiene una resolucion menor a la recomendada para el tamano seleccionado.')
  }
  return missing
})

// Can only proceed if there's an image (low-res warning is just a warning)
const canProceed = computed(() => personalizaStore.hasImage)

const isMobile = ref(false)
const isMobileSheetOpen = ref(false)

// Handle mobile panel selection
async function handleMobilePanelSelect(panel: PersonalizaPanelType) {
  personalizaStore.setActivePanel(panel)
  // Wait for Vue to render the new panel before opening the sheet
  await nextTick()
  isMobileSheetOpen.value = true
}

function handleMobileSheetClose() {
  isMobileSheetOpen.value = false
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
// Navigate to archivo panel to ensure Cropper regenerates the cropped image
function handleLoadDesign(state: Partial<PersonalizaState>) {
  personalizaStore.loadState(state)

  // If the design has an image, navigate to archivo panel so Cropper can regenerate
  if (state.imageS3Url || state.imageUrl) {
    personalizaStore.setActivePanel('archivo')
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
    const thumbnail = await generateThumbnail(canvasElement)
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
    const thumbnail = await generateThumbnail(canvasElement)
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

// Check mobile on mount and initialize cart
onMounted(async () => {
  // Initialize Shopify cart and fetch personaliza product variants
  await Promise.all([
    cart.init(),
    cart.fetchPersonalizaProducts(),
  ])

  // Restore from autosave if exists (from browser refresh/crash)
  try {
    const autosaved = localStorage.getItem(AUTOSAVE_KEY)
    if (autosaved) {
      const savedState = JSON.parse(autosaved)
      personalizaStore.loadState(savedState)
      localStorage.removeItem(AUTOSAVE_KEY) // Clear after restore

      // Navigate to archivo panel if there's an image to restore
      // This ensures the Cropper mounts and regenerates the cropped preview
      if (savedState.imageS3Url || savedState.imageUrl) {
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

  const checkMobile = () => {
    isMobile.value = window.innerWidth < 768
  }
  checkMobile()
  window.addEventListener('resize', checkMobile)

  // Auto-save on page unload (browser close/refresh)
  // Note: This is synchronous, so we can't convert blob URLs here
  // The image will need to be re-uploaded if user returns after browser close
  // But other settings (format, size, text, etc.) will be preserved
  const handleBeforeUnload = () => {
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
      console.error('[Personaliza] Failed to save on unload:', e)
    }
  }
  window.addEventListener('beforeunload', handleBeforeUnload)

  onUnmounted(() => {
    window.removeEventListener('resize', checkMobile)
    window.removeEventListener('beforeunload', handleBeforeUnload)
    // Save when navigating away within the app
    saveCurrentDesign()
  })
})

// Also save when navigating via Vue Router
onBeforeRouteLeave(async () => {
  await saveCurrentDesign()
  return true
})

// Panel navigation items
const navItems: { id: PersonalizaPanelType; label: string; icon: string }[] = [
  { id: 'archivo', label: 'Archivo', icon: 'upload' },
  { id: 'texto', label: 'Texto', icon: 'text' },
  { id: 'medidas', label: 'Medidas', icon: 'ruler' },
  { id: 'marco', label: 'Marco', icon: 'frame' },
]

// Handle edit from missing elements modal - navigate to archivo panel
async function handleEditFromModal() {
  personalizaStore.setActivePanel('archivo')
  if (isMobile.value) {
    await nextTick()
    isMobileSheetOpen.value = true
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

    // Success - save to history and open cart
    const thumbnail = await generateThumbnail(canvasElement)
    saveDesign(personalizaStore.getSnapshot(), thumbnail, getDesignName())
    lastSavedState.value = JSON.stringify(personalizaStore.getSnapshot()) // Mark as saved

    uiStore.openCart()
  } catch (error) {
    console.error('Error adding to cart:', error)
  } finally {
    uiStore.setLoading(false)
  }
}
</script>

<template>
  <div class="personaliza tool-page">
    <!-- Header -->
    <SharedTheHeader />

    <!-- Main Content -->
    <main class="personaliza__main">
      <!-- Desktop: Sidebar Navigation -->
      <aside v-if="!isMobile" class="personaliza__sidebar">
        <PersonalizaSidebarNavigation
          :items="navItems"
          :active-panel="personalizaStore.activePanel"
          @select="personalizaStore.setActivePanel"
        />
      </aside>

      <!-- Design Panel -->
      <div v-if="!isMobile" class="personaliza__panel-wrapper">
        <!-- Panel Content (scrollable) -->
        <div class="personaliza__panel-content">
          <PersonalizaDesignPanelWrapper :active-panel="personalizaStore.activePanel" />
        </div>

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
          <PersonalizaCanvas ref="canvasRef" />
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

    <!-- Mobile: Fixed Add to Cart Bar -->
    <PersonalizaMobileAddToCartBar
      v-if="isMobile"
      :price="pricing.price"
      :compare-at-price="pricing.compareAtPrice"
      :is-loading="uiStore.isLoading || isRendering"
      :missing-elements="missingElements"
      :can-proceed="canProceed"
      @add-to-cart="handleAddToCart"
      @edit="handleEditFromModal"
    />

    <!-- Mobile: Bottom Navbar -->
    <PersonalizaBottomNavbar
      v-if="isMobile"
      :items="navItems"
      :active-panel="isMobileSheetOpen ? personalizaStore.activePanel : null"
      @select="handleMobilePanelSelect"
    />

    <!-- Mobile: Bottom Sheet -->
    <PersonalizaMobileBottomSheet
      v-if="isMobile"
      :is-open="isMobileSheetOpen"
      @close="handleMobileSheetClose"
    >
      <PersonalizaDesignPanelWrapper :active-panel="personalizaStore.activePanel" />
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
