<script setup lang="ts">
import type { SavedDesign, BirthPosterState } from '~/types'

interface Props {
  designs: SavedDesign[]
  isOpen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: true,
})

const emit = defineEmits<{
  toggle: []
  load: [state: BirthPosterState]
}>()

const { deleteDesign } = useDesignHistory('birth-poster')

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  })
}

function handleLoad(design: SavedDesign) {
  emit('load', design.state)
}

function handleDelete(e: Event, id: string) {
  e.stopPropagation()
  if (confirm('¿Eliminar este diseño?')) {
    deleteDesign(id)
  }
}
</script>

<template>
  <div :class="['history-panel', { 'history-panel--collapsed': !isOpen }]">
    <!-- Header -->
    <div class="history-panel__header">
      <button
        class="history-panel__toggle"
        :aria-expanded="isOpen"
        @click="emit('toggle')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        <span v-if="isOpen">Historial</span>
      </button>
    </div>

    <!-- Content -->
    <div v-if="isOpen" class="history-panel__content">
      <!-- Empty state -->
      <div v-if="designs.length === 0" class="history-panel__empty">
        <p>No hay diseños guardados</p>
      </div>

      <!-- Design thumbnails -->
      <div v-else class="history-panel__list">
        <button
          v-for="design in designs"
          :key="design.id"
          class="history-panel__item"
          @click="handleLoad(design)"
        >
          <div class="history-panel__thumbnail">
            <NuxtImg
              v-if="design.thumbnail"
              :src="design.thumbnail"
              :alt="design.name"
              width="80"
              height="100"
            />
            <div v-else class="history-panel__placeholder" />
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
        </button>
      </div>
    </div>

    <!-- Collapsed thumbnails -->
    <div v-else class="history-panel__collapsed-list">
      <button
        v-for="design in designs.slice(0, 4)"
        :key="design.id"
        class="history-panel__mini-thumb"
        @click="handleLoad(design)"
      >
        <NuxtImg
          v-if="design.thumbnail"
          :src="design.thumbnail"
          :alt="design.name"
          width="40"
          height="50"
        />
        <div v-else class="history-panel__placeholder" />
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.history-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: width $transition-base;

  &--collapsed {
    width: 60px;

    .history-panel__header {
      justify-content: center;
    }
  }

  &__header {
    padding: $space-xl $space-lg;
    border-bottom: 1px solid $color-border;
    display: flex;
    align-items: center;
  }

  &__toggle {
    @include button-reset;
    display: flex;
    align-items: center;
    gap: $space-md;
    padding: $space-md;
    border-radius: $radius-md;
    color: $color-text-secondary;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;

    @include hover {
      background: $color-bg-tertiary;
      color: $color-text-primary;
    }
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
    border-radius: $radius-lg;
    background: $color-bg-secondary;
    text-align: left;
    transition: background-color $transition-fast;

    @include hover {
      background: $color-bg-tertiary;
    }
  }

  &__thumbnail {
    width: 48px;
    height: 60px;
    border-radius: $radius-md;
    overflow: hidden;
    flex-shrink: 0;
    background: $color-bg-tertiary;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
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
    padding: $space-lg $space-md;
    overflow-y: auto;
    @include hide-scrollbar;
  }

  &__mini-thumb {
    @include button-reset;
    width: 40px;
    height: 50px;
    border-radius: $radius-md;
    overflow: hidden;
    background: $color-bg-tertiary;
    flex-shrink: 0;
    transition: transform $transition-fast;

    @include hover {
      transform: scale(1.1);
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
}
</style>
