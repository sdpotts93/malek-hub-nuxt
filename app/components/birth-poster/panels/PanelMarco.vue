<script setup lang="ts">
import type { FrameStyle } from '~/types'

const store = useBirthPosterStore()

// Mock frame styles
const frameStyles: FrameStyle[] = [
  { id: 'frame-natural', name: 'Natural', image: '', price: 850 },
  { id: 'frame-black', name: 'Negro', image: '', price: 850 },
  { id: 'frame-white', name: 'Blanco', image: '', price: 850 },
  { id: 'frame-oak', name: 'Roble', image: '', price: 950 },
]

const { formatPrice } = useShopifyCart()

function selectFrame(frame: FrameStyle | null) {
  store.setFrameStyle(frame)
}

// Frame colors for preview
const frameColors: Record<string, string> = {
  'frame-natural': '#c4a882',
  'frame-black': '#2d2d2d',
  'frame-white': '#f5f5f5',
  'frame-oak': '#8b5a2b',
}
</script>

<template>
  <div class="panel-marco">
    <h3 class="panel-marco__title">Marco</h3>

    <p class="panel-marco__info">
      Añade un marco de madera de alta calidad a tu poster
    </p>

    <!-- No frame option -->
    <button
      :class="[
        'panel-marco__option',
        { 'panel-marco__option--active': !store.frameStyle }
      ]"
      @click="selectFrame(null)"
    >
      <div class="panel-marco__preview panel-marco__preview--none">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6 6 18"/>
          <path d="m6 6 12 12"/>
        </svg>
      </div>
      <div class="panel-marco__option-info">
        <span class="panel-marco__option-name">Sin marco</span>
        <span class="panel-marco__option-price">Incluido</span>
      </div>
    </button>

    <!-- Frame options -->
    <div class="panel-marco__frames">
      <button
        v-for="frame in frameStyles"
        :key="frame.id"
        :class="[
          'panel-marco__option',
          { 'panel-marco__option--active': store.frameStyle?.id === frame.id }
        ]"
        @click="selectFrame(frame)"
      >
        <div
          class="panel-marco__preview"
          :style="{ backgroundColor: frameColors[frame.id] }"
        >
          <div class="panel-marco__preview-inner" />
        </div>
        <div class="panel-marco__option-info">
          <span class="panel-marco__option-name">{{ frame.name }}</span>
          <span class="panel-marco__option-price">+{{ formatPrice(frame.price) }}</span>
        </div>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.panel-marco {
  display: flex;
  flex-direction: column;
  gap: $space-3xl;

  &__title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
  }

  &__info {
    font-size: $font-size-sm;
    color: $color-text-secondary;
  }

  &__frames {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: $space-lg;
  }

  &__option {
    @include button-reset;
    display: flex;
    align-items: center;
    gap: $space-lg;
    padding: $space-lg;
    border: 2px solid $color-border;
    border-radius: $radius-xl;
    transition: border-color $transition-fast, background-color $transition-fast;

    @include hover {
      border-color: $color-brand;
    }

    &--active {
      border-color: $color-brand;
      background: $color-brand-light;
    }
  }

  &__preview {
    width: 60px;
    height: 75px;
    border-radius: $radius-md;
    @include flex-center;
    flex-shrink: 0;

    &--none {
      background: $color-bg-tertiary;
      color: $color-text-muted;
    }
  }

  &__preview-inner {
    width: 44px;
    height: 59px;
    background: $color-bg-primary;
    border-radius: 2px;
  }

  &__option-info {
    flex: 1;
    text-align: left;
  }

  &__option-name {
    display: block;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: $color-text-primary;

    .panel-marco__option--active & {
      color: $color-brand;
    }
  }

  &__option-price {
    display: block;
    font-size: $font-size-xs;
    color: $color-text-muted;
    margin-top: $space-xs;
  }
}
</style>
