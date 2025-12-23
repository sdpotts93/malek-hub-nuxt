<script setup lang="ts">
interface Props {
  isOpen: boolean
  content: 'history' | 'home' | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const store = useBirthPosterStore()
const { designs } = useDesignHistory('birth-poster')

// Navigation items for home
const navItems = [
  { name: 'Personaliza', href: '/personaliza', icon: 'palette' },
  { name: 'Birth Poster', href: '/birth-poster', icon: 'baby', active: true },
  { name: 'Momentos', href: '/moments', icon: 'image' },
]

function handleLoadDesign(design: any) {
  store.loadState(design.state)
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="slide-up">
      <div
        v-if="isOpen"
        class="mobile-nav-wrapper"
      >
        <!-- Header -->
        <div class="mobile-nav-wrapper__header">
          <h2 class="mobile-nav-wrapper__title">
            {{ content === 'history' ? 'Historial' : 'Herramientas' }}
          </h2>
          <button
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
            <div v-if="designs.length === 0" class="mobile-nav-wrapper__empty">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <p>No hay diseños guardados</p>
            </div>

            <div v-else class="mobile-nav-wrapper__history-grid">
              <button
                v-for="design in designs"
                :key="design.id"
                class="mobile-nav-wrapper__history-item"
                @click="handleLoadDesign(design)"
              >
                <div class="mobile-nav-wrapper__thumbnail">
                  <NuxtImg
                    v-if="design.thumbnail"
                    :src="design.thumbnail"
                    :alt="design.name"
                    width="120"
                    height="150"
                  />
                </div>
                <span class="mobile-nav-wrapper__design-name">{{ design.name }}</span>
              </button>
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
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.mobile-nav-wrapper {
  position: fixed;
  inset: 0;
  background: $color-bg-primary;
  z-index: $z-modal;
  display: flex;
  flex-direction: column;

  &__header {
    @include flex-between;
    padding: $space-xl;
    border-bottom: 1px solid $color-border;
    flex-shrink: 0;
  }

  &__title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
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

  &__content {
    flex: 1;
    overflow-y: auto;
    @include custom-scrollbar;
    padding: $space-xl;
  }

  &__empty {
    @include flex-center;
    flex-direction: column;
    gap: $space-xl;
    height: 100%;
    color: $color-text-muted;
    text-align: center;

    svg {
      opacity: 0.5;
    }
  }

  &__history-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: $space-lg;
  }

  &__history-item {
    @include button-reset;
    display: flex;
    flex-direction: column;
    gap: $space-md;
  }

  &__thumbnail {
    aspect-ratio: 3 / 4;
    border-radius: $radius-lg;
    overflow: hidden;
    background: $color-bg-tertiary;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__design-name {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    @include text-truncate;
  }

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
    background: $color-bg-secondary;
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
