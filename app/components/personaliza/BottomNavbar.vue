<script setup lang="ts">
import type { PersonalizaPanelType } from '~/stores/personaliza'

interface NavItem {
  id: PersonalizaPanelType
  label: string
  icon: string
}

interface Props {
  items: NavItem[]
  activePanel: PersonalizaPanelType | null
}

defineProps<Props>()
const emit = defineEmits<{
  select: [panel: PersonalizaPanelType]
  close: []
}>()

const store = usePersonalizaStore()
</script>

<template>
  <Teleport to="body">
    <nav class="bottom-navbar">
      <button class="bottom-navbar__close" type="button" aria-label="Cerrar" @click="emit('close')">
        <span class="bottom-navbar__close-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </button>

      <button
        v-for="item in items"
        :key="item.id"
        :class="[
          'bottom-navbar__item',
          { 'bottom-navbar__item--active': activePanel === item.id },
          { 'bottom-navbar__item--disabled': item.id !== 'archivo' && !store.hasImage }
        ]"
        :disabled="item.id !== 'archivo' && !store.hasImage"
        @click="emit('select', item.id)"
      >
        <span class="bottom-navbar__icon">
          <!-- Image/Archivo icon -->
          <svg v-if="item.id === 'archivo'" width="22" height="20" viewBox="0 0 22 20" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.75 8.66667C7.80855 8.66667 8.66667 7.80855 8.66667 6.75C8.66667 5.69145 7.80855 4.83333 6.75 4.83333C5.69145 4.83333 4.83333 5.69145 4.83333 6.75C4.83333 7.80855 5.69145 8.66667 6.75 8.66667Z"/>
            <path d="M1 5.6C1 3.98985 1 3.18477 1.31336 2.56978C1.58899 2.02881 2.02881 1.58899 2.56978 1.31336C3.18477 1 3.98985 1 5.6 1H15.5667C17.1768 1 17.9819 1 18.5969 1.31336C19.1379 1.58899 19.5777 2.02881 19.8533 2.56978C20.1667 3.18477 20.1667 3.98985 20.1667 5.6V13.65C20.1667 15.2602 20.1667 16.0652 19.8533 16.6802C19.5777 17.2212 19.1379 17.661 18.5969 17.9366C17.9819 18.25 17.1768 18.25 15.5667 18.25H5.6C3.98985 18.25 3.18477 18.25 2.56978 17.9366C2.02881 17.661 1.58899 17.2212 1.31336 16.6802C1 16.0652 1 15.2602 1 13.65V5.6Z"/>
            <path d="M3.17742 17.9892L9.4991 11.6676C9.87862 11.288 10.0684 11.0983 10.2872 11.0272C10.4797 10.9647 10.687 10.9647 10.8795 11.0272C11.0983 11.0983 11.2881 11.2881 11.6676 11.6676L17.9471 17.9471M12.5 12.5L15.2491 9.7509C15.6286 9.37138 15.8184 9.18162 16.0372 9.11053C16.2297 9.04799 16.437 9.04799 16.6295 9.11053C16.8483 9.18162 17.038 9.37138 17.4176 9.7509L20.1667 12.5M8.66667 6.75C8.66667 7.80855 7.80855 8.66667 6.75 8.66667C5.69145 8.66667 4.83333 7.80855 4.83333 6.75C4.83333 5.69145 5.69145 4.83333 6.75 4.83333C7.80855 4.83333 8.66667 5.69145 8.66667 6.75ZM5.6 18.25H15.5667C17.1768 18.25 17.9819 18.25 18.5969 17.9366C19.1379 17.661 19.5777 17.2212 19.8533 16.6802C20.1667 16.0652 20.1667 15.2602 20.1667 13.65V5.6C20.1667 3.98985 20.1667 3.18477 19.8533 2.56978C19.5777 2.02881 19.1379 1.58899 18.5969 1.31336C17.9819 1 17.1768 1 15.5667 1H5.6C3.98985 1 3.18477 1 2.56978 1.31336C2.02881 1.58899 1.58899 2.02881 1.31336 2.56978C1 3.18477 1 3.98985 1 5.6V13.65C1 15.2602 1 16.0652 1.31336 16.6802C1.58899 17.2212 2.02881 17.661 2.56978 17.9366C3.18477 18.25 3.98985 18.25 5.6 18.25Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <!-- Text (texto) icon -->
          <svg v-else-if="item.id === 'texto'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 5H20M9 5V19M15 19H9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <!-- Margen icon -->
          <svg v-else-if="item.id === 'margen'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 4v16M17 4v16M4 12h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <!-- Medidas (ruler) icon -->
          <svg v-else-if="item.id === 'medidas'" width="22" height="22" viewBox="0 0 23 23" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.8957 5.27089L15.3332 6.70839M11.0207 8.14589L12.4582 9.58339M8.14572 11.0209L9.58322 12.4584M5.27072 13.8959L6.70822 15.3334M2.45863 16.8339L6.16606 20.5413C6.35582 20.7311 6.4507 20.8259 6.56011 20.8615C6.65635 20.8928 6.76001 20.8928 6.85625 20.8615C6.96566 20.8259 7.06054 20.7311 7.25029 20.5413L20.5411 7.25054C20.7308 7.06078 20.8257 6.9659 20.8613 6.85649C20.8925 6.76026 20.8925 6.65659 20.8613 6.56035C20.8257 6.45095 20.7308 6.35607 20.5411 6.16631L16.8336 2.45887C16.6439 2.26911 16.549 2.17424 16.4396 2.13869C16.3433 2.10742 16.2397 2.10742 16.1434 2.13869C16.034 2.17424 15.9392 2.26911 15.7494 2.45887L2.45863 15.7496C2.26887 15.9394 2.17399 16.0343 2.13844 16.1437C2.10717 16.2399 2.10717 16.3436 2.13844 16.4398C2.17399 16.5492 2.26887 16.6441 2.45863 16.8339Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <!-- Marco (frame) icon -->
          <svg v-else-if="item.id === 'marco'" width="22" height="22" viewBox="0 0 1024 1024" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
            <rect x="128" y="384" width="768" height="512" stroke-width="72"/>
            <path d="M512 77L333 256h358z" fill="currentColor" stroke="none"/>
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
  height: 88px;
  background: #ffffff;
  border-top: 1px solid #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  padding: 8px 12px;
  padding-bottom: env(safe-area-inset-bottom, 0);
  box-shadow: 0 -1px 3px rgba(10, 13, 18, 0.05);
  z-index: $z-fixed + 2;

  &__close {
    @include button-reset;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: #f5f5f5;
    color: #414651;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__item {
    @include button-reset;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    flex: 1 1 0;
    max-width: 72px;
    height: 72px;
    color: #414651;
    transition: color $transition-fast;

    &--active {
      color: #db6800;

      .bottom-navbar__icon {
        background: #fff0e5;
        border: 1px solid rgba(14, 19, 24, 0.09);
        box-shadow: 0 4px 7px rgba(51, 51, 51, 0.1);
      }
    }

    &--disabled {
      opacity: 0.4;
      cursor: not-allowed;
      pointer-events: none;
    }
  }

  &__icon {
    @include flex-center;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    transition: background-color $transition-fast, box-shadow $transition-fast;

    svg {
      width: 22px;
      height: 22px;
    }
  }

  // &__svg-fill {
  //   fill: #e5e7eb;

  //   .bottom-navbar__item--active & {
  //     fill: #FFCBA3;
  //   }
  // }

  &__label {
    font-size: 12px;
    font-weight: $font-weight-semibold;
    white-space: nowrap;
  }
}
</style>
