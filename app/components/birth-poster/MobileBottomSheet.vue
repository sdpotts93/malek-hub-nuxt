<script setup lang="ts">
interface Props {
  isOpen: boolean
}

defineProps<Props>()

// Touch handling for drag to close
const sheetRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const dragStartY = ref(0)
const currentTranslateY = ref(0)

function handleTouchStart(e: TouchEvent) {
  isDragging.value = true
  dragStartY.value = e.touches[0].clientY
  currentTranslateY.value = 0
}

function handleTouchMove(e: TouchEvent) {
  if (!isDragging.value) return

  const deltaY = e.touches[0].clientY - dragStartY.value
  if (deltaY > 0) {
    currentTranslateY.value = deltaY
  }
}

function handleTouchEnd() {
  isDragging.value = false
  // If dragged down more than 100px, could close
  // For now, just reset
  currentTranslateY.value = 0
}
</script>

<template>
  <Transition name="slide-up">
    <div
      v-if="isOpen"
      ref="sheetRef"
      class="mobile-bottom-sheet"
      :style="{
        transform: isDragging ? `translateY(${currentTranslateY}px)` : undefined
      }"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <!-- Drag handle -->
      <div class="mobile-bottom-sheet__handle">
        <div class="mobile-bottom-sheet__handle-bar" />
      </div>

      <!-- Header slot (for Add to Cart) -->
      <div class="mobile-bottom-sheet__header">
        <slot name="header" />
      </div>

      <!-- Content -->
      <div class="mobile-bottom-sheet__content">
        <slot />
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.mobile-bottom-sheet {
  position: fixed;
  bottom: $bottom-navbar-height;
  left: 0;
  right: 0;
  max-height: 60vh;
  background: $color-bg-primary;
  border-top-left-radius: $radius-2xl;
  border-top-right-radius: $radius-2xl;
  box-shadow: $shadow-xl;
  z-index: $z-fixed - 1;
  display: flex;
  flex-direction: column;
  touch-action: pan-y;
  transition: transform 0.15s ease-out;

  // Account for safe area
  padding-bottom: env(safe-area-inset-bottom, 0);

  &__handle {
    @include flex-center;
    padding: $space-lg 0;
    flex-shrink: 0;
  }

  &__handle-bar {
    width: 40px;
    height: 4px;
    background: $color-border;
    border-radius: $radius-full;
  }

  &__header {
    flex-shrink: 0;
    border-bottom: 1px solid $color-border;
  }

  &__content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    @include custom-scrollbar;
    padding: $space-xl;
  }
}
</style>
