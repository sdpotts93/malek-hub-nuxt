<script setup lang="ts">
import type { PanelType } from '~/types'

interface NavItem {
  id: PanelType
  label: string
  icon: string
}

interface Props {
  items: NavItem[]
  activePanel: PanelType
}

defineProps<Props>()
const emit = defineEmits<{
  select: [panel: PanelType]
}>()

const uiStore = useUIStore()
</script>

<template>
  <nav class="bottom-navbar">
    <!-- Home button -->
    <button
      class="bottom-navbar__item bottom-navbar__item--home"
      @click="uiStore.openMobileNavWrapper('home')"
    >
      <span class="bottom-navbar__icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </span>
    </button>

    <!-- Panel navigation items (exclude 'general') -->
    <button
      v-for="item in items.filter(i => i.id !== 'general')"
      :key="item.id"
      :class="[
        'bottom-navbar__item',
        { 'bottom-navbar__item--active': activePanel === item.id }
      ]"
      @click="emit('select', item.id)"
    >
      <span class="bottom-navbar__icon">
        <!-- Diseño icon (palette) -->
        <svg v-if="item.icon === 'palette'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>
          <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
          <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>
          <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2Z"/>
        </svg>
        <!-- Datos icon (text) -->
        <svg v-else-if="item.icon === 'text'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 7V4h16v3"/>
          <path d="M9 20h6"/>
          <path d="M12 4v16"/>
        </svg>
        <!-- Medidas icon (ruler) -->
        <svg v-else-if="item.icon === 'ruler'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/>
          <path d="m14.5 12.5 2-2"/>
          <path d="m11.5 9.5 2-2"/>
          <path d="m8.5 6.5 2-2"/>
          <path d="m17.5 15.5 2-2"/>
        </svg>
        <!-- Marco icon (frame) -->
        <svg v-else-if="item.icon === 'frame'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2"/>
          <path d="M3 9h18"/>
          <path d="M3 15h18"/>
          <path d="M9 3v18"/>
          <path d="M15 3v18"/>
        </svg>
      </span>
      <span class="bottom-navbar__label">{{ item.label }}</span>
    </button>
  </nav>
</template>

<style lang="scss" scoped>
.bottom-navbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: $bottom-navbar-height;
  background: $color-bg-primary;
  border-top: 1px solid $color-border;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 $space-lg;
  padding-bottom: env(safe-area-inset-bottom, 0);
  z-index: $z-fixed;

  &__item {
    @include button-reset;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $space-xs;
    padding: $space-md $space-lg;
    color: $color-text-secondary;
    transition: color $transition-fast;
    min-width: 56px;

    &--active {
      color: $color-brand;
    }

    &--home {
      color: $color-text-muted;

      @include hover {
        color: $color-text-primary;
      }
    }
  }

  &__icon {
    @include flex-center;
    width: 24px;
    height: 24px;

    svg {
      width: 24px;
      height: 24px;
    }
  }

  &__label {
    font-size: 11px;
    font-weight: $font-weight-medium;
    white-space: nowrap;
  }
}
</style>
