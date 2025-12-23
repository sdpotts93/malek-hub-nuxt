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
        <!-- Placeholder for icon - user will add their own images -->
        <span class="sidebar-nav__icon-placeholder">{{ item.icon.charAt(0).toUpperCase() }}</span>
      </span>
      <span class="sidebar-nav__label">{{ item.label }}</span>
    </button>
  </nav>
</template>

<style lang="scss" scoped>
.sidebar-nav {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 72px;
  padding: 20px 0 32px;

  &__item {
    @include button-reset;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    width: 72px;
    height: 72px;
    padding: 6px 0;
    color: $color-text-primary;
    transition: color $transition-fast;

    @include hover {
      .sidebar-nav__icon {
        background: $color-bg-tertiary;
      }
    }

    &--active {
      color: $color-brand;

      .sidebar-nav__icon {
        background: $color-brand-light;
        border: 1px solid rgba(14, 19, 24, 0.09);
        box-shadow: 0 4px 7px rgba(51, 51, 51, 0.1);
      }

      @include hover {
        .sidebar-nav__icon {
          background: $color-brand-light;
        }
      }
    }
  }

  &__icon {
    @include flex-center;
    width: 40px;
    height: 40px;
    border-radius: $radius-xl;
    transition: background-color $transition-fast, box-shadow $transition-fast;
  }

  &__icon-placeholder {
    // Temporary placeholder - user will replace with actual icon images
    width: 23px;
    height: 23px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: $font-weight-bold;
    color: currentColor;
  }

  &__label {
    font-family: $font-primary;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    line-height: 18px;
    text-align: center;
  }
}
</style>
