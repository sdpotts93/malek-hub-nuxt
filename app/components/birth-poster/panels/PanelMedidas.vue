<script setup lang="ts">
import { POSTER_SIZES } from '~/types'
import type { PosterSize } from '~/types'

const store = useBirthPosterStore()

// Get available sizes based on baby count
const availableSizes = computed(() => {
  return store.availableSizes.map((size) => ({
    id: size,
    ...POSTER_SIZES[size],
  }))
})

function selectSize(size: PosterSize) {
  store.setPosterSize(size)
}
</script>

<template>
  <div class="panel-medidas">
    <h3 class="panel-medidas__title">Medidas del poster</h3>

    <!-- Info about orientation -->
    <p class="panel-medidas__info">
      <template v-if="store.babyCount <= 2">
        Formatos verticales disponibles para 1-2 bebés
      </template>
      <template v-else>
        Formatos horizontales disponibles para 3-4 bebés
      </template>
    </p>

    <!-- Size options -->
    <div class="panel-medidas__sizes">
      <button
        v-for="size in availableSizes"
        :key="size.id"
        :class="[
          'panel-medidas__size',
          { 'panel-medidas__size--active': store.posterSize === size.id }
        ]"
        @click="selectSize(size.id)"
      >
        <!-- Size preview -->
        <div
          class="panel-medidas__preview"
          :style="{
            aspectRatio: size.width / size.height,
          }"
        />

        <!-- Size label -->
        <div class="panel-medidas__size-info">
          <span class="panel-medidas__size-label">{{ size.label }}</span>
          <span class="panel-medidas__size-dimensions">
            {{ size.width }} x {{ size.height }} cm
          </span>
        </div>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.panel-medidas {
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
    padding: $space-lg;
    background: $color-bg-secondary;
    border-radius: $radius-lg;
  }

  &__sizes {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: $space-lg;
  }

  &__size {
    @include button-reset;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $space-lg;
    padding: $space-xl;
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
    width: 100%;
    max-width: 80px;
    max-height: 100px;
    background: $color-bg-tertiary;
    border: 1px solid $color-border;
    border-radius: $radius-md;

    .panel-medidas__size--active & {
      background: $color-bg-primary;
      border-color: $color-brand;
    }
  }

  &__size-info {
    text-align: center;
  }

  &__size-label {
    display: block;
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    color: $color-text-primary;

    .panel-medidas__size--active & {
      color: $color-brand;
    }
  }

  &__size-dimensions {
    display: block;
    font-size: $font-size-xs;
    color: $color-text-muted;
    margin-top: $space-xs;
  }
}
</style>
