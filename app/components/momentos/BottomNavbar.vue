<script setup lang="ts">
import type { MomentosPanelType } from '~/stores/momentos'

interface NavItem {
  id: MomentosPanelType
  label: string
  icon: string
}

interface Props {
  items: NavItem[]
  activePanel: MomentosPanelType | null
}

defineProps<Props>()
const emit = defineEmits<{
  select: [panel: MomentosPanelType]
}>()

const store = useMomentosStore()
</script>

<template>
  <Teleport to="body">
    <nav class="bottom-navbar">
    <!-- Panel navigation items -->
    <button
      v-for="item in items"
      :key="item.id"
      :class="[
        'bottom-navbar__item',
        {
          'bottom-navbar__item--active':
            // Diseño: active only when activePanel is diseno AND tab is NOT imagenes
            (item.id === 'diseno' && activePanel === 'diseno' && store.activeDisenoTab !== 'imagenes') ||
            // Archivos: active when activePanel is diseno AND tab IS imagenes
            (item.id === 'archivos' && activePanel === 'diseno' && store.activeDisenoTab === 'imagenes') ||
            // Other panels: active when activePanel matches
            (item.id !== 'diseno' && item.id !== 'archivos' && activePanel === item.id)
        }
      ]"
      @click="emit('select', item.id)"
    >
      <!-- Warning badge for archivos/images when any cells need images -->
      <span
        v-if="item.id === 'archivos' && store.emptyCellCount > 0"
        class="bottom-navbar__badge"
      >!</span>
      <span class="bottom-navbar__icon">
        <!-- Design icon -->
        <svg v-if="item.id === 'diseno'" class="bottom-navbar__svg" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
          <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
          <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
          <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
        </svg>

        <!-- Image/Archivo icon -->
        <svg v-else-if="item.id === 'archivos'" class="bottom-navbar__svg-archivo" width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6.75 8.66667C7.80855 8.66667 8.66667 7.80855 8.66667 6.75C8.66667 5.69145 7.80855 4.83333 6.75 4.83333C5.69145 4.83333 4.83333 5.69145 4.83333 6.75C4.83333 7.80855 5.69145 8.66667 6.75 8.66667Z"/>
          <path d="M1 5.6C1 3.98985 1 3.18477 1.31336 2.56978C1.58899 2.02881 2.02881 1.58899 2.56978 1.31336C3.18477 1 3.98985 1 5.6 1H15.5667C17.1768 1 17.9819 1 18.5969 1.31336C19.1379 1.58899 19.5777 2.02881 19.8533 2.56978C20.1667 3.18477 20.1667 3.98985 20.1667 5.6V13.65C20.1667 15.2602 20.1667 16.0652 19.8533 16.6802C19.5777 17.2212 19.1379 17.661 18.5969 17.9366C17.9819 18.25 17.1768 18.25 15.5667 18.25H5.6C3.98985 18.25 3.18477 18.25 2.56978 17.9366C2.02881 17.661 1.58899 17.2212 1.31336 16.6802C1 16.0652 1 15.2602 1 13.65V5.6Z" class="bottom-navbar__svg-fill"/>
          <path d="M3.17742 17.9892L9.4991 11.6676C9.87862 11.288 10.0684 11.0983 10.2872 11.0272C10.4797 10.9647 10.687 10.9647 10.8795 11.0272C11.0983 11.0983 11.2881 11.2881 11.6676 11.6676L17.9471 17.9471M12.5 12.5L15.2491 9.7509C15.6286 9.37138 15.8184 9.18162 16.0372 9.11053C16.2297 9.04799 16.437 9.04799 16.6295 9.11053C16.8483 9.18162 17.038 9.37138 17.4176 9.7509L20.1667 12.5M8.66667 6.75C8.66667 7.80855 7.80855 8.66667 6.75 8.66667C5.69145 8.66667 4.83333 7.80855 4.83333 6.75C4.83333 5.69145 5.69145 4.83333 6.75 4.83333C7.80855 4.83333 8.66667 5.69145 8.66667 6.75ZM5.6 18.25H15.5667C17.1768 18.25 17.9819 18.25 18.5969 17.9366C19.1379 17.661 19.5777 17.2212 19.8533 16.6802C20.1667 16.0652 20.1667 15.2602 20.1667 13.65V5.6C20.1667 3.98985 20.1667 3.18477 19.8533 2.56978C19.5777 2.02881 19.1379 1.58899 18.5969 1.31336C17.9819 1 17.1768 1 15.5667 1H5.6C3.98985 1 3.18477 1 2.56978 1.31336C2.02881 1.58899 1.58899 2.02881 1.31336 2.56978C1 3.18477 1 3.98985 1 5.6V13.65C1 15.2602 1 16.0652 1.31336 16.6802C1.58899 17.2212 2.02881 17.661 2.56978 17.9366C3.18477 18.25 3.98985 18.25 5.6 18.25Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>

        <!-- Medidas (ruler) icon -->
        <svg v-else-if="item.id === 'medidas'" width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13.8957 5.27089L15.3332 6.70839M11.0207 8.14589L12.4582 9.58339M8.14572 11.0209L9.58322 12.4584M5.27072 13.8959L6.70822 15.3334M2.45863 16.8339L6.16606 20.5413C6.35582 20.7311 6.4507 20.8259 6.56011 20.8615C6.65635 20.8928 6.76001 20.8928 6.85625 20.8615C6.96566 20.8259 7.06054 20.7311 7.25029 20.5413L20.5411 7.25054C20.7308 7.06078 20.8257 6.9659 20.8613 6.85649C20.8925 6.76026 20.8925 6.65659 20.8613 6.56035C20.8257 6.45095 20.7308 6.35607 20.5411 6.16631L16.8336 2.45887C16.6439 2.26911 16.549 2.17424 16.4396 2.13869C16.3433 2.10742 16.2397 2.10742 16.1434 2.13869C16.034 2.17424 15.9392 2.26911 15.7494 2.45887L2.45863 15.7496C2.26887 15.9394 2.17399 16.0343 2.13844 16.1437C2.10717 16.2399 2.10717 16.3436 2.13844 16.4398C2.17399 16.5492 2.26887 16.6441 2.45863 16.8339Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>

        <!-- Marco (frame) icon -->
        <svg v-else-if="item.id === 'marco'" width="24" height="24" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect class="sidebar-nav__svg-frame-fill" x="128" y="384" width="768" height="512"/>
          <path class="omit-fill" d="M992 1024H32q-13 0-22.5-9.5T0 992V288q0-13 9.5-22.5T32 256h211L488 11l.5-1l.5-1q10-9 23-9t23 9l.5 1l.5 1l245 245h211q13 0 22.5 9.5t9.5 22.5v704q0 13-9.5 22.5T992 1024M512 77L333 256h358zm384 307H128v512h768z" fill="currentColor"/>
        </svg>
      </span>
      <span class="bottom-navbar__label">{{ item.label }}</span>
    </button>
    </nav>
  </Teleport>
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
  z-index: $z-fixed + 2;

  &__item {
    @include button-reset;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: $space-md $space-lg;
    color: $color-text-secondary;
    transition: color $transition-fast;
    min-width: 56px;

    &--active {
      color: $color-brand;

      .bottom-navbar__icon {
        background: $color-brand-light;
        border: 1px solid rgba(14, 19, 24, 0.09);
        box-shadow: 0 4px 7px rgba(51, 51, 51, 0.1);
      }

      .bottom-navbar__icon path:not(.omit-fill),
      .bottom-navbar__icon rect:not(.omit-fill) {
        fill: $color-icon-fill;
      }
    }
  }

  &__badge {
    position: absolute;
    top: 2px;
    right: 6px;
    width: 16px;
    height: 16px;
    background: $color-error;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    font-family: $font-primary;
    font-size: 11px;
    font-weight: $font-weight-bold;
    color: #ffffff;
    line-height: 1;
  }

  &__icon {
    @include flex-center;
    width: 36px;
    height: 36px;
    border-radius: $radius-xl;
    transition: background-color $transition-fast, box-shadow $transition-fast;

    svg {
      width: 22px;
      height: 22px;
    }
  }

  &__label {
    font-size: 11px;
    font-weight: $font-weight-medium;
    white-space: nowrap;
  }
}
</style>
