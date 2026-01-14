<script setup lang="ts">
import type { SavedDesign } from '~/types'
import type { MomentosState } from '~/stores/momentos'

interface Props {
  designs: SavedDesign<MomentosState>[]
  isOpen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: true,
})

const emit = defineEmits<{
  toggle: []
  load: [state: Partial<MomentosState>]
  delete: [id: string]
}>()

const store = useMomentosStore()

// Track which design is currently loading
const loadingDesignId = ref<string | null>(null)

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  })
}

function handleLoad(design: SavedDesign<MomentosState>) {
  loadingDesignId.value = design.id
  emit('load', design.state)
  // Reset loading state after a short delay
  setTimeout(() => {
    loadingDesignId.value = null
  }, 500)
}

function handleDelete(e: Event, id: string) {
  e.stopPropagation()
  if (confirm('Eliminar este diseno?')) {
    emit('delete', id)
  }
}
</script>

<template>
  <div :class="['history-panel', { 'history-panel--collapsed': !isOpen }]">
    <!-- Header -->
    <div class="history-panel__header">
      <div class="history-panel__header-left">
        <button
          class="history-panel__toggle"
          :aria-expanded="isOpen"
          @click="emit('toggle')"
        >
          <!-- Chevron icon - rotates based on state -->
          <svg xmlns="http://www.w3.org/2000/svg" width="8" height="12" viewBox="0 0 8 12" fill="none">
            <path d="M1.5 1L6.5 6L1.5 11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <span v-if="isOpen" class="history-panel__title">Historial</span>
      </div>
      <div class="history-panel__header-right">
        <!-- Clock icon -->
        <svg xmlns="http://www.w3.org/2000/svg" :width="isOpen ? 16 : 20" :height="isOpen ? 16 : 20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      </div>
    </div>

    <!-- Content (Expanded) -->
    <div v-if="isOpen" class="history-panel__content">
      <!-- Empty state -->
      <div v-if="designs.length === 0" class="history-panel__empty">
        <p>No hay diseños guardados</p>
      </div>

      <!-- Design thumbnails -->
      <div v-else class="history-panel__list">
        <div
          v-for="design in designs"
          :key="design.id"
          class="history-panel__item"
          role="button"
          tabindex="0"
          @click="handleLoad(design)"
          @keydown.enter="handleLoad(design)"
          @keydown.space.prevent="handleLoad(design)"
        >
          <div class="history-panel__thumbnail">
            <!-- Use regular img for data URLs (base64), NuxtImg for remote URLs -->
            <img
              v-if="design.thumbnail"
              :src="design.thumbnail"
              :alt="design.name"
              loading="lazy"
            >
            <div v-else class="history-panel__placeholder" />
            <!-- Loading overlay -->
            <div v-if="loadingDesignId === design.id" class="history-panel__loading">
              <div class="history-panel__spinner" />
            </div>
          </div>

          <div class="history-panel__info">
            <span class="history-panel__name">{{ design.name }}</span>
            <span class="history-panel__date">{{ formatDate(design.updatedAt) }}</span>
          </div>

          <button
            class="history-panel__delete"
            aria-label="Eliminar"
            @click="(e) => handleDelete(e, design.id)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18"/>
              <path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Collapsed thumbnails -->
    <div v-else class="history-panel__collapsed-list">
      <button
        v-for="design in designs.slice(0, 8)"
        :key="design.id"
        class="history-panel__mini-thumb"
        @click="handleLoad(design)"
      >
        <!-- Use regular img for data URLs (base64) -->
        <img
          v-if="design.thumbnail"
          :src="design.thumbnail"
          :alt="design.name"
          loading="lazy"
        >
        <div v-else class="history-panel__placeholder" />
        <!-- Loading overlay -->
        <div v-if="loadingDesignId === design.id" class="history-panel__loading">
          <div class="history-panel__spinner" />
        </div>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.history-panel {
  position: absolute;
  top: $space-lg;
  right: $space-lg;
  bottom: $space-lg;
  display: flex;
  flex-direction: column;
  background: $color-bg-primary;
  border: 1px solid $color-border;
  border-radius: $radius-xl;
  box-shadow: 0 7px 21px rgba(51, 51, 51, 0.05);
  transition: width $transition-base;
  z-index: $z-sticky;

  // Expanded state - overlays to the left
  width: 320px;

  &--collapsed {
    width: 82px;
    gap: $space-4xl;

    .history-panel__header {
      // In collapsed state, stack toggle and clock icon
      flex-direction: row;
      justify-content: space-between;
      padding: $space-md;
    }

    .history-panel__header-left {
      gap: 0;
    }

    .history-panel__toggle {
      // Flip chevron for collapsed state (pointing left)
      svg {
        transform: rotate(180deg);
      }
    }
  }

  &__header {
    padding: $space-md;
    border-bottom: 1px solid #e6e7ea;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  &__header-left {
    display: flex;
    align-items: center;
    gap: $space-xl;
  }

  &__header-right {
    display: flex;
    align-items: center;
    color: $color-text-primary;
  }

  &__toggle {
    @include button-reset;
    @include flex-center;
    width: 32px;
    height: 32px;
    background: #f7f7f7;
    border-radius: $radius-sm;
    color: $color-brand;
    transition: background-color $transition-fast;

    @include hover {
      background: $color-bg-tertiary;
    }
  }

  &__title {
    font-family: $font-secondary;
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    color: $color-text-primary;
    line-height: 23px;
  }

  &__content {
    flex: 1;
    overflow-y: auto;
    @include custom-scrollbar;
    padding: $space-lg;
  }

  &__empty {
    @include flex-center;
    height: 100%;
    color: $color-text-muted;
    font-size: $font-size-sm;
    text-align: center;
    padding: $space-xl;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: $space-md;
  }

  &__item {
    @include button-reset;
    display: flex;
    align-items: center;
    gap: $space-md;
    padding: $space-md;
    border-radius: $radius-xl;
    background: $color-bg-secondary;
    text-align: left;
    transition: background-color $transition-fast;

    @include hover {
      background: $color-bg-tertiary;
    }
  }

  &__thumbnail {
    width: 68px;
    height: 68px;
    border-radius: $radius-xl;
    border: 1px solid $color-border-light;
    overflow: hidden;
    flex-shrink: 0;
    background: $color-bg-primary;
    position: relative;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__loading {
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__spinner {
    width: 24px;
    height: 24px;
    border: 2px solid $color-border;
    border-top-color: $color-brand;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  &__placeholder {
    width: 100%;
    height: 100%;
    background: $color-bg-tertiary;
  }

  &__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__name {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    @include text-truncate;
  }

  &__date {
    font-size: $font-size-xs;
    color: $color-text-muted;
  }

  &__delete {
    @include button-reset;
    @include flex-center;
    width: 24px;
    height: 24px;
    border-radius: $radius-md;
    color: $color-text-muted;
    opacity: 0;
    transition: opacity $transition-fast, color $transition-fast;

    .history-panel__item:hover & {
      opacity: 1;
    }

    @include hover {
      color: $color-error;
    }
  }

  &__collapsed-list {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $space-md;
    padding: 0 7px $space-lg;
    overflow-y: auto;
    @include hide-scrollbar;
  }

  &__mini-thumb {
    @include button-reset;
    width: 68px;
    height: 68px;
    border-radius: $radius-xl;
    border: 1px solid $color-border-light;
    overflow: hidden;
    background: $color-bg-primary;
    flex-shrink: 0;
    position: relative;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform $transition-fast;
    }

    @include hover {
      img {
        transform: scale(1.1);
      }
    }
  }
}
</style>
