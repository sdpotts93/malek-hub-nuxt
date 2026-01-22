<script setup lang="ts">
import { POSTER_SIZES } from '~/types'
import type { PosterSize } from '~/types'

const store = useBirthPosterStore()

// Get all available sizes for the dropdown
const allSizes = computed(() => {
  return store.availableSizes.map((size) => ({
    id: size,
    ...POSTER_SIZES[size],
  }))
})

// Get size dimensions for display
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

    <!-- Size selector dropdown -->
    <div class="panel-medidas__field">
      <label class="panel-medidas__label">
        Medidas del poster sin marco
      </label>
      <div class="panel-medidas__select-wrapper">
        <select
          class="panel-medidas__select"
          :value="store.posterSize"
          @change="selectSize(($event.target as HTMLSelectElement).value as PosterSize)"
        >
          <option v-for="size in allSizes" :key="size.id" :value="size.id">
            {{ getSizeDimensions(size.id).height }} alto x {{ getSizeDimensions(size.id).width }} ancho
          </option>
        </select>
      </div>
    </div>

    <!-- Warning highlight for non-scale sizes -->
    <div v-if="!store.isScaleSize" class="panel-medidas__highlight">
      <span class="panel-medidas__highlight-text">
        Este tamaño no es escala 1:1 de tu bebé
      </span>
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

  &__field {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__label {
    font-family: $font-primary;
    font-size: 15px;
    font-weight: $font-weight-semibold;
    line-height: 24px;
    color: #2f3038;
  }

  &__select-wrapper {
    position: relative;

    &::after {
      content: '';
      position: absolute;
      right: 14px;
      top: 50%;
      transform: translateY(-50%);
      width: 0;
      height: 0;
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-top: 5px solid #717680;
      pointer-events: none;
    }
  }

  &__select {
    @include input-reset;
    width: 100%;
    padding: 10px 32px 10px 14px;
    background: #ffffff;
    border: 1px solid #d5d7da;
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(10, 13, 18, 0.05);
    font-family: $font-primary;
    font-size: 16px;
    color: #2f3038;
    cursor: pointer;
    appearance: none;
    transition: border-color $transition-fast, box-shadow $transition-fast;

    &:focus {
      border-color: $color-brand;
      box-shadow: 0 1px 2px rgba(10, 13, 18, 0.05), 0 0 0 3px rgba(219, 104, 0, 0.1);
    }
  }

  &__highlight {
    background: $color-yellow-lighter;
    border: 1px solid $color-yellow;
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
}
</style>
