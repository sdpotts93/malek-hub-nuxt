<script setup lang="ts">
import type { PanelType } from '~/types'

interface NavItem {
  id: PanelType
  label: string
  icon: string
}

interface Props {
  items: NavItem[]
  activePanel: PanelType | null
}

defineProps<Props>()
const emit = defineEmits<{
  select: [panel: PanelType]
}>()

const store = useBirthPosterStore()
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
        { 'bottom-navbar__item--active': activePanel === item.id }
      ]"
      @click="emit('select', item.id)"
    >
      <!-- Warning badge for datos when missing data -->
      <span
        v-if="item.id === 'datos' && store.hasMissingDatosData"
        class="bottom-navbar__badge"
      >!</span>
      <span class="bottom-navbar__icon">
        <!-- General (settings) icon -->
        <svg v-if="item.id === 'general'" width="24" height="24" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">
            <circle cx="8" cy="8" r="1.75"/>
            <path d="m6.75 1.75-.5 1.5-1.5 1-2-.5-1 2 1.5 1.5v1.5l-1.5 1.5 1 2 2-.5 1.5 1 .5 1.5h2.5l.5-1.5 1.5-1 2 .5 1-2-1.5-1.5v-1.5l1.5-1.5-1-2-2 .5-1.5-1-.5-1.5z"/>
          </g>
        </svg>
        <!-- Diseño (brush) icon -->
        <svg v-else-if="item.id === 'diseno'" width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8.62506 10.7546L12.2454 14.375M7.64264 20.1009C6.33276 21.4108 3.83341 21.0833 1.91675 21.0833C2.89914 19.1667 1.58925 16.6673 2.89914 15.3574C4.20902 14.0475 6.33276 14.0475 7.64264 15.3574C8.95253 16.6673 8.95253 18.791 7.64264 20.1009ZM11.4249 15.2611L20.1813 5.80419C20.9526 4.97124 20.9277 3.67769 20.125 2.875C19.3223 2.07231 18.0288 2.04744 17.1958 2.81869L7.73894 11.5751C7.25026 12.0276 7.00591 12.2538 6.8634 12.4951C6.52168 13.0737 6.50793 13.789 6.82716 14.3803C6.96029 14.6269 7.19576 14.8624 7.6667 15.3333C8.13763 15.8043 8.3731 16.0397 8.61969 16.1729C9.21101 16.4921 9.92632 16.4784 10.5049 16.1366C10.7462 15.9941 10.9725 15.7498 11.4249 15.2611Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <!-- Datos (feather) icon -->
        <svg v-else-if="item.id === 'datos'" width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15.3334 7.66665L1.91675 21.0833M17.2501 14.375H8.62508M6.32508 18.2083H12.7816C13.016 18.2083 13.1332 18.2083 13.2435 18.1818C13.3413 18.1584 13.4348 18.1196 13.5205 18.0671C13.6172 18.0078 13.7001 17.925 13.8658 17.7592L18.6876 12.9375C18.9166 12.7085 19.0311 12.594 19.1232 12.4926C21.1167 10.2995 21.1167 6.95047 19.1232 4.75737C19.0311 4.65599 18.9166 4.54149 18.6876 4.31249C18.4586 4.08348 18.3441 3.96898 18.2427 3.87683C16.0496 1.88334 12.7006 1.88334 10.5075 3.87683C10.4061 3.96898 10.2916 4.08348 10.0626 4.31248L5.24085 9.13422C5.07511 9.29996 4.99223 9.38283 4.93297 9.47955C4.88042 9.56529 4.8417 9.65877 4.81823 9.75655C4.79175 9.86685 4.79175 9.98405 4.79175 10.2184V16.675C4.79175 17.2117 4.79175 17.4801 4.8962 17.6851C4.98808 17.8654 5.13469 18.012 5.31501 18.1039C5.52001 18.2083 5.78836 18.2083 6.32508 18.2083Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <!-- Medidas (ruler) icon -->
        <svg v-else-if="item.id === 'medidas'" width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13.8957 5.27089L15.3332 6.70839M11.0207 8.14589L12.4582 9.58339M8.14572 11.0209L9.58322 12.4584M5.27072 13.8959L6.70822 15.3334M2.45863 16.8339L6.16606 20.5413C6.35582 20.7311 6.4507 20.8259 6.56011 20.8615C6.65635 20.8928 6.76001 20.8928 6.85625 20.8615C6.96566 20.8259 7.06054 20.7311 7.25029 20.5413L20.5411 7.25054C20.7308 7.06078 20.8257 6.9659 20.8613 6.85649C20.8925 6.76026 20.8925 6.65659 20.8613 6.56035C20.8257 6.45095 20.7308 6.35607 20.5411 6.16631L16.8336 2.45887C16.6439 2.26911 16.549 2.17424 16.4396 2.13869C16.3433 2.10742 16.2397 2.10742 16.1434 2.13869C16.034 2.17424 15.9392 2.26911 15.7494 2.45887L2.45863 15.7496C2.26887 15.9394 2.17399 16.0343 2.13844 16.1437C2.10717 16.2399 2.10717 16.3436 2.13844 16.4398C2.17399 16.5492 2.26887 16.6441 2.45863 16.8339Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <!-- Marco (frame) icon -->
        <svg v-else-if="item.id === 'marco'" width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clip-path="url(#clip0_frame_bp_bottom)">
            <path d="M8.08496 5.18176H14.915C15.6145 5.18176 16.079 5.18291 16.4355 5.21204C16.7805 5.24022 16.9358 5.28985 17.0322 5.33899C17.3029 5.477 17.5232 5.69714 17.6611 5.9679C17.7102 6.06431 17.7599 6.21918 17.7881 6.5636C17.8172 6.92021 17.8184 7.38549 17.8184 8.08508V14.9152C17.8184 15.6146 17.8172 16.0791 17.7881 16.4357C17.7599 16.7806 17.7103 16.9359 17.6611 17.0323C17.5231 17.3031 17.303 17.5233 17.0322 17.6613C16.9358 17.7104 16.7805 17.76 16.4355 17.7882C16.079 17.8173 15.6145 17.8185 14.915 17.8185H8.08496C7.38537 17.8185 6.92008 17.8173 6.56348 17.7882C6.21905 17.76 6.06419 17.7103 5.96777 17.6613C5.69702 17.5233 5.47687 17.3031 5.33887 17.0323C5.28973 16.9359 5.2401 16.7806 5.21191 16.4357C5.18279 16.0791 5.18164 15.6146 5.18164 14.9152V8.08508C5.18164 7.38549 5.18278 6.92021 5.21191 6.5636C5.2401 6.21902 5.28976 6.06429 5.33887 5.9679C5.47687 5.69706 5.69693 5.47699 5.96777 5.33899C6.06417 5.28988 6.2189 5.24022 6.56348 5.21204C6.92008 5.1829 7.38537 5.18176 8.08496 5.18176Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M16.0127 0.82959C16.8987 0.82959 17.6233 0.828465 18.2109 0.876465C18.8103 0.925435 19.355 1.03008 19.8643 1.28955C20.6588 1.69444 21.3051 2.34068 21.71 3.13525C21.9694 3.64449 22.0741 4.18921 22.123 4.78857C22.1711 5.37618 22.1699 6.10084 22.1699 6.98682V16.0132C22.1699 16.8992 22.171 17.6238 22.123 18.2114C22.0741 18.8108 21.9694 19.3555 21.71 19.8647C21.3051 20.6593 20.6589 21.3055 19.8643 21.7104C19.355 21.9699 18.8103 22.0746 18.2109 22.1235C17.6233 22.1715 16.8987 22.1704 16.0127 22.1704H6.98633C6.10035 22.1704 5.37569 22.1715 4.78809 22.1235C4.18872 22.0746 3.644 21.9699 3.13477 21.7104C2.34019 21.3055 1.69395 20.6593 1.28906 19.8647C1.02959 19.3555 0.924947 18.8108 0.875977 18.2114C0.827976 17.6238 0.829101 16.8992 0.829102 16.0132V6.98682C0.829102 6.10084 0.827971 5.37618 0.875977 4.78857C0.924947 4.18921 1.02959 3.64449 1.28906 3.13525C1.69396 2.34069 2.3402 1.69445 3.13477 1.28955C3.644 1.03008 4.18872 0.925435 4.78809 0.876465C5.37569 0.828459 6.10035 0.82959 6.98633 0.82959H16.0127Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </g>
          <defs>
            <clipPath id="clip0_frame_bp_bottom">
              <rect width="23" height="23" fill="white"/>
            </clipPath>
          </defs>
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
