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
    padding: 12px 14px;
    background: #f9fafb;
    border-radius: 8px;
    margin: 0;
  }

  &__sizes {
    display: grid;
    grid-template-columns: repeat(4, 74px);
    gap: 8px;
  }

  &__size {
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
    width: 28px;
    max-height: 36px;
    background: #f3f4f6;
    border: 1px solid #e9eaeb;
    border-radius: 4px;

    .panel-medidas__size--active & {
      background: #fff0e5;
      border-color: #db6800;
    }
  }

  &__size-info {
    text-align: center;
    margin-top: 4px;
  }

  &__size-label {
    display: block;
    font-family: $font-primary;
    font-size: 12px;
    font-weight: $font-weight-semibold;
    color: #2f3038;
    line-height: 1.2;

    .panel-medidas__size--active & {
      color: #db6800;
    }
  }

  &__size-dimensions {
    display: block;
    font-family: $font-primary;
    font-size: 10px;
    color: #717680;
    margin-top: 2px;
  }
}
</style>
