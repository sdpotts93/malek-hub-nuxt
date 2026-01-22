<script setup lang="ts">
interface Props {
  isOpen: boolean
}

defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

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
      :class="{ 'mobile-bottom-sheet--open': isOpen }"
    >
      <button class="mobile-bottom-sheet__close" type="button" aria-label="Cerrar" @click="emit('close')">
        <span class="mobile-bottom-sheet__close-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </button>

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
  border-radius: 16px 16px 0px 0px;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: auto;
  max-height: 100dvh;
  background: $color-bg-primary;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  z-index: $z-fixed + 1;
  display: flex;
  flex-direction: column;
  will-change: transform;
  // Start off-screen (slid down)
  transform: translateY(100%);
  visibility: hidden;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.3s ease;

  &--open {
    transform: translateY(0);
    visibility: visible;
  }

  &__close {
    @include button-reset;
    position: absolute;
    top: 16px;
    right: 16px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #f5f5f5;
    color: $color-text-primary;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
  }

  &__content {
    flex: 0 1 auto;
    overflow-y: auto;
    overflow-x: hidden;
    @include custom-scrollbar;
    padding: $space-xl;
    padding-inline: 0;
    padding-top: 64px;
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
