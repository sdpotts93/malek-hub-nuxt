<script setup lang="ts">
import { ILLUSTRATION_COLORS } from '~/types'
import type { BabyOrientation } from '~/types'

const store = useBirthPosterStore()

// Mock baby styles
const babyStyles = [
  { id: 'style-1', name: 'Clásico' },
  { id: 'style-2', name: 'Moderno' },
  { id: 'style-3', name: 'Minimalista' },
  { id: 'style-4', name: 'Artístico' },
  { id: 'style-5', name: 'Dulce' },
  { id: 'style-6', name: 'Elegante' },
]

const orientationOptions: { id: BabyOrientation; label: string }[] = [
  { id: 'derecha', label: 'Derecha' },
  { id: 'izquierda', label: 'Izquierda' },
]
</script>

<template>
  <div class="panel-diseno">
    <h3 class="panel-diseno__title">Diseño</h3>

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
    <div class="panel-diseno__section">
      <label class="panel-diseno__label">Estilos</label>
      <div class="panel-diseno__styles">
        <button
          v-for="style in babyStyles"
          :key="style.id"
          :class="[
            'panel-diseno__style-btn',
            { 'panel-diseno__style-btn--active': store.currentBaby.styleId === style.id }
          ]"
          @click="store.setBabyStyle(style.id)"
        >
          <!-- Placeholder style preview -->
          <div class="panel-diseno__style-preview">
            <svg viewBox="0 0 60 80" fill="currentColor">
              <ellipse cx="30" cy="18" rx="12" ry="14" />
              <ellipse cx="30" cy="50" rx="18" ry="28" />
            </svg>
          </div>
          <span class="panel-diseno__style-name">{{ style.name }}</span>
        </button>
      </div>
    </div>

    <!-- Illustration Color -->
    <div class="panel-diseno__section">
      <label class="panel-diseno__label">Color de la ilustración</label>
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
        >
          <svg
            v-if="store.currentBaby.illustrationColor === color.hex"
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
.panel-diseno {
  display: flex;
  flex-direction: column;
  gap: $space-3xl;

  &__title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
  }

  &__tabs {
    margin-bottom: $space-lg;
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

  &__orientation {
    display: flex;
    gap: $space-md;
  }

  &__orient-btn {
    @include button-reset;
    flex: 1;
    padding: $space-lg;
    border: 2px solid $color-border;
    border-radius: $radius-lg;
    font-weight: $font-weight-medium;
    transition: border-color $transition-fast, background-color $transition-fast, color $transition-fast;

    @include hover {
      border-color: $color-brand;
    }

    &--active {
      border-color: $color-brand;
      background: $color-brand-light;
      color: $color-brand;
    }
  }

  &__styles {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $space-md;
  }

  &__style-btn {
    @include button-reset;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $space-md;
    padding: $space-lg;
    border: 2px solid $color-border;
    border-radius: $radius-lg;
    transition: border-color $transition-fast, background-color $transition-fast;

    @include hover {
      border-color: $color-brand;
    }

    &--active {
      border-color: $color-brand;
      background: $color-brand-light;
    }
  }

  &__style-preview {
    width: 48px;
    height: 64px;
    @include flex-center;
    color: $color-text-secondary;

    svg {
      width: 100%;
      height: 100%;
    }

    .panel-diseno__style-btn--active & {
      color: $color-brand;
    }
  }

  &__style-name {
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    color: $color-text-secondary;

    .panel-diseno__style-btn--active & {
      color: $color-brand;
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
    border: 2px solid transparent;
    transition: transform $transition-fast, box-shadow $transition-fast;

    @include hover {
      transform: scale(1.1);
    }

    &--active {
      box-shadow: 0 0 0 2px $color-bg-primary, 0 0 0 4px $color-text-primary;
    }

    svg {
      color: white;
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
    }
  }
}
</style>
