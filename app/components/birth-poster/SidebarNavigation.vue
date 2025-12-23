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

const props = defineProps<Props>()
const emit = defineEmits<{
  select: [panel: PanelType]
}>()

// Icon SVG paths
const iconPaths: Record<string, string> = {
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z',
  palette: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.75 1.5-1.5 0-.37-.13-.71-.37-.96A.7.7 0 0 1 13 19c0-.37.13-.71.37-.96.24-.25.57-.37.93-.37h2.2A6.5 6.5 0 0 0 22 12c0-5.5-4.5-10-10-10ZM6.5 12a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z',
  text: 'M4 7V4h16v3M9 20h6M12 4v16',
  ruler: 'M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 .8-1.6l8-6a2 2 0 0 1 2.4 0l8 6ZM14 10v2M18 10v4M10 10v6',
  frame: 'M3 3h18v18H3zM8 3v18M16 3v18M3 8h18M3 16h18',
}
</script>

<template>
  <nav class="sidebar-nav">
    <button
      v-for="item in items"
      :key="item.id"
      :class="[
        'sidebar-nav__item',
        { 'sidebar-nav__item--active': activePanel === item.id }
      ]"
      :aria-current="activePanel === item.id ? 'true' : undefined"
      @click="emit('select', item.id)"
    >
      <span class="sidebar-nav__icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path :d="iconPaths[item.icon]" />
        </svg>
      </span>
      <span class="sidebar-nav__label">{{ item.label }}</span>
    </button>
  </nav>
</template>

<style lang="scss" scoped>
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: $space-md;

  &__item {
    @include button-reset;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $space-xs;
    padding: $space-lg $space-md;
    border-radius: $radius-lg;
    color: $color-text-secondary;
    transition: background-color $transition-fast, color $transition-fast;

    @include hover {
      background: $color-bg-tertiary;
      color: $color-text-primary;
    }

    &--active {
      background: $color-brand-light;
      color: $color-brand;

      @include hover {
        background: $color-brand-light;
        color: $color-brand;
      }
    }
  }

  &__icon {
    @include flex-center;
    width: 32px;
    height: 32px;

    svg {
      width: 20px;
      height: 20px;
    }
  }

  &__label {
    font-family: $font-secondary;
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    text-align: center;
  }
}
</style>
