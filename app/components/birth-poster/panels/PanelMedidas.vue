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
    <h3 class="panel-medidas__title">
      <svg class="panel-medidas__title-icon" width="20" height="20" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13.8957 5.27089L15.3332 6.70839M11.0207 8.14589L12.4582 9.58339M8.14572 11.0209L9.58322 12.4584M5.27072 13.8959L6.70822 15.3334M2.45863 16.8339L6.16606 20.5413C6.35582 20.7311 6.4507 20.8259 6.56011 20.8615C6.65635 20.8928 6.76001 20.8928 6.85625 20.8615C6.96566 20.8259 7.06054 20.7311 7.25029 20.5413L20.5411 7.25054C20.7308 7.06078 20.8257 6.9659 20.8613 6.85649C20.8925 6.76026 20.8925 6.65659 20.8613 6.56035C20.8257 6.45095 20.7308 6.35607 20.5411 6.16631L16.8336 2.45887C16.6439 2.26911 16.549 2.17424 16.4396 2.13869C16.3433 2.10742 16.2397 2.10742 16.1434 2.13869C16.034 2.17424 15.9392 2.26911 15.7494 2.45887L2.45863 15.7496C2.26887 15.9394 2.17399 16.0343 2.13844 16.1437C2.10717 16.2399 2.10717 16.3436 2.13844 16.4398C2.17399 16.5492 2.26887 16.6441 2.45863 16.8339Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Medidas del poster
    </h3>

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
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__title-icon {
    color: $color-brand;
    flex-shrink: 0;
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
