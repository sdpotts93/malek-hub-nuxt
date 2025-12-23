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
        <!-- Add to Cart Section (always visible) -->
        <BirthPosterAddToCartSection
          :price="pricing.price"
          :compare-at-price="pricing.compareAtPrice"
          :is-loading="uiStore.isLoading || isRendering"
          @add-to-cart="handleAddToCart"
        />

        <!-- Panel Content -->
        <div class="birth-poster__panel-content">
          <BirthPosterDesignPanelWrapper :active-panel="birthPosterStore.activePanel" />
        </div>
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
    >
      <template #header>
        <BirthPosterAddToCartSection
          :price="pricing.price"
          :compare-at-price="pricing.compareAtPrice"
          :is-loading="uiStore.isLoading || isRendering"
          compact
          @add-to-cart="handleAddToCart"
        />
      </template>

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
    grid-template-columns: $sidebar-width $panel-width 1fr $history-width;
    overflow: hidden;

    @include desktop {
      grid-template-columns: $sidebar-width-collapsed $panel-width-md 1fr $history-width;
    }

    @include mobile {
      display: flex;
      flex-direction: column;
      grid-template-columns: none;
    }
  }

  &__sidebar {
    background: $color-bg-primary;
    border-right: 1px solid $color-border;
    display: flex;
    flex-direction: column;
    padding: $space-xl $space-lg;
  }

  &__panel-wrapper {
    background: $color-bg-primary;
    border-right: 1px solid $color-border;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  &__panel-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    @include custom-scrollbar;
  }

  &__canvas-area {
    background: $color-bg-secondary;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $space-3xl;
    overflow: hidden;

    @include mobile {
      flex: 1;
      padding: $space-xl;
    }
  }

  &__canvas-container {
    max-width: 100%;
    max-height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__history {
    background: $color-bg-primary;
    border-left: 1px solid $color-border;
    display: flex;
    flex-direction: column;
  }
}
</style>
