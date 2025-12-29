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

const store = useBirthPosterStore()
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
      <!-- Warning badge for datos when missing data -->
      <span
        v-if="item.id === 'datos' && store.hasMissingDatosData"
        class="sidebar-nav__badge"
      >!</span>
      <span class="sidebar-nav__icon">
        <!-- General (settings) icon -->
        <svg v-if="item.id === 'general'" class="sidebar-nav__svg" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 16 16">
          <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">
            <circle cx="8" cy="8" r="1.75"/>
            <path d="m6.75 1.75-.5 1.5-1.5 1-2-.5-1 2 1.5 1.5v1.5l-1.5 1.5 1 2 2-.5 1.5 1 .5 1.5h2.5l.5-1.5 1.5-1 2 .5 1-2-1.5-1.5v-1.5l1.5-1.5-1-2-2 .5-1.5-1-.5-1.5z"/>
          </g>
        </svg>
        <!-- Diseño (brush) icon -->
        <svg v-else-if="item.id === 'diseno'" class="sidebar-nav__svg" width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8.62506 10.7546L12.2454 14.375M7.64264 20.1009C6.33276 21.4108 3.83341 21.0833 1.91675 21.0833C2.89914 19.1667 1.58925 16.6673 2.89914 15.3574C4.20902 14.0475 6.33276 14.0475 7.64264 15.3574C8.95253 16.6673 8.95253 18.791 7.64264 20.1009ZM11.4249 15.2611L20.1813 5.80419C20.9526 4.97124 20.9277 3.67769 20.125 2.875C19.3223 2.07231 18.0288 2.04744 17.1958 2.81869L7.73894 11.5751C7.25026 12.0276 7.00591 12.2538 6.8634 12.4951C6.52168 13.0737 6.50793 13.789 6.82716 14.3803C6.96029 14.6269 7.19576 14.8624 7.6667 15.3333C8.13763 15.8043 8.3731 16.0397 8.61969 16.1729C9.21101 16.4921 9.92632 16.4784 10.5049 16.1366C10.7462 15.9941 10.9725 15.7498 11.4249 15.2611Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>

        <!-- Datos (feather) icon -->
        <svg v-else-if="item.id === 'datos'" class="sidebar-nav__svg" width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15.3334 7.66665L1.91675 21.0833M17.2501 14.375H8.62508M6.32508 18.2083H12.7816C13.016 18.2083 13.1332 18.2083 13.2435 18.1818C13.3413 18.1584 13.4348 18.1196 13.5205 18.0671C13.6172 18.0078 13.7001 17.925 13.8658 17.7592L18.6876 12.9375C18.9166 12.7085 19.0311 12.594 19.1232 12.4926C21.1167 10.2995 21.1167 6.95047 19.1232 4.75737C19.0311 4.65599 18.9166 4.54149 18.6876 4.31249C18.4586 4.08348 18.3441 3.96898 18.2427 3.87683C16.0496 1.88334 12.7006 1.88334 10.5075 3.87683C10.4061 3.96898 10.2916 4.08348 10.0626 4.31248L5.24085 9.13422C5.07511 9.29996 4.99223 9.38283 4.93297 9.47955C4.88042 9.56529 4.8417 9.65877 4.81823 9.75655C4.79175 9.86685 4.79175 9.98405 4.79175 10.2184V16.675C4.79175 17.2117 4.79175 17.4801 4.8962 17.6851C4.98808 17.8654 5.13469 18.012 5.31501 18.1039C5.52001 18.2083 5.78836 18.2083 6.32508 18.2083Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>

        <!-- Medidas (ruler) icon -->
        <svg v-else-if="item.id === 'medidas'" class="sidebar-nav__svg" width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13.8957 5.27089L15.3332 6.70839M11.0207 8.14589L12.4582 9.58339M8.14572 11.0209L9.58322 12.4584M5.27072 13.8959L6.70822 15.3334M2.45863 16.8339L6.16606 20.5413C6.35582 20.7311 6.4507 20.8259 6.56011 20.8615C6.65635 20.8928 6.76001 20.8928 6.85625 20.8615C6.96566 20.8259 7.06054 20.7311 7.25029 20.5413L20.5411 7.25054C20.7308 7.06078 20.8257 6.9659 20.8613 6.85649C20.8925 6.76026 20.8925 6.65659 20.8613 6.56035C20.8257 6.45095 20.7308 6.35607 20.5411 6.16631L16.8336 2.45887C16.6439 2.26911 16.549 2.17424 16.4396 2.13869C16.3433 2.10742 16.2397 2.10742 16.1434 2.13869C16.034 2.17424 15.9392 2.26911 15.7494 2.45887L2.45863 15.7496C2.26887 15.9394 2.17399 16.0343 2.13844 16.1437C2.10717 16.2399 2.10717 16.3436 2.13844 16.4398C2.17399 16.5492 2.26887 16.6441 2.45863 16.8339Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>

        <!-- Marco (frame) icon -->
        <svg v-else-if="item.id === 'marco'" class="sidebar-nav__svg" width="24" height="24" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M992 1024H32q-13 0-22.5-9.5T0 992V288q0-13 9.5-22.5T32 256h211L488 11l.5-1l.5-1q10-9 23-9t23 9l.5 1l.5 1l245 245h211q13 0 22.5 9.5t9.5 22.5v704q0 13-9.5 22.5T992 1024M512 77L333 256h358zm384 307H128v512h768z" fill="currentColor"/>
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

  &__item {
    position: relative;
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

  &__label {
    font-family: $font-primary;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    line-height: 18px;
    text-align: center;
  }
}
</style>
