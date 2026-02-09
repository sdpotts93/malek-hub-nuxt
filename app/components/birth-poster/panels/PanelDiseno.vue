<script setup lang="ts">
import { ILLUSTRATION_COLORS, BABY_STYLES } from '~/types'
import type { BabyOrientation } from '~/types'

interface Props {
  // Hide the baby tabs (used in desktop scrollable view where unified tabs are shown)
  hideBabyTabs?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  hideBabyTabs: false,
})

const store = useBirthPosterStore()

const orientationOptions: { id: BabyOrientation; label: string }[] = [
  { id: 'izquierda', label: 'Izquierda' },
  { id: 'derecha', label: 'Derecha' },
]

// Computed for reactivity
const isFlipped = computed(() => store.currentBaby.orientation === 'derecha')

// Color scroll container ref
const colorScrollRef = ref<HTMLElement | null>(null)

const scrollColors = (direction: 'left' | 'right') => {
  if (!colorScrollRef.value) return
  const scrollAmount = 100
  colorScrollRef.value.scrollBy({
    left: direction === 'left' ? -scrollAmount : scrollAmount,
    behavior: 'smooth'
  })
}
</script>

<template>
  <div class="panel-diseno">

    <!-- Baby Tabs (if multiple babies and not hidden) -->
    <BirthPosterBabyTabs v-if="store.babyCount > 1 && !props.hideBabyTabs" underline class="panel-diseno__tabs" />

    <h3 class="panel-diseno__title">
      <svg class="panel-diseno__title-icon" width="20" height="20" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8.62506 10.7546L12.2454 14.375M7.64264 20.1009C6.33276 21.4108 3.83341 21.0833 1.91675 21.0833C2.89914 19.1667 1.58925 16.6673 2.89914 15.3574C4.20902 14.0475 6.33276 14.0475 7.64264 15.3574C8.95253 16.6673 8.95253 18.791 7.64264 20.1009ZM11.4249 15.2611L20.1813 5.80419C20.9526 4.97124 20.9277 3.67769 20.125 2.875C19.3223 2.07231 18.0288 2.04744 17.1958 2.81869L7.73894 11.5751C7.25026 12.0276 7.00591 12.2538 6.8634 12.4951C6.52168 13.0737 6.50793 13.789 6.82716 14.3803C6.96029 14.6269 7.19576 14.8624 7.6667 15.3333C8.13763 15.8043 8.3731 16.0397 8.61969 16.1729C9.21101 16.4921 9.92632 16.4784 10.5049 16.1366C10.7462 15.9941 10.9725 15.7498 11.4249 15.2611Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Diseño del bebé
    </h3>

    <!-- Orientation -->
    <div class="panel-diseno__section">
      <label class="panel-diseno__label">Orientación</label>
      <div class="panel-diseno__orientation">
        <button
          v-for="option in orientationOptions"
          :key="option.id"
          :class="[
            'panel-diseno__orient-btn',
            { 'panel-diseno__orient-btn--active': store.currentBaby.orientation === option.id }
          ]"
          @click="store.setBabyOrientation(option.id)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <!-- Styles -->
    <div class="panel-diseno__section panel-diseno__section--pr0">
      <label class="panel-diseno__label panel-diseno__label--small">Estilos</label>
      <div class="panel-diseno__styles">
        <button
          v-for="style in BABY_STYLES"
          :key="style.id"
          :class="[
            'panel-diseno__style-btn',
            { 'panel-diseno__style-btn--active': store.currentBaby.styleId === style.id }
          ]"
          @click="store.setBabyStyle(style.id)"
        >
          <NuxtImg
            :src="style.thumbnail"
            :alt="style.name"
            class="panel-diseno__style-preview"
            :style="{ transform: isFlipped ? 'scaleX(-1)' : 'none' }"
            loading="lazy"
          />
        </button>
      </div>
    </div>

    <!-- Separator -->
    <div class="panel-diseno__separator" />

    <!-- Illustration Color -->
    <div class="panel-diseno__section panel-diseno__section--pr0">
      <div class="panel-diseno__color-header">
        <label class="panel-diseno__label">Color del bebé</label>
        <div class="panel-diseno__color-nav">
          <button
            class="panel-diseno__nav-btn"
            aria-label="Scroll left"
            @click="scrollColors('left')"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.75 10.5L5.25 7L8.75 3.5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button
            class="panel-diseno__nav-btn"
            aria-label="Scroll right"
            @click="scrollColors('right')"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5.25 3.5L8.75 7L5.25 10.5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
      <div ref="colorScrollRef" class="panel-diseno__colors-scroll">
        <div class="panel-diseno__colors">
          <button
            v-for="color in ILLUSTRATION_COLORS"
            :key="color.id"
            :class="[
              'panel-diseno__color-btn',
              { 'panel-diseno__color-btn--active': store.currentBaby.illustrationColor === color.hex },
              { 'panel-diseno__color-btn--none': color.id === 'none' }
            ]"
            :style="color.id !== 'none' ? { backgroundColor: color.hex } : undefined"
            :aria-label="color.name"
            :title="color.name"
            @click="store.setBabyColor(color.hex)"
          >
            <span v-if="color.id === 'none'" class="panel-diseno__color-none" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.panel-diseno {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 20px;
  @include mobile {
    padding-top: 0;
  }

  &__title {
    font-family: $font-primary;
    font-size: 16px;
    font-weight: $font-weight-semibold;
    line-height: 24px;
    color: #2f3038;
    margin: 0;
    padding-inline: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
    @include mobile {
      display: none;
    }
  }

  &__title-icon {
    color: $color-brand;
    flex-shrink: 0;
    path:not(.omit-fill), rect:not(.omit-fill) {
      fill: $color-icon-fill;
    }
  }

  &__tabs {
    margin-bottom: 8px;
    margin-top: -20px;
    @include mobile {
      border-top-right-radius: 8px;
      border-top-left-radius: 8px;
      margin-top: 0;
      margin-inline: 20px;
    }
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-inline: 20px;

    &--pr0 {
      padding-right: 0;
    }
  }

  &__separator {
    height: 1px;
    background-color: #e5e7eb;
    width: calc(100% - 40px);
    margin: 4px auto;
  }

  &__label {
    font-family: $font-primary;
    font-size: 16px;
    // font-weight: $font-weight-semibold;
    line-height: 24px;
    color: #2f3038;

    &--small {
      font-size: 14px;
      color: #2f3039;
    }
  }

  // Orientation - segmented control style
  &__orientation {
    display: flex;
    align-items: center;
    background: #f5f5f5;
    border-radius: 8px;
    overflow: hidden;
    gap: 0;
  }

  &__orient-btn {
    @include button-reset;
    flex: 1;
    min-height: 40px;
    padding: 10px 12px;
    font-family: $font-primary;
    font-size: 15px;
    font-weight: $font-weight-bold;
    color: #181d27;
    text-align: center;
    position: relative;

    &--active {
      background: #ffffff;
      border: 1px solid #d5d7da;
      box-shadow: 0 0 12px rgba(0, 0, 0, 0.08);
      z-index: 1;
      border-radius: 8px;
    }
  }

  // Styles grid - responsive: 4 items per row, full width
  &__styles {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    padding-right: 20px;
  }

  &__style-btn {
    @include button-reset;
    aspect-ratio: 1;
    width: 100%;
    border-radius: 12px;
    border: 1px solid #e9eaeb;
    overflow: hidden;
    background: #ffffff;
    transition: border-color $transition-fast;
    position: relative;

    @include hover {
      border-color: #252b37;
    }

    &--active {
      border-color: #252b37;
      border-width: 2px;
    }
  }

  &__style-preview {
    width: 100%;
    height: 100%;
    object-fit: contain;
    transition: transform $transition-fast;
  }

  // Color header with title and arrows - matches panel-general
  &__color-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-right: 20px;
  }

  &__color-nav {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #fafafa;
    border-radius: 5px;
    padding: 4px 5px;
  }

  &__nav-btn {
    @include button-reset;
    @include flex-center;
    width: 14px;
    height: 14px;
    cursor: pointer;

    svg {
      display: block;
      stroke: $color-brand;
    }

    @include hover {
      opacity: 0.7;
    }
  }

  // Color picker - horizontal scroll container
  &__colors-scroll {
    overflow-x: auto;
    overflow-y: visible;
    padding: 8px 0;
    margin: -8px 0;
    scrollbar-width: none;
    -ms-overflow-style: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  &__colors {
    display: flex;
    gap: 14px;
    padding-left: 6px;

    &::after {
      content: '';
      min-width: 20px;
      flex-shrink: 0;
    }
  }

  &__color-btn {
    @include button-reset;
    @include flex-center;
    width: 40px;
    height: 40px;
    min-width: 40px;
    border-radius: 100px;
    border: 1px solid $color-border;
    transition: box-shadow $transition-fast;
    position: relative;
    flex-shrink: 0;

    @include hover {
      opacity: 0.9;
    }

    &--active {
      box-shadow: 0 0 0 3px #ffffff, 0 0 0 5.5px #000000;
    }

    &--none {
      background-color: #ffffff;
    }

    svg {
      color: #ffffff;
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
    }
  }

  &__color-none {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;

    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 80%;
      height: 2px;
      background-color: #d1d5db;
      transform: translate(-50%, -50%) rotate(-45deg);
      border-radius: 1px;
    }
  }
}
</style>
