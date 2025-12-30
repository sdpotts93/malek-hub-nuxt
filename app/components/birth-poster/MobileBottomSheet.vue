<script setup lang="ts">
interface Props {
  isOpen: boolean
}

defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

// Touch handling for drag to close
const sheetRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const dragStartY = ref(0)
const currentTranslateY = ref(0)

const CLOSE_THRESHOLD = 100 // pixels to drag before closing

function handleTouchStart(e: TouchEvent) {
  const touch = e.touches[0]
  if (!touch) return
  isDragging.value = true
  dragStartY.value = touch.clientY
  currentTranslateY.value = 0
}

function handleTouchMove(e: TouchEvent) {
  if (!isDragging.value) return

  const touch = e.touches[0]
  if (!touch) return

  const deltaY = touch.clientY - dragStartY.value
  // Only allow dragging down (positive deltaY)
  if (deltaY > 0) {
    currentTranslateY.value = deltaY
  }
}

function handleTouchEnd() {
  isDragging.value = false

  // If dragged down more than threshold, close the sheet
  if (currentTranslateY.value > CLOSE_THRESHOLD) {
    emit('close')
  }

  // Reset position
  currentTranslateY.value = 0
}

function handleOverlayClick() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <!-- Overlay -->
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="mobile-bottom-sheet-overlay"
        @click="handleOverlayClick"
      />
    </Transition>

    <!-- Sheet -->
    <Transition name="slide-up">
      <div
        v-if="isOpen"
        ref="sheetRef"
        class="mobile-bottom-sheet"
        :class="{ 'mobile-bottom-sheet--dragging': isDragging }"
        :style="{
          transform: isDragging ? `translateY(${currentTranslateY}px)` : undefined
        }"
      >
        <!-- Drag handle area -->
        <div
          class="mobile-bottom-sheet__handle"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
          @touchend="handleTouchEnd"
        >
          <div class="mobile-bottom-sheet__handle-bar" />
        </div>

        <!-- Content -->
        <div class="mobile-bottom-sheet__content">
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.mobile-bottom-sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: $z-fixed;
  // Account for bottom navbar + cart bar
  bottom: calc(#{$bottom-navbar-height} + #{$mobile-cart-bar-height});
}

.mobile-bottom-sheet {
  position: fixed;
  // Position above bottom navbar + cart bar
  bottom: calc(#{$bottom-navbar-height} + #{$mobile-cart-bar-height});
  left: 0;
  right: 0;
  max-height: 55vh;
  background: $color-bg-primary;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  z-index: $z-fixed + 1;
  display: flex;
  flex-direction: column;
  touch-action: pan-y;
  will-change: transform;

  &--dragging {
    transition: none;
  }

  &:not(&--dragging) {
    transition: transform 0.2s ease-out;
  }

  &__handle {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: $space-lg 0;
    flex-shrink: 0;
    cursor: grab;

    &:active {
      cursor: grabbing;
    }
  }

  &__handle-bar {
    width: 93px;
    height: 6px;
    background: #d9d9d9;
    border-radius: 100px;
  }

  &__content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    @include custom-scrollbar;
    padding: $space-xl;
  }
}

// Overlay fade animation
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// Slide up animation
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.slide-up-enter-to,
.slide-up-leave-from {
  transform: translateY(0);
  opacity: 1;
}
</style>
