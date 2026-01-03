<script setup lang="ts">
import type { PersonalizaSize } from '~/stores/personaliza'

const store = usePersonalizaStore()

// Get sizes for current orientation
const availableSizes = computed(() => {
  return Object.entries(store.availableSizes).map(([key, data]) => ({
    id: key as PersonalizaSize,
    ...data,
  }))
})

// Check orientation for aspect ratio
const isVertical = computed(() => store.orientation === 'vertical')
const isSquare = computed(() => store.orientation === 'square')

// Get size dimensions
function getSizeDimensions(sizeId: PersonalizaSize): { width: number; height: number } {
  const size = store.availableSizes[sizeId]
  if (!size) return { width: 0, height: 0 }
  const [width, height] = size.label.split(' x ').map(s => parseInt(s))
  return { width: width || 0, height: height || 0 }
}

// Format size label (e.g., "50x70")
function formatSizeLabel(sizeId: PersonalizaSize): string {
  const dims = getSizeDimensions(sizeId)
  return `${dims.width}x${dims.height}`
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

    <!-- Orientation indicator -->
    <!-- <div class="panel-medidas__orientation">
      <span class="panel-medidas__orientation-label">Formato:</span>
      <span class="panel-medidas__orientation-value">
        {{ store.orientation === 'square' ? 'Cuadrado' : store.orientation === 'horizontal' ? 'Horizontal' : 'Vertical' }}
      </span>
    </div> -->

    <!-- Size options -->
    <div class="panel-medidas__sizes">
      <div
        v-for="size in availableSizes"
        :key="size.id"
        class="panel-medidas__size-wrapper"
      >
        <button
          :class="[
            'panel-medidas__size',
            'panel-medidas__size--' + store.orientation,
            { 'panel-medidas__size--active': store.posterSize === size.id }
          ]"
          @click="store.setPosterSize(size.id)"
        >
          <span class="panel-medidas__size-label">{{ formatSizeLabel(size.id) }}</span>
        </button>
        <div class="panel-medidas__size-details">
          <span class="panel-medidas__size-detail">{{ getSizeDimensions(size.id).width }}cm ancho</span>
          <span class="panel-medidas__size-detail">{{ getSizeDimensions(size.id).height }}cm alto</span>
        </div>
      </div>
    </div>

    <!-- Info note -->
    <div class="panel-medidas__info">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 16v-4"/>
        <path d="M12 8h.01"/>
      </svg>
      <p>
        Para cambiar la orientacion, selecciona un formato diferente en la seccion de Archivo.
      </p>
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

  // Orientation indicator
  &__orientation {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: #f5f5f5;
    border-radius: 8px;
  }

  &__orientation-label {
    font-family: $font-primary;
    font-size: 14px;
    color: #717680;
  }

  &__orientation-value {
    font-family: $font-primary;
    font-size: 14px;
    font-weight: $font-weight-semibold;
    color: $color-brand;
  }

  &__sizes {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }

  &__size-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
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
      aspect-ratio: 3 / 4;
    }

    &--horizontal {
      aspect-ratio: 4 / 3;
    }

    &--square {
      aspect-ratio: 1 / 1;
    }

    @include hover {
      border-color: $color-brand;
    }

    &--active {
      border-color: $color-brand;
      border-width: 2px;
    }
  }

  &__size-label {
    font-family: $font-primary;
    font-size: 14px;
    font-weight: $font-weight-semibold;
    color: #2f3038;
    text-align: center;

    .panel-medidas__size--active & {
      color: $color-brand;
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

  // Info note
  &__info {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 12px 16px;
    background: #f0f9ff;
    border-radius: 8px;

    svg {
      flex-shrink: 0;
      color: #0ea5e9;
      margin-top: 2px;
    }

    p {
      font-family: $font-primary;
      font-size: 13px;
      color: #0369a1;
      margin: 0;
      line-height: 1.4;
    }
  }
}
</style>
