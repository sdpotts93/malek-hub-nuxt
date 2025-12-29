<script setup lang="ts">
import { POSTER_SIZES } from '~/types'
import type { PosterSize } from '~/types'

const store = useBirthPosterStore()

// Get the 1:1 scale size
const scaleSize = computed(() => {
  const size = store.scaleSize
  return {
    id: size,
    ...POSTER_SIZES[size],
  }
})

// Get other sizes (non-scale)
const otherSizes = computed(() => {
  return store.availableSizes
    .filter((size) => size !== store.scaleSize)
    .map((size) => ({
      id: size,
      ...POSTER_SIZES[size],
    }))
})

// Check if vertical orientation (1-2 babies)
const isVertical = computed(() => store.babyCount <= 2)

// Format size label (e.g., "50x70")
function formatSizeLabel(size: PosterSize): string {
  const sizeData = POSTER_SIZES[size]
  return `${sizeData.width}x${sizeData.height}`
}

// Get size dimensions for explanation
function getSizeDimensions(size: PosterSize): { width: number; height: number } {
  return POSTER_SIZES[size]
}

function selectSize(size: PosterSize) {
  store.setPosterSize(size)
}
</script>

<template>
  <div class="panel-medidas">
    <h3 class="panel-medidas__title">Medidas del poster</h3>

    <!-- Scale size label -->
    <!-- <p class="panel-medidas__description">
      Puedes seleccionar los siguientes tamaños para tu impresión {{ isVertical ? 'vertical' : 'horizontal' }}.
    </p> -->

    <!-- 1:1 Scale size option -->
    <div class="panel-medidas__scale-sizes">
      <div class="panel-medidas__size-wrapper">
        <button
          :class="[
            'panel-medidas__size',
            'panel-medidas__size--' + (isVertical ? 'vertical' : 'horizontal'),
            { 'panel-medidas__size--active': store.posterSize === scaleSize.id }
          ]"
          @click="selectSize(scaleSize.id)"
        >
          <span class="panel-medidas__size-label">{{ formatSizeLabel(scaleSize.id) }}</span>
        </button>
        <div class="panel-medidas__size-details">
          <span class="panel-medidas__size-detail">{{ getSizeDimensions(scaleSize.id).width }}cm ancho</span>
          <span class="panel-medidas__size-detail">{{ getSizeDimensions(scaleSize.id).height }}cm alto</span>
        </div>
      </div>
    </div>

    <!-- Warning highlight for other sizes -->
    <div class="panel-medidas__highlight">
      <span class="panel-medidas__highlight-text">
        Puedes seleccionar otros tamaños, pero ya no serán escala 1:1 de tu bebé
      </span>
    </div>

    <!-- Other sizes -->
    <div class="panel-medidas__sizes">
      <div
        v-for="size in otherSizes"
        :key="size.id"
        class="panel-medidas__size-wrapper"
      >
        <button
          :class="[
            'panel-medidas__size',
            'panel-medidas__size--' + (isVertical ? 'vertical' : 'horizontal'),
            { 'panel-medidas__size--active': store.posterSize === size.id }
          ]"
          @click="selectSize(size.id)"
        >
          <span class="panel-medidas__size-label">{{ formatSizeLabel(size.id) }}</span>
        </button>
        <div class="panel-medidas__size-details">
          <span class="panel-medidas__size-detail">{{ getSizeDimensions(size.id).width }}cm ancho</span>
          <span class="panel-medidas__size-detail">{{ getSizeDimensions(size.id).height }}cm alto</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.panel-medidas {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-inline: 20px;

  &__title {
    font-family: $font-primary;
    font-size: 16px;
    font-weight: $font-weight-semibold;
    line-height: 24px;
    color: #2f3038;
    margin: 0;
  }

  &__description {
    font-family: $font-primary;
    font-size: 14px;
    font-weight: $font-weight-normal;
    color: #717680;
    margin: 0;
    line-height: 1.4;
  }

  &__scale-sizes {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }

  &__highlight {
    background: #fef3c7;
    border: 1px solid #fcd34d;
    border-radius: 8px;
    padding: 12px 14px;
  }

  &__highlight-text {
    font-family: $font-primary;
    font-size: 13px;
    font-weight: $font-weight-normal;
    color: #92400e;
    line-height: 1.4;
  }

  &__sizes {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }

  &__size {
    @include button-reset;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #e9eaeb;
    border-radius: 12px;
    background: #ffffff;
    transition: border-color $transition-fast;

    &--vertical {
      aspect-ratio: 5 / 7;
    }

    &--horizontal {
      aspect-ratio: 10 / 7;
    }

    @include hover {
      border-color: #db6800;
    }

    &--active {
      border-color: #db6800;
      border-width: 2px;
    }
  }

  &__size-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }

  &__size-label {
    font-family: $font-primary;
    font-size: 14px;
    font-weight: $font-weight-semibold;
    color: #2f3038;
    text-align: center;

    .panel-medidas__size--active & {
      color: #db6800;
    }
  }

  &__size-details {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  &__size-detail {
    font-family: $font-primary;
    font-size: 10px;
    font-weight: $font-weight-normal;
    color: #717680;
    text-align: center;
  }
}
</style>
