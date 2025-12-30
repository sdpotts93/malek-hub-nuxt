<script setup lang="ts">
import type { PanelType } from '~/types'

// Page meta
definePageMeta({
  layout: false,
})

useHead({
  title: 'Birth Poster - Studio Malek',
})

// Stores
const birthPosterStore = useBirthPosterStore()
const uiStore = useUIStore()

// Composables
const { isRendering, generateThumbnail } = useCanvasRenderer()
const { saveDesign, deleteDesign, designs } = useDesignHistory('birth-poster')
const cart = useShopifyCart()

// Canvas ref for rendering
const canvasRef = ref<{ $el: HTMLElement } | null>(null)

// Computed
const pricing = computed(() => cart.calculatePrice(birthPosterStore.$state))
const isMobile = ref(false)

// Track if design has been modified since last save
const lastSavedState = ref<string | null>(null)
const isDirty = computed(() => {
  const currentState = JSON.stringify(birthPosterStore.$state)
  return lastSavedState.value !== currentState
})

// Generate design name from baby names
function getDesignName(): string {
  const names = birthPosterStore.babies
    .map(b => b.nombre?.trim())
    .filter(Boolean)
  return names.length > 0 ? names.join(' & ') : 'Birth Poster'
}

// Save design to history (auto-save helper)
async function saveCurrentDesign() {
  const canvasElement = canvasRef.value?.$el
  if (!canvasElement || !isDirty.value) return

  try {
    const thumbnail = await generateThumbnail(canvasElement)
    saveDesign(birthPosterStore.$state, thumbnail, getDesignName())
    lastSavedState.value = JSON.stringify(birthPosterStore.$state)
  } catch (error) {
    console.error('[BirthPoster] Auto-save failed:', error)
  }
}

// Auto-save settings
const AUTOSAVE_KEY = 'studiomalek_autosave_birthposter'
const pendingHistorySave = ref(false)

// Check mobile on mount
onMounted(() => {
  // Restore from autosave if exists (from browser refresh/crash)
  try {
    const autosaved = localStorage.getItem(AUTOSAVE_KEY)
    if (autosaved) {
      const savedState = JSON.parse(autosaved)
      birthPosterStore.loadState(savedState)
      localStorage.removeItem(AUTOSAVE_KEY) // Clear after restore
      pendingHistorySave.value = true // Mark for saving to history once canvas is ready
    }
  } catch (e) {
    console.error('[BirthPoster] Failed to restore autosave:', e)
    localStorage.removeItem(AUTOSAVE_KEY)
  }

  // Store initial state to track changes
  lastSavedState.value = JSON.stringify(birthPosterStore.$state)

  // If we restored from autosave, save to history once canvas is ready
  if (pendingHistorySave.value) {
    nextTick(async () => {
      // Wait a bit for images to load
      await new Promise(resolve => setTimeout(resolve, 500))
      const canvasElement = canvasRef.value?.$el
      if (canvasElement) {
        try {
          const thumbnail = await generateThumbnail(canvasElement)
          saveDesign(birthPosterStore.$state, thumbnail, getDesignName())
          lastSavedState.value = JSON.stringify(birthPosterStore.$state)
        } catch (error) {
          console.error('[BirthPoster] Failed to save restored design:', error)
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
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(birthPosterStore.$state))
    } catch (e) {
      console.error('[BirthPoster] Failed to save on unload:', e)
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
const navItems: { id: PanelType; label: string; icon: string }[] = [
  { id: 'general', label: 'General', icon: 'settings' },
  { id: 'diseno', label: 'Diseño', icon: 'palette' },
  { id: 'datos', label: 'Datos', icon: 'text' },
  { id: 'medidas', label: 'Medidas', icon: 'ruler' },
  { id: 'marco', label: 'Marco', icon: 'frame' },
]

// Handle add to cart
async function handleAddToCart() {
  const canvasElement = canvasRef.value?.$el
  if (!canvasElement) return

  try {
    uiStore.setLoading(true)

    // Add to cart (validates, generates image, uploads to S3, adds to Shopify)
    const validation = await cart.addBirthPosterToCart(canvasElement, birthPosterStore.$state)

    // If validation failed, navigate to the missing data and show error
    if (validation) {
      // Navigate to datos panel
      birthPosterStore.setActivePanel('datos')

      // Switch to the baby tab with missing name and show error
      if (validation.missingBabyIndex !== null) {
        birthPosterStore.setActiveBabyTab(validation.missingBabyIndex)
        birthPosterStore.setNombreError(validation.missingBabyIndex)
      }
      return
    }

    // Success - save to history and open cart
    const thumbnail = await generateThumbnail(canvasElement)
    saveDesign(birthPosterStore.$state, thumbnail, getDesignName())
    lastSavedState.value = JSON.stringify(birthPosterStore.$state) // Mark as saved

    uiStore.openCart()
  } catch (error) {
    console.error('Error adding to cart:', error)
  } finally {
    uiStore.setLoading(false)
  }
}
</script>

<template>
  <div class="birth-poster tool-page">
    <!-- Header -->
    <SharedTheHeader />

    <!-- Main Content -->
    <main class="birth-poster__main">
      <!-- Desktop: Sidebar Navigation -->
      <aside v-if="!isMobile" class="birth-poster__sidebar">
        <BirthPosterSidebarNavigation
          :items="navItems"
          :active-panel="birthPosterStore.activePanel"
          @select="birthPosterStore.setActivePanel"
        />
      </aside>

      <!-- Design Panel -->
      <div v-if="!isMobile" class="birth-poster__panel-wrapper">
        <!-- Panel Content (scrollable) -->
        <div class="birth-poster__panel-content">
          <BirthPosterDesignPanelWrapper :active-panel="birthPosterStore.activePanel" />
        </div>

        <!-- Add to Cart Section (fixed at bottom) -->
        <BirthPosterAddToCartSection
          :price="pricing.price"
          :compare-at-price="pricing.compareAtPrice"
          :is-loading="uiStore.isLoading || isRendering"
          @add-to-cart="handleAddToCart"
        />
      </div>

      <!-- Canvas Area -->
      <div class="birth-poster__canvas-area">
        <div class="birth-poster__canvas-container">
          <BirthPosterBabyCanvas ref="canvasRef" />
        </div>
      </div>

      <!-- Desktop: History Panel -->
      <aside v-if="!isMobile" class="birth-poster__history">
        <BirthPosterHistoryPanel
          :designs="designs"
          :is-open="uiStore.isHistoryOpen"
          @toggle="uiStore.toggleHistory"
          @load="birthPosterStore.loadState"
          @delete="deleteDesign"
        />
      </aside>
    </main>

    <!-- Mobile: Fixed Add to Cart Bar -->
    <BirthPosterMobileAddToCartBar
      v-if="isMobile"
      :price="pricing.price"
      :compare-at-price="pricing.compareAtPrice"
      :is-loading="uiStore.isLoading || isRendering"
      @add-to-cart="handleAddToCart"
    />

    <!-- Mobile: Bottom Navbar -->
    <BirthPosterBottomNavbar
      v-if="isMobile"
      :items="navItems"
      :active-panel="birthPosterStore.activePanel"
      @select="birthPosterStore.setActivePanel"
    />

    <!-- Mobile: Bottom Sheet -->
    <BirthPosterMobileBottomSheet
      v-if="isMobile"
      :is-open="birthPosterStore.activePanel !== 'general'"
      @close="birthPosterStore.setActivePanel('general')"
    >
      <BirthPosterDesignPanelWrapper :active-panel="birthPosterStore.activePanel" />
    </BirthPosterMobileBottomSheet>

    <!-- Mobile Nav Wrapper (History/Home overlay) -->
    <BirthPosterMobileNavWrapper
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
.birth-poster {
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
