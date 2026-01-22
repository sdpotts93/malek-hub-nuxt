<script setup lang="ts">
interface Props {
  isOpen: boolean
}

defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

// Touch handling for drag to close
const isDragging = ref(false)
const dragStartY = ref(0)
const currentTranslateY = ref(0)

const CLOSE_THRESHOLD = 100 // pixels to drag before closing

function handleTouchStart(e: TouchEvent) {
  const touch = e.touches[0]
  if (!touch) return
  // Prevent pull-to-refresh
  e.preventDefault()
  isDragging.value = true
  dragStartY.value = touch.clientY
  currentTranslateY.value = 0
}

function handleTouchMove(e: TouchEvent) {
  if (!isDragging.value) return
  // Prevent pull-to-refresh
  e.preventDefault()

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
    <div
      class="mobile-bottom-sheet-overlay"
      :class="{ 'mobile-bottom-sheet-overlay--visible': isOpen }"
      @click="handleOverlayClick"
    />

    <!-- Sheet - always in DOM, controlled by CSS transform -->
    <div
      class="mobile-bottom-sheet"
      :class="{
        'mobile-bottom-sheet--open': isOpen,
        'mobile-bottom-sheet--dragging': isDragging
      }"
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
  </Teleport>
</template>

<style lang="scss" scoped>
.mobile-bottom-sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  z-index: $z-fixed;
  // Start invisible
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.25s ease, visibility 0.25s ease;

  &--visible {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
  }
}

.mobile-bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  // Fixed height to prevent resizing when switching tabs
  height: calc(55vh + 70px);
  background: $color-bg-primary;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  z-index: $z-fixed + 1;
  display: flex;
  flex-direction: column;
  touch-action: pan-y;
  will-change: transform;
  // Start off-screen (slid down)
  transform: translateY(100%);
  visibility: hidden;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.3s ease;

  &--open {
    transform: translateY(0);
    visibility: visible;
  }

  &--dragging {
    transition: none !important;
  }

  &__handle {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 16px 0 32px;
    flex-shrink: 0;
    cursor: grab;
    // Prevent browser gestures (pull-to-refresh) on drag handle
    touch-action: none;

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
    padding-inline: 0;
    // Hide content when sheet is closed to prevent showing old panel on reopen
    opacity: 0;
    transition: opacity 0.15s ease;
    @include mobile {
      padding-top: 0;
    }
  }

  &--open &__content {
    opacity: 1;
    transition: opacity 0.2s ease 0.1s; // Slight delay so sheet slides up first
  }
}
</style>
