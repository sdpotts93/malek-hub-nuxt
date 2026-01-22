<script setup lang="ts">
import type { PersonalizaPanelType } from '~/stores/personaliza'

interface NavItem {
  id: PersonalizaPanelType
  label: string
  icon: string
}

interface Props {
  items: NavItem[]
  activePanel: PersonalizaPanelType
}

defineProps<Props>()
const emit = defineEmits<{
  select: [panel: PersonalizaPanelType]
}>()

const store = usePersonalizaStore()
</script>

<template>
  <nav class="sidebar-nav">
    <button
      v-for="item in items"
      :key="item.id"
      :class="[
        'sidebar-nav__item',
        { 'sidebar-nav__item--active': activePanel === item.id },
        { 'sidebar-nav__item--disabled': item.id !== 'archivo' && !store.hasImage }
      ]"
      :disabled="item.id !== 'archivo' && !store.hasImage"
      :aria-current="activePanel === item.id ? 'true' : undefined"
      @click="emit('select', item.id)"
    >
      <!-- Warning badge for archivo when no image -->
      <span
        v-if="item.id === 'archivo' && !store.hasImage"
        class="sidebar-nav__badge"
      >!</span>
      <span class="sidebar-nav__icon">
        <!-- Image/Archivo icon -->
        <svg v-if="item.id === 'archivo'" class="sidebar-nav__svg" width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6.75 8.66667C7.80855 8.66667 8.66667 7.80855 8.66667 6.75C8.66667 5.69145 7.80855 4.83333 6.75 4.83333C5.69145 4.83333 4.83333 5.69145 4.83333 6.75C4.83333 7.80855 5.69145 8.66667 6.75 8.66667Z"/>
          <path d="M1 5.6C1 3.98985 1 3.18477 1.31336 2.56978C1.58899 2.02881 2.02881 1.58899 2.56978 1.31336C3.18477 1 3.98985 1 5.6 1H15.5667C17.1768 1 17.9819 1 18.5969 1.31336C19.1379 1.58899 19.5777 2.02881 19.8533 2.56978C20.1667 3.18477 20.1667 3.98985 20.1667 5.6V13.65C20.1667 15.2602 20.1667 16.0652 19.8533 16.6802C19.5777 17.2212 19.1379 17.661 18.5969 17.9366C17.9819 18.25 17.1768 18.25 15.5667 18.25H5.6C3.98985 18.25 3.18477 18.25 2.56978 17.9366C2.02881 17.661 1.58899 17.2212 1.31336 16.6802C1 16.0652 1 15.2602 1 13.65V5.6Z" class="sidebar-nav__svg-fill"/>
          <path d="M3.17742 17.9892L9.4991 11.6676C9.87862 11.288 10.0684 11.0983 10.2872 11.0272C10.4797 10.9647 10.687 10.9647 10.8795 11.0272C11.0983 11.0983 11.2881 11.2881 11.6676 11.6676L17.9471 17.9471M12.5 12.5L15.2491 9.7509C15.6286 9.37138 15.8184 9.18162 16.0372 9.11053C16.2297 9.04799 16.437 9.04799 16.6295 9.11053C16.8483 9.18162 17.038 9.37138 17.4176 9.7509L20.1667 12.5M8.66667 6.75C8.66667 7.80855 7.80855 8.66667 6.75 8.66667C5.69145 8.66667 4.83333 7.80855 4.83333 6.75C4.83333 5.69145 5.69145 4.83333 6.75 4.83333C7.80855 4.83333 8.66667 5.69145 8.66667 6.75ZM5.6 18.25H15.5667C17.1768 18.25 17.9819 18.25 18.5969 17.9366C19.1379 17.661 19.5777 17.2212 19.8533 16.6802C20.1667 16.0652 20.1667 15.2602 20.1667 13.65V5.6C20.1667 3.98985 20.1667 3.18477 19.8533 2.56978C19.5777 2.02881 19.1379 1.58899 18.5969 1.31336C17.9819 1 17.1768 1 15.5667 1H5.6C3.98985 1 3.18477 1 2.56978 1.31336C2.02881 1.58899 1.58899 2.02881 1.31336 2.56978C1 3.18477 1 3.98985 1 5.6V13.65C1 15.2602 1 16.0652 1.31336 16.6802C1.58899 17.2212 2.02881 17.661 2.56978 17.9366C3.18477 18.25 3.98985 18.25 5.6 18.25Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>

        <!-- Text (texto) icon - letter T -->
        <svg v-else-if="item.id === 'texto'" class="sidebar-nav__svg" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 3.875C1 2.98195 1 2.53542 1.1459 2.18319C1.34043 1.71355 1.71355 1.34043 2.18319 1.1459C2.53542 1 2.98195 1 3.875 1H13.4583C14.3514 1 14.7979 1 15.1501 1.1459C15.6198 1.34043 15.9929 1.71355 16.1874 2.18319C16.3333 2.53542 16.3333 2.98195 16.3333 3.875M5.79167 16.3333H11.5417M8.66667 1V16.3333" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <!-- Margen icon -->
        <svg v-else-if="item.id === 'margen'" class="sidebar-nav__svg" width="20" height="22" viewBox="0 0 20 22" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13.4583 3.39583L9.625 7.22917L5.79167 3.39583" fill="currentColor" fill-opacity="0.2"/>
          <path d="M13.4583 17.7708L9.625 13.9375L5.79167 17.7708" fill="currentColor" fill-opacity="0.2"/>
          <path d="M1 10.5833H18.25M9.625 1V7.22917M9.625 7.22917L13.4583 3.39583M9.625 7.22917L5.79167 3.39583M9.625 20.1667V13.9375M9.625 13.9375L13.4583 17.7708M9.625 13.9375L5.79167 17.7708" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>

        <!-- Medidas (ruler) icon -->
        <svg v-else-if="item.id === 'medidas'" class="sidebar-nav__svg" width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13.8957 5.27089L15.3332 6.70839M11.0207 8.14589L12.4582 9.58339M8.14572 11.0209L9.58322 12.4584M5.27072 13.8959L6.70822 15.3334M2.45863 16.8339L6.16606 20.5413C6.35582 20.7311 6.4507 20.8259 6.56011 20.8615C6.65635 20.8928 6.76001 20.8928 6.85625 20.8615C6.96566 20.8259 7.06054 20.7311 7.25029 20.5413L20.5411 7.25054C20.7308 7.06078 20.8257 6.9659 20.8613 6.85649C20.8925 6.76026 20.8925 6.65659 20.8613 6.56035C20.8257 6.45095 20.7308 6.35607 20.5411 6.16631L16.8336 2.45887C16.6439 2.26911 16.549 2.17424 16.4396 2.13869C16.3433 2.10742 16.2397 2.10742 16.1434 2.13869C16.034 2.17424 15.9392 2.26911 15.7494 2.45887L2.45863 15.7496C2.26887 15.9394 2.17399 16.0343 2.13844 16.1437C2.10717 16.2399 2.10717 16.3436 2.13844 16.4398C2.17399 16.5492 2.26887 16.6441 2.45863 16.8339Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>

        <!-- Marco (frame) icon -->
        <svg v-else-if="item.id === 'marco'" class="sidebar-nav__svg" width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clip-path="url(#clip0_frame_pers_sidebar)">
            <path d="M8.08496 5.18176H14.915C15.6145 5.18176 16.079 5.18291 16.4355 5.21204C16.7805 5.24022 16.9358 5.28985 17.0322 5.33899C17.3029 5.477 17.5232 5.69714 17.6611 5.9679C17.7102 6.06431 17.7599 6.21918 17.7881 6.5636C17.8172 6.92021 17.8184 7.38549 17.8184 8.08508V14.9152C17.8184 15.6146 17.8172 16.0791 17.7881 16.4357C17.7599 16.7806 17.7103 16.9359 17.6611 17.0323C17.5231 17.3031 17.303 17.5233 17.0322 17.6613C16.9358 17.7104 16.7805 17.76 16.4355 17.7882C16.079 17.8173 15.6145 17.8185 14.915 17.8185H8.08496C7.38537 17.8185 6.92008 17.8173 6.56348 17.7882C6.21905 17.76 6.06419 17.7103 5.96777 17.6613C5.69702 17.5233 5.47687 17.3031 5.33887 17.0323C5.28973 16.9359 5.2401 16.7806 5.21191 16.4357C5.18279 16.0791 5.18164 15.6146 5.18164 14.9152V8.08508C5.18164 7.38549 5.18278 6.92021 5.21191 6.5636C5.2401 6.21902 5.28976 6.06429 5.33887 5.9679C5.47687 5.69706 5.69693 5.47699 5.96777 5.33899C6.06417 5.28988 6.2189 5.24022 6.56348 5.21204C6.92008 5.1829 7.38537 5.18176 8.08496 5.18176Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M16.0127 0.82959C16.8987 0.82959 17.6233 0.828465 18.2109 0.876465C18.8103 0.925435 19.355 1.03008 19.8643 1.28955C20.6588 1.69444 21.3051 2.34068 21.71 3.13525C21.9694 3.64449 22.0741 4.18921 22.123 4.78857C22.1711 5.37618 22.1699 6.10084 22.1699 6.98682V16.0132C22.1699 16.8992 22.171 17.6238 22.123 18.2114C22.0741 18.8108 21.9694 19.3555 21.71 19.8647C21.3051 20.6593 20.6589 21.3055 19.8643 21.7104C19.355 21.9699 18.8103 22.0746 18.2109 22.1235C17.6233 22.1715 16.8987 22.1704 16.0127 22.1704H6.98633C6.10035 22.1704 5.37569 22.1715 4.78809 22.1235C4.18872 22.0746 3.644 21.9699 3.13477 21.7104C2.34019 21.3055 1.69395 20.6593 1.28906 19.8647C1.02959 19.3555 0.924947 18.8108 0.875977 18.2114C0.827976 17.6238 0.829101 16.8992 0.829102 16.0132V6.98682C0.829102 6.10084 0.827971 5.37618 0.875977 4.78857C0.924947 4.18921 1.02959 3.64449 1.28906 3.13525C1.69396 2.34069 2.3402 1.69445 3.13477 1.28955C3.644 1.03008 4.18872 0.925435 4.78809 0.876465C5.37569 0.828459 6.10035 0.82959 6.98633 0.82959H16.0127Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </g>
          <defs>
            <clipPath id="clip0_frame_pers_sidebar">
              <rect width="23" height="23" fill="white"/>
            </clipPath>
          </defs>
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
    position: relative;

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

      .sidebar-nav__icon path:not(.omit-fill),
      .sidebar-nav__icon rect:not(.omit-fill) {
        fill: $color-icon-fill;
      }

      @include hover {
        .sidebar-nav__icon {
          background: $color-brand-light;
        }
      }
    }

    &--disabled {
      opacity: 0.4;
      cursor: not-allowed;
      pointer-events: none;

      @include hover {
        .sidebar-nav__icon {
          background: transparent;
        }
      }
    }
  }

  &__badge {
    position: absolute;
    top: 4px;
    right: 8px;
    width: 18px;
    height: 18px;
    background: $color-error;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    font-family: $font-primary;
    font-size: 12px;
    font-weight: $font-weight-bold;
    color: #ffffff;
    line-height: 1;
  }

  &__icon {
    @include flex-center;
    width: 40px;
    height: 40px;
    border-radius: $radius-xl;
    transition: background-color $transition-fast, box-shadow $transition-fast;
  }

  &__svg {
    width: 22px;
    height: 22px;
    flex-shrink: 0;
  }

  // &__svg-fill {
  //   fill: #e5e7eb;

  //   .sidebar-nav__item--active & {
  //     fill: #FFCBA3;
  //   }
  // }

  &__label {
    font-family: $font-primary;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    line-height: 18px;
    text-align: center;
  }
}
</style>
