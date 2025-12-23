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

// Icon SVG paths (same as sidebar)
const iconPaths: Record<string, string> = {
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  palette: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.75 1.5-1.5 0-.37-.13-.71-.37-.96A.7.7 0 0 1 13 19c0-.37.13-.71.37-.96.24-.25.57-.37.93-.37h2.2A6.5 6.5 0 0 0 22 12c0-5.5-4.5-10-10-10Z',
  text: 'M4 7V4h16v3M9 20h6M12 4v16',
  ruler: 'M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 .8-1.6l8-6a2 2 0 0 1 2.4 0l8 6Z',
  frame: 'M3 3h18v18H3zM8 3v18M16 3v18M3 8h18M3 16h18',
}
</script>

<template>
  <nav class="bottom-navbar">
    <!-- Home button -->
    <button
      class="bottom-navbar__item bottom-navbar__item--special"
      @click="uiStore.openMobileNavWrapper('home')"
    >
      <span class="bottom-navbar__icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </span>
    </button>

    <!-- Panel navigation items -->
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
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path :d="iconPaths[item.icon]" />
        </svg>
      </span>
      <span class="bottom-navbar__label">{{ item.label }}</span>
    </button>

    <!-- History button -->
    <button
      class="bottom-navbar__item bottom-navbar__item--special"
      @click="uiStore.openMobileNavWrapper('history')"
    >
      <span class="bottom-navbar__icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      </span>
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
  align-items: stretch;
  padding: 0 $space-md;
  padding-bottom: env(safe-area-inset-bottom, 0);
  z-index: $z-fixed;

  &__item {
    @include button-reset;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $space-xs;
    color: $color-text-secondary;
    transition: color $transition-fast;

    &--active {
      color: $color-brand;
    }

    &--special {
      flex: 0.7;
      color: $color-text-muted;

      @include hover {
        color: $color-text-primary;
      }
    }
  }

  &__icon {
    @include flex-center;
    width: 28px;
    height: 28px;

    svg {
      width: 22px;
      height: 22px;
    }
  }

  &__label {
    font-size: 10px;
    font-weight: $font-weight-medium;
  }
}
</style>
