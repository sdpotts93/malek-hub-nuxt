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
    href: '/personaliza',
    description: 'Disena una pieza unica a partir de tus propias fotos.',
    icon: 'image',
  },
  {
    name: 'Birth Poster',
    href: '/birth-poster',
    description: 'El nacimiento de tu bebe convertido en una obra de arte a escala real.',
    icon: 'baby',
  },
  {
    name: 'Momentos',
    href: '/momentos',
    description: 'Crea collages con tus recuerdos usando distintos layouts.',
    icon: 'grid',
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
                <!-- Icon -->
                <div class="mobile-nav-wrapper__nav-card-icon">
                  <!-- Image/Personaliza icon -->
                  <svg v-if="item.icon === 'image'" xmlns="http://www.w3.org/2000/svg" width="113" height="113" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M20 3a1 1 0 0 1 1 1v1.757l-2 2V5H5v8.1l4-4l4.328 4.329l-1.415 1.413L9 11.93l-4 3.999V19h10.533l.708.001l1.329-1.33L18.9 19h.1v-2.758l2-2V20a1 1 0 0 1-1 1H4c-.55 0-1-.45-1-1V4a1 1 0 0 1 1-1zm1.778 4.808l1.414 1.414L15.414 17l-1.416-.002l.002-1.412zM15.5 7a1.5 1.5 0 1 1 0 3a1.5 1.5 0 0 1 0-3"/>
                  </svg>
                  <!-- Baby/Birth Poster icon -->
                  <svg v-else-if="item.icon === 'baby'" xmlns="http://www.w3.org/2000/svg" width="113" height="113" viewBox="0 0 14 18" fill="currentColor">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M3.07684 10.7247C3.19371 11.7304 3.36051 12.4898 3.72329 13.3852C4.08594 14.2803 4.8858 15.4771 5.86157 16.1892C6.83733 16.9012 8.42889 17.5661 9.50479 17.4947C10.5807 17.4236 11.0602 17.026 11.5551 16.5225C12.0498 16.0189 13.1621 14.4862 13.5497 13.0549C13.9377 11.6239 13.6957 11.1217 13.3835 10.7064C13.0716 10.2911 12.3677 10.0092 11.4071 10.0826C10.4464 10.156 9.40867 10.752 9.34964 11.2445C9.25834 12.0058 10.676 12.1109 10.4464 12.7796C10.3542 13.0489 10.0105 13.2658 9.09837 13.2383C8.18619 13.211 7.18766 12.7679 6.95554 12.0641C6.72341 11.3603 6.82488 10.7137 7.31779 10.3724C9.39957 8.93126 10.0942 7.74411 10.2308 7.20426C10.3673 6.6644 10.1536 6.03147 9.61349 5.54627C8.45366 4.50432 6.12127 4.96998 4.99022 5.77152C3.31151 6.96146 2.85141 8.78553 3.07684 10.7247ZM5.81565 0.885972C5.62141 1.32397 5.36545 2.23867 5.62368 2.99313C5.88205 3.7476 6.85942 4.60179 7.93438 4.40247C9.00921 4.20302 8.97628 2.52535 8.76557 1.79747C8.57494 1.13941 7.61564 0.0565121 6.9455 0.00385636C6.27535 -0.0487993 6.01003 0.447707 5.81565 0.885972ZM2.65931 3.47408C3.28862 4.39489 4.27282 4.53876 4.77242 4.36856C5.27201 4.19823 5.05608 2.80751 4.75515 2.16872C4.37911 1.37091 3.50241 1.29764 2.99224 1.5576C2.48206 1.81729 2.03013 2.55327 2.65931 3.47408ZM1.04352 4.13254C0.378461 4.36218 0.570562 5.7396 0.955433 6.28677C1.34017 6.83394 2.49063 7.13724 2.934 6.64366C3.37751 6.15008 2.8253 5.17396 2.55877 4.85815C2.29224 4.54209 1.70858 3.9029 1.04352 4.13254ZM0.0557052 7.57617C0.244325 7.14575 1.11286 7.1887 1.7644 7.56341C2.58555 8.03585 2.61888 9.221 2.13481 9.41434C1.74338 9.57071 1.04968 9.46952 0.616479 9.12632C0.183281 8.78313 -0.132915 8.00646 0.0557052 7.57617Z"/>
                  </svg>
                  <!-- Grid/Momentos icon -->
                  <svg v-else-if="item.icon === 'grid'" xmlns="http://www.w3.org/2000/svg" width="113" height="113" viewBox="0 0 24 24">
                    <g fill="none">
                      <path d="M3 3v18h6l2-9l2-9z"/>
                      <path d="M21 3h-8L9 21h12z"/>
                      <path stroke="currentColor" stroke-width="2" d="M13 3H3v18h6m4-18h8v13M13 3l-2 9m-2 9h12v-5M9 21l2-9m10 4l-10-4"/>
                    </g>
                  </svg>
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
    transition: transform $transition-fast;

    // Default - light orange (Personaliza)
    background: $color-brand-light;
    border: 1px solid $color-brand-light;
    color: $color-brand-hover;

    // Birth Poster - dark orange (2nd card)
    &:nth-child(2) {
      background: $color-brand-hover;
      border-color: $color-brand-light;
      color: $color-brand-light;

      .mobile-nav-wrapper__nav-card-header svg {
        color: $color-brand-lighter;
      }

      .mobile-nav-wrapper__nav-card-desc {
        color: $color-brand-light;
      }

      .mobile-nav-wrapper__nav-card-icon {
        opacity: 1;
        color: $color-brand;
      }
    }

    // Momentos - medium orange (3rd card)
    &:nth-child(3) {
      background: $color-brand-lightish;
      border-color: $color-brand-light;
    }

    @include hover {
      transform: scale(0.98);
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
    font-size: $font-size-2xl;
    font-weight: $font-weight-semibold;
    line-height: 32px;
  }

  &__nav-card-desc {
    font-family: $font-primary;
    font-size: $font-size-xs;
    font-weight: $font-weight-normal;
    line-height: 18px;
    color: #4d2300;
  }

  &__nav-card-icon {
    width: auto;
    height: 105%;
    flex-shrink: 0;
    opacity: 0.5;
    color: $color-brand-lightosh;

    svg {
      width: 100%;
      height: 100%;
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
