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
const { isRendering } = useCanvasRenderer()
const { saveDesign, designs } = useDesignHistory('birth-poster')
const { addBirthPosterToCart, formatPrice, calculateBirthPosterPrice } = useShopifyCart()

// Canvas ref for rendering
const canvasRef = ref<HTMLElement | null>(null)

// Computed
const pricing = computed(() => calculateBirthPosterPrice(birthPosterStore.$state))
const isMobile = ref(false)

// Check mobile on mount
onMounted(() => {
  const checkMobile = () => {
    isMobile.value = window.innerWidth < 768
  }
  checkMobile()
  window.addEventListener('resize', checkMobile)
  onUnmounted(() => window.removeEventListener('resize', checkMobile))
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
  if (!canvasRef.value) return

  try {
    uiStore.setLoading(true)

    // Generate thumbnail
    const { generateThumbnail } = useCanvasRenderer()
    const thumbnail = await generateThumbnail(canvasRef.value)

    // Save to history
    saveDesign(birthPosterStore.$state, thumbnail)

    // Add to cart
    await addBirthPosterToCart(birthPosterStore.$state, thumbnail)

    // Open cart
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
    }
  }

  &__canvas-container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    container-type: size;
  }

  &__history {
    position: relative;
    width: 106px; // Fixed width: 82px panel + 24px margin
    background: $color-canvas;
    flex-shrink: 0;
  }
}
</style>
