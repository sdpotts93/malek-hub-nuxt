<script setup lang="ts">
import type { SavedDesign } from '~/types'

interface Props {
  isOpen: boolean
  content: 'history' | 'home' | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const store = useBirthPosterStore()
const { designs, deleteDesign } = useDesignHistory('birth-poster')

// Navigation items for home
const navItems = [
  { name: 'Personaliza', href: '/personaliza', icon: 'palette' },
  { name: 'Birth Poster', href: '/birth-poster', icon: 'baby', active: true },
  { name: 'Momentos', href: '/moments', icon: 'image' },
]

// Touch handling for drag to close
const isDragging = ref(false)
const dragStartY = ref(0)
const currentTranslateY = ref(0)
const CLOSE_THRESHOLD = 100

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
  if (deltaY > 0) {
    currentTranslateY.value = deltaY
  }
}

function handleTouchEnd() {
  isDragging.value = false
  if (currentTranslateY.value > CLOSE_THRESHOLD) {
    emit('close')
  }
  currentTranslateY.value = 0
}

function handleLoadDesign(design: SavedDesign) {
  store.loadState(design.state)
  emit('close')
}

function handleDeleteDesign(e: Event, id: string) {
  e.stopPropagation()
  if (confirm('¿Eliminar este diseño?')) {
    deleteDesign(id)
  }
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
  })
}

function getToolLabel(tool: string): string {
  const labels: Record<string, string> = {
    'birth-poster': 'Birth poster',
    'moments': 'Moments',
    'personaliza': 'Personaliza',
  }
  return labels[tool] || tool
}

// Download thumbnail as image
async function handleDownload(e: Event, design: SavedDesign) {
  e.stopPropagation()
  if (!design.thumbnail) return

  try {
    const link = document.createElement('a')
    link.href = design.thumbnail
    link.download = `${design.name || 'design'}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error('Error downloading:', error)
  }
}
</script>

<template>
  <Teleport to="body">
    <!-- Overlay -->
    <div
      class="mobile-nav-overlay"
      :class="{ 'mobile-nav-overlay--visible': isOpen }"
      @click="emit('close')"
    />

    <!-- Panel - always in DOM, controlled by CSS transform -->
    <div
      class="mobile-nav-wrapper"
      :class="{
        'mobile-nav-wrapper--open': isOpen,
        'mobile-nav-wrapper--dragging': isDragging
      }"
      :style="{
        transform: isDragging ? `translateY(${currentTranslateY}px)` : undefined
      }"
    >
      <!-- Drag handle -->
      <div
        class="mobile-nav-wrapper__handle"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      >
        <div class="mobile-nav-wrapper__handle-bar" />
      </div>

      <!-- Header -->
      <div class="mobile-nav-wrapper__header">
        <h2 class="mobile-nav-wrapper__title">
          {{ content === 'history' ? 'Historial' : 'Herramientas' }}
        </h2>
        <!-- Clock icon for history -->
        <button
          v-if="content === 'history'"
          class="mobile-nav-wrapper__icon-btn"
          aria-label="Historial"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
            <path d="M12 7v5l4 2"/>
          </svg>
        </button>
        <!-- Close button for home -->
        <button
          v-else
          class="mobile-nav-wrapper__close"
          @click="emit('close')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18"/>
            <path d="m6 6 12 12"/>
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="mobile-nav-wrapper__content">
        <!-- History content -->
        <template v-if="content === 'history'">
          <!-- Info message -->
          <div class="mobile-nav-wrapper__info">
            <div class="mobile-nav-wrapper__info-bar" />
            <p class="mobile-nav-wrapper__info-text">
              Las imágenes se quedarán en esta galería por 4 dias
            </p>
          </div>

          <!-- Empty state -->
          <div v-if="designs.length === 0" class="mobile-nav-wrapper__empty">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
              <path d="M12 7v5l4 2"/>
            </svg>
            <p>No hay diseños guardados</p>
          </div>

          <!-- History list -->
          <div v-else class="mobile-nav-wrapper__history-list">
            <div
              v-for="design in designs"
              :key="design.id"
              class="mobile-nav-wrapper__history-section"
            >
              <!-- Meta (badge + date) -->
              <div class="mobile-nav-wrapper__history-meta">
                <span class="mobile-nav-wrapper__badge">
                  {{ getToolLabel(design.tool) }}
                </span>
                <span class="mobile-nav-wrapper__date">
                  {{ formatDate(design.updatedAt) }}
                </span>
              </div>

              <!-- Item row -->
              <div class="mobile-nav-wrapper__history-row">
                <!-- Thumbnail (clickable to load) -->
                <button
                  class="mobile-nav-wrapper__thumbnail"
                  @click="handleLoadDesign(design)"
                >
                  <NuxtImg
                    v-if="design.thumbnail"
                    :src="design.thumbnail"
                    :alt="design.name"
                    width="300"
                    height="100"
                  />
                </button>

                <!-- Actions -->
                <div class="mobile-nav-wrapper__actions">
                  <button
                    class="mobile-nav-wrapper__action-btn mobile-nav-wrapper__action-btn--download"
                    aria-label="Descargar"
                    @click="handleDownload($event, design)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  </button>
                  <button
                    class="mobile-nav-wrapper__action-btn mobile-nav-wrapper__action-btn--edit"
                    aria-label="Editar"
                    @click="handleLoadDesign(design)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                      <path d="m15 5 4 4"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Home content -->
        <template v-else-if="content === 'home'">
          <div class="mobile-nav-wrapper__nav-grid">
            <NuxtLink
              v-for="item in navItems"
              :key="item.href"
              :to="item.href"
              :class="[
                'mobile-nav-wrapper__nav-item',
                { 'mobile-nav-wrapper__nav-item--active': item.active }
              ]"
              @click="emit('close')"
            >
              <span class="mobile-nav-wrapper__nav-name">{{ item.name }}</span>
            </NuxtLink>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
// Overlay - covers entire screen
.mobile-nav-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.16);
  z-index: $z-modal;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;

  &--visible {
    opacity: 1;
    pointer-events: auto;
  }
}

// Main wrapper panel
.mobile-nav-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 85vh;
  background: $color-bg-secondary;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  box-shadow: 0 -1px 3px rgba(10, 13, 18, 0.1), 0 -1px 2px -1px rgba(10, 13, 18, 0.1);
  z-index: $z-modal + 1;
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

  // Drag handle
  &__handle {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: $space-xl 0 $space-md;
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

  // Header
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 $space-2xl $space-md;
    border-bottom: 1px solid #e6e7ea;
    flex-shrink: 0;
  }

  &__title {
    font-family: $font-primary;
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    line-height: 28px;
    color: $color-text-primary;
  }

  &__icon-btn {
    @include button-reset;
    @include flex-center;
    width: 32px;
    height: 32px;
    border-radius: $radius-sm;
    color: $color-text-primary;
    overflow: hidden;
    padding: $space-md;
  }

  &__close {
    @include button-reset;
    @include flex-center;
    width: 40px;
    height: 40px;
    border-radius: $radius-lg;
    color: $color-text-secondary;

    @include hover {
      background: $color-bg-tertiary;
    }
  }

  // Content area
  &__content {
    flex: 1;
    overflow-y: auto;
    @include custom-scrollbar;
    padding: $space-xl $space-2xl;
    display: flex;
    flex-direction: column;
    gap: $space-xl;
  }

  // Info message
  &__info {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__info-bar {
    width: 3px;
    align-self: stretch;
    background: #d9d9d9;
  }

  &__info-text {
    flex: 1;
    font-family: $font-primary;
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    line-height: 24px;
    color: $color-text-primary;
  }

  // Empty state
  &__empty {
    @include flex-center;
    flex-direction: column;
    gap: $space-xl;
    flex: 1;
    color: $color-text-muted;
    text-align: center;
    padding: $space-4xl 0;

    svg {
      opacity: 0.5;
    }
  }

  // History list
  &__history-list {
    display: flex;
    flex-direction: column;
    gap: 22px;
  }

  &__history-section {
    display: flex;
    flex-direction: column;
    gap: 9px;
  }

  &__history-meta {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    padding: $space-xxs $space-sm;
    background: #fffaeb;
    border: 1px solid #fedf89;
    border-radius: $radius-sm;
    font-family: $font-primary;
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    line-height: 18px;
    color: #b54708;
  }

  &__date {
    font-family: $font-primary;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    line-height: 18px;
    color: #717680;
  }

  &__history-row {
    display: flex;
    align-items: flex-end;
    gap: $space-xl;
  }

  &__thumbnail {
    @include button-reset;
    flex: 1;
    height: 100px;
    border-radius: $radius-xl;
    border: 1px solid $color-border-light;
    overflow: hidden;
    background: $color-bg-primary;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: $space-md;
    flex-shrink: 0;
  }

  &__action-btn {
    @include button-reset;
    @include flex-center;
    width: 36px;
    height: 36px;
    border-radius: $radius-md;
    overflow: hidden;
    position: relative;
    transition: background-color $transition-fast;

    // Download button - secondary style
    &--download {
      background: $color-bg-primary;
      border: 1px solid #d5d7da;
      box-shadow: 0 1px 2px rgba(10, 13, 18, 0.05);
      color: #414651;

      // Inner shadow for skeuomorphic effect
      &::after {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
        box-shadow: inset 0 0 0 1px rgba(10, 13, 18, 0.18),
                    inset 0 -2px 0 rgba(10, 13, 18, 0.05);
        border-radius: inherit;
      }

      @include hover {
        background: $color-bg-tertiary;
      }
    }

    // Edit button - secondary-color/warning style
    &--edit {
      background: $color-bg-primary;
      border: 1px solid #ffb077;
      box-shadow: 0 1px 2px rgba(10, 13, 18, 0.05);
      color: #b75700;

      // Inner shadow for skeuomorphic effect
      &::after {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
        box-shadow: inset 0 0 0 1px rgba(10, 13, 18, 0.18),
                    inset 0 -2px 0 rgba(10, 13, 18, 0.05);
        border-radius: inherit;
      }

      @include hover {
        background: #fff9f5;
      }
    }
  }

  // Navigation grid (home content)
  &__nav-grid {
    display: flex;
    flex-direction: column;
    gap: $space-md;
  }

  &__nav-item {
    display: flex;
    align-items: center;
    gap: $space-lg;
    padding: $space-xl;
    background: $color-bg-primary;
    border-radius: $radius-xl;
    transition: background-color $transition-fast;

    &--active {
      background: $color-brand-light;
      color: $color-brand;
    }

    @include hover {
      background: $color-bg-tertiary;
    }
  }

  &__nav-name {
    font-size: $font-size-lg;
    font-weight: $font-weight-medium;
  }
}
</style>
