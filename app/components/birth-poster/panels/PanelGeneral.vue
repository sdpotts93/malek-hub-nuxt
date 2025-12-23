<script setup lang="ts">
import { BACKGROUND_COLORS } from '~/types'

const store = useBirthPosterStore()

const babyCountOptions = [1, 2, 3, 4] as const
</script>

<template>
  <div class="panel-general">
    <h3 class="panel-general__title">General</h3>

    <!-- Baby Count -->
    <div class="panel-general__section">
      <label class="panel-general__label">Número de bebés</label>
      <div class="panel-general__baby-count">
        <button
          v-for="count in babyCountOptions"
          :key="count"
          :class="[
            'panel-general__count-btn',
            { 'panel-general__count-btn--active': store.babyCount === count }
          ]"
          @click="store.setBabyCount(count)"
        >
          {{ count }}
        </button>
      </div>
    </div>

    <!-- Background Color -->
    <div class="panel-general__section">
      <label class="panel-general__label">Color de fondo</label>
      <div class="panel-general__colors">
        <button
          v-for="color in BACKGROUND_COLORS"
          :key="color.id"
          :class="[
            'panel-general__color-btn',
            { 'panel-general__color-btn--active': store.backgroundColor === color.hex }
          ]"
          :style="{ backgroundColor: color.hex }"
          :aria-label="color.name"
          :title="color.name"
          @click="store.setBackgroundColor(color.hex)"
        >
          <svg
            v-if="store.backgroundColor === color.hex"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.panel-general {
  display: flex;
  flex-direction: column;
  gap: $space-3xl;

  &__title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    margin-bottom: $space-md;
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: $space-lg;
  }

  &__label {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-text-secondary;
  }

  &__baby-count {
    display: flex;
    gap: $space-md;
  }

  &__count-btn {
    @include button-reset;
    @include flex-center;
    width: 48px;
    height: 48px;
    border: 2px solid $color-border;
    border-radius: $radius-lg;
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    transition: border-color $transition-fast, background-color $transition-fast, color $transition-fast;

    @include hover {
      border-color: $color-brand;
    }

    &--active {
      border-color: $color-brand;
      background: $color-brand;
      color: $color-text-inverse;
    }
  }

  &__colors {
    display: flex;
    flex-wrap: wrap;
    gap: $space-md;
  }

  &__color-btn {
    @include button-reset;
    @include flex-center;
    width: 40px;
    height: 40px;
    border-radius: $radius-full;
    border: 2px solid $color-border;
    transition: transform $transition-fast, box-shadow $transition-fast;

    @include hover {
      transform: scale(1.1);
    }

    &--active {
      border-color: $color-text-primary;
      box-shadow: 0 0 0 2px $color-bg-primary, 0 0 0 4px $color-text-primary;
    }

    svg {
      color: $color-text-primary;
    }
  }
}
</style>
