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
  gap: 20px;
  padding-inline: 20px;

  &__title {
    font-family: $font-primary;
    font-size: 16px;
    font-weight: $font-weight-semibold;
    line-height: 24px;
    color: #2f3038;
    margin: 0;
  }

  &__info {
    font-family: $font-primary;
    font-size: 14px;
    color: #717680;
    margin: 0;
  }

  // Grid layout for frame options - 74x74px items
  &__frames {
    display: grid;
    grid-template-columns: repeat(4, 74px);
    gap: 8px;
  }

  &__option {
    @include button-reset;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 74px;
    height: 74px;
    padding: 8px;
    border: 1px solid #e9eaeb;
    border-radius: 12px;
    background: #ffffff;
    transition: border-color $transition-fast;

    @include hover {
      border-color: #db6800;
    }

    &--active {
      border-color: #db6800;
      border-width: 2px;
    }
  }

  &__preview {
    width: 40px;
    height: 50px;
    border-radius: 4px;
    @include flex-center;
    flex-shrink: 0;

    &--none {
      background: #f3f4f6;
      color: #717680;
    }
  }

  &__preview-inner {
    width: 30px;
    height: 40px;
    background: #ffffff;
    border-radius: 2px;
  }

  &__option-info {
    text-align: center;
    margin-top: 4px;
  }

  &__option-name {
    display: block;
    font-family: $font-primary;
    font-size: 11px;
    font-weight: $font-weight-semibold;
    color: #2f3038;
    line-height: 1.2;

    .panel-marco__option--active & {
      color: #db6800;
    }
  }

  &__option-price {
    display: none; // Price shown in cart section
  }
}
</style>
