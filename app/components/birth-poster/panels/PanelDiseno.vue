<script setup lang="ts">
import { ref } from 'vue'
import { ILLUSTRATION_COLORS, BABY_STYLES } from '~/types'
import type { BabyOrientation } from '~/types'

const store = useBirthPosterStore()

const orientationOptions: { id: BabyOrientation; label: string }[] = [
  { id: 'izquierda', label: 'Izquierda' },
  { id: 'derecha', label: 'Derecha' },
]

// Computed for reactivity
const isFlipped = computed(() => store.currentBaby.orientation === 'derecha')

// Get the current illustration color for the preview
const currentIllustrationColor = computed(() => store.currentBaby.illustrationColor)

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

    <!-- Baby Tabs (if multiple babies) -->
    <BirthPosterBabyTabs v-if="store.babyCount > 1" class="panel-diseno__tabs" />

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
          <span
            class="panel-diseno__style-mask"
            :style="{
              backgroundColor: currentIllustrationColor,
              maskImage: `url(${style.thumbnail})`,
              WebkitMaskImage: `url(${style.thumbnail})`,
              transform: isFlipped ? 'scaleX(-1)' : 'none'
            }"
          />
        </button>
      </div>
    </div>

    <!-- Separator -->
    <div class="panel-diseno__separator" />

    <!-- Illustration Color -->
    <div class="panel-diseno__section panel-diseno__section--pr0">
      <div class="panel-diseno__color-header">
        <label class="panel-diseno__label">Color de la ilustración</label>
        <div class="panel-diseno__color-nav">
          <button
            class="panel-diseno__nav-btn"
            aria-label="Scroll left"
            @click="scrollColors('left')"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.75 10.5L5.25 7L8.75 3.5" stroke="#F2330D" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button
            class="panel-diseno__nav-btn"
            aria-label="Scroll right"
            @click="scrollColors('right')"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5.25 3.5L8.75 7L5.25 10.5" stroke="#F2330D" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
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
              { 'panel-diseno__color-btn--active': store.currentBaby.illustrationColor === color.hex }
            ]"
            :style="{ backgroundColor: color.hex }"
            :aria-label="color.name"
            :title="color.name"
            @click="store.setBabyColor(color.hex)"
          />
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

  &__tabs {
    margin-bottom: 8px;
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
    background-color: $color-border;
    width: calc(100% - 40px);
    margin: 0 auto;
  }

  &__label {
    font-family: $font-primary;
    font-size: 16px;
    font-weight: $font-weight-semibold;
    line-height: 24px;
    color: #2f3038;

    &--small {
      font-size: 14px;
      color: #2f3039;
    }
  }

  // Orientation - button group style (butted together)
  &__orientation {
    display: flex;
    border-radius: 8px;
    overflow: hidden;
  }

  &__orient-btn {
    @include button-reset;
    flex: 1;
    min-height: 40px;
    padding: 10px 16px;
    font-family: $font-primary;
    font-size: 16px;
    font-weight: $font-weight-bold;
    background: #f5f5f5;
    color: #414651;
    border-right: 1px solid #e9eaeb;
    transition: background-color $transition-fast, color $transition-fast;

    &:last-child {
      border-right: none;
    }

    @include hover {
      background: #ebebeb;
    }

    &--active {
      background: #fff0e5;
      color: #db6800;
      border-right-color: #eaddd3;
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
      border-color: #db6800;
    }

    &--active {
      border-color: #db6800;
      border-width: 2px;
    }
  }

  &__style-mask {
    display: block;
    width: 100%;
    height: 100%;
    mask-size: contain;
    mask-repeat: no-repeat;
    mask-position: center;
    -webkit-mask-size: contain;
    -webkit-mask-repeat: no-repeat;
    -webkit-mask-position: center;
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

    svg {
      color: #ffffff;
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
    }
  }
}
</style>
