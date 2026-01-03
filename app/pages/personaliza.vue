<script setup lang="ts">
import type { PersonalizaPanelType } from '~/stores/personaliza'
import type { PersonalizaState } from '~/types'

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
const lastSavedState = ref<string | null>(null)
const isDirty = computed(() => {
  const currentState = JSON.stringify(personalizaStore.$state)
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

// Save design to history (auto-save helper)
async function saveCurrentDesign() {
  const canvasElement = canvasRef.value?.$el
  // Don't save if no image uploaded or no changes
  if (!canvasElement || !isDirty.value || !personalizaStore.hasImage) return

  try {
    const thumbnail = await generateThumbnail(canvasElement)
    saveDesign(personalizaStore.getSnapshot(), thumbnail, getDesignName())
    lastSavedState.value = JSON.stringify(personalizaStore.$state)
  } catch (error) {
    console.error('[Personaliza] Auto-save failed:', error)
  }
}

// Auto-save settings
const AUTOSAVE_KEY = 'studiomalek_autosave_personaliza'
const pendingHistorySave = ref(false)

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
      pendingHistorySave.value = true // Mark for saving to history once canvas is ready
    }
  } catch (e) {
    console.error('[Personaliza] Failed to restore autosave:', e)
    localStorage.removeItem(AUTOSAVE_KEY)
  }

  // Store initial state to track changes
  lastSavedState.value = JSON.stringify(personalizaStore.$state)

  // If we restored from autosave, save to history once canvas is ready (only if has image)
  if (pendingHistorySave.value) {
    nextTick(async () => {
      // Wait a bit for images to load
      await new Promise(resolve => setTimeout(resolve, 500))
      const canvasElement = canvasRef.value?.$el
      // Only save to history if an image has been uploaded
      if (canvasElement && personalizaStore.hasImage) {
        try {
          const thumbnail = await generateThumbnail(canvasElement)
          saveDesign(personalizaStore.getSnapshot(), thumbnail, getDesignName())
          lastSavedState.value = JSON.stringify(personalizaStore.$state)
        } catch (error) {
          console.error('[Personaliza] Failed to save restored design:', error)
        }
      }
      pendingHistorySave.value = false
    })
  }

  const checkMobile = () => {
    isMobile.value = window.innerWidth < 768
  }
  checkMobile()
  window.addEventListener('resize', checkMobile)

  // Auto-save on page unload (browser close/refresh)
  // Always save state - cheaper to save unnecessarily than to lose user work
  const handleBeforeUnload = () => {
    try {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(personalizaStore.getSnapshot()))
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

// Handle add to cart
async function handleAddToCart() {
  const canvasElement = canvasRef.value?.$el
  if (!canvasElement) return

  // Check if image is ready
  if (!personalizaStore.isImageReady) {
    // Navigate to archivo panel
    personalizaStore.setActivePanel('archivo')
    if (isMobile.value) {
      await nextTick()
      isMobileSheetOpen.value = true
    }
    return
  }

  // Check size warning
  if (personalizaStore.showSizeWarning && !personalizaStore.sizeWarningAcknowledged) {
    // Navigate to archivo panel to show the warning
    personalizaStore.setActivePanel('archivo')
    if (isMobile.value) {
      await nextTick()
      isMobileSheetOpen.value = true
    }
    return
  }

  try {
    uiStore.setLoading(true)

    // Add to cart (validates, generates image, uploads to S3, adds to Shopify)
    await cart.addPersonalizaToCart(canvasElement, personalizaStore.$state)

    // Success - save to history and open cart
    const thumbnail = await generateThumbnail(canvasElement)
    saveDesign(personalizaStore.getSnapshot(), thumbnail, getDesignName())
    lastSavedState.value = JSON.stringify(personalizaStore.$state) // Mark as saved

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
          @add-to-cart="handleAddToCart"
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
          @load="personalizaStore.loadState"
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
      @add-to-cart="handleAddToCart"
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
