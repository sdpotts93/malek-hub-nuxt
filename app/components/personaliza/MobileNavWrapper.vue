<script setup lang="ts">
import type { SavedDesign, PersonalizaState } from '~/types'

interface Props {
  isOpen: boolean
  content: 'history' | 'home' | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const store = usePersonalizaStore()
const { designs, deleteDesign } = useDesignHistory<PersonalizaState>('personaliza')

// Navigation items for home
const route = useRoute()
const navItems = [
  {
    name: 'Personaliza',
    href: '/app/personaliza',
    description: 'Diseña una pieza única a partir de tus propias fotos.',
    image: '/landing/personaliza.jpg',
  },
  {
    name: 'Momentos',
    href: '/app/momentos',
    description: 'Crea collages con tus recuerdos usando distintos layouts.',
    image: '/landing/momentos.png',
  },
  {
    name: 'Póster de nacimiento',
    href: '/app/poster-de-nacimiento',
    description: 'El nacimiento de tu bebé convertido en una obra de arte a escala real.',
    image: '/landing/birth-poster.jpg',
  },
]

const isActiveRoute = (href: string) => route.path === href

// Touch handling for drag to close
const isDragging = ref(false)
const dragStartY = ref(0)
const currentTranslateY = ref(0)
const CLOSE_THRESHOLD = 100

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

function handleLoadDesign(design: SavedDesign<PersonalizaState>) {
  store.loadState(design.state)
  emit('close')
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
  })
}

function handleDelete(e: Event, id: string) {
  e.stopPropagation()
  if (confirm('Eliminar este diseno?')) {
    deleteDesign(id)
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

      <!-- Header (only for history) -->
      <div v-if="content === 'history'" class="mobile-nav-wrapper__header">
        <h2 class="mobile-nav-wrapper__title">Historial</h2>
        <button
          class="mobile-nav-wrapper__icon-btn"
          aria-label="Historial"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
            <path d="M12 7v5l4 2"/>
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
              Puedes seleccionar un diseno en tu historial para
              seguir editando.
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
            <button
              v-for="design in designs"
              :key="design.id"
              class="mobile-nav-wrapper__history-item"
              @click="handleLoadDesign(design)"
            >
              <!-- Thumbnail -->
              <div class="mobile-nav-wrapper__thumbnail">
                <NuxtImg
                  v-if="design.thumbnail"
                  :src="design.thumbnail"
                  :alt="design.name"
                  width="68"
                  height="68"
                />
              </div>

              <!-- Info -->
              <div class="mobile-nav-wrapper__history-info">
                <span class="mobile-nav-wrapper__history-name">{{ design.name }}</span>
                <span class="mobile-nav-wrapper__history-date">{{ formatDate(design.updatedAt) }}</span>
              </div>

              <!-- Actions -->
              <div class="mobile-nav-wrapper__actions">
                <!-- Edit button -->
                <button
                  class="mobile-nav-wrapper__action-btn mobile-nav-wrapper__action-btn--edit"
                  aria-label="Editar"
                  @click.stop="handleLoadDesign(design)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                    <path d="m15 5 4 4"/>
                  </svg>
                </button>
                <!-- Delete button -->
                <button
                  class="mobile-nav-wrapper__delete"
                  aria-label="Eliminar"
                  @click="handleDelete($event, design.id)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 6 6 18"/>
                    <path d="m6 6 12 12"/>
                  </svg>
                </button>
              </div>
            </button>
          </div>
        </template>

        <!-- Home content -->
        <template v-else-if="content === 'home'">
          <div class="mobile-nav-wrapper__home">
            <!-- Navigation cards -->
            <div class="mobile-nav-wrapper__nav-cards">
              <NuxtLink
                v-for="item in navItems"
                :key="item.href"
                :to="item.href"
                :class="[
                  'mobile-nav-wrapper__nav-card',
                  { 'mobile-nav-wrapper__nav-card--active': isActiveRoute(item.href) }
                ]"
                @click="emit('close')"
              >
                <div class="mobile-nav-wrapper__nav-card-content">
                  <div class="mobile-nav-wrapper__nav-card-header">
                    <span class="mobile-nav-wrapper__nav-card-title">{{ item.name }}</span>
                    <!-- Arrow icon -->
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M5 12h14"/>
                      <path d="m12 5 7 7-7 7"/>
                    </svg>
                  </div>
                  <p class="mobile-nav-wrapper__nav-card-desc">{{ item.description }}</p>
                </div>
                <!-- Image -->
                <div class="mobile-nav-wrapper__nav-card-image">
                  <NuxtImg
                    :src="item.image"
                    :alt="item.name"
                    width="120"
                    height="90"
                    loading="lazy"
                  />
                </div>
              </NuxtLink>
            </div>

            <!-- Footer -->
            <div class="mobile-nav-wrapper__footer">
              <p class="mobile-nav-wrapper__footer-visit">
                Visita <a href="https://studiomalek.com" target="_blank" rel="noopener">StudioMalek.com</a>
              </p>
              <div class="mobile-nav-wrapper__footer-links">
                <a href="#" class="mobile-nav-wrapper__footer-link">Terminos y condiciones</a>
                <span class="mobile-nav-wrapper__footer-copyright">Todos los derechos reservados 2026</span>
              </div>
            </div>
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
  max-height: 90svh;
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
    gap: $space-md;
  }

  // History item - matches .history-panel__item styling
  &__history-item {
    @include button-reset;
    display: flex;
    align-items: center;
    gap: $space-md;
    padding: $space-md;
    border-radius: $radius-xl;
    background: $color-bg-primary;
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
    background: $color-bg-tertiary;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__history-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__history-name {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    @include text-truncate;
  }

  &__history-date {
    font-size: $font-size-xs;
    color: $color-text-muted;
  }

  &__actions {
    display: flex;
    flex-direction: row;
    align-items: center;
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

    // Edit button - secondary-color/warning style
    &--edit {
      background: $color-bg-primary;
      border: 1px solid $color-brand;
      box-shadow: 0 1px 2px rgba(10, 13, 18, 0.05);
      color: $color-brand-hover;

    }
  }

  &__delete {
    @include button-reset;
    @include flex-center;
    width: 24px;
    height: 24px;
    border-radius: $radius-md;
    color: $color-text-muted;
    transition: color $transition-fast;

    @include hover {
      color: $color-error;
    }
  }

  // Home content
  &__home {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    flex: 1;
    gap: $space-xl;
  }

  &__nav-cards {
    display: flex;
    flex-direction: column;
    gap: $space-xl;
  }

  &__nav-card {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    height: 120px;
    padding: $space-2xl;
    border-radius: $radius-xl;
    overflow: hidden;
    text-decoration: none;
    transition: transform $transition-fast, border-color $transition-fast;
    background: #ffffff;
    border: 1px solid #d8d8d8;
    color: $color-text-primary;

    &--active {
      border: 2px solid #252b37;
    }
  }

  &__nav-card-content {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    max-width: 209px;
    row-gap: $space-xs;
  }

  &__nav-card-header {
    display: flex;
    align-items: center;
    gap: $space-md;

    svg {
      width: 20px;
      height: 20px;
      color: #414651; // Gray arrow by default
    }
  }

  &__nav-card-title {
    font-family: $font-primary;
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    line-height: 32px;
    color: $color-brand;
  }

  &__nav-card-desc {
    font-family: $font-primary;
    font-size: $font-size-xs;
    font-weight: $font-weight-normal;
    line-height: 18px;
    color: $color-text-secondary;
  }

  &__nav-card-image {
    aspect-ratio: 1;
    height: 100%;
    flex-shrink: 0;
    border-radius: $radius-lg;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  // Footer
  &__footer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $space-md;
    padding-top: $space-xl;
  }

  &__footer-visit {
    font-family: $font-primary;
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    line-height: 28px;
    color: $color-text-primary;

    a {
      color: $color-brand;
      text-decoration: underline;
    }
  }

  &__footer-links {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $space-xs;
    color: #85888e;
    text-align: center;
  }

  &__footer-link {
    font-family: $font-primary;
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    line-height: 24px;
    color: inherit;
    text-decoration: underline;
  }

  &__footer-copyright {
    font-family: $font-primary;
    font-size: $font-size-xs;
    line-height: 18px;
  }
}
</style>
