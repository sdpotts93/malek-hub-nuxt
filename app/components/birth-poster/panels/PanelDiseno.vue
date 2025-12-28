<script setup lang="ts">
import { ILLUSTRATION_COLORS, BABY_STYLES } from '~/types'
import type { BabyOrientation } from '~/types'

const store = useBirthPosterStore()

const orientationOptions: { id: BabyOrientation; label: string }[] = [
  { id: 'izquierda', label: 'Izquierda' },
  { id: 'derecha', label: 'Derecha' },
]

// Computed for reactivity
const isFlipped = computed(() => store.currentBaby.orientation === 'derecha')
</script>

<template>
  <div class="panel-diseno">

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
          v-for="style in BABY_STYLES"
          :key="style.id"
          :class="[
            'panel-diseno__style-btn',
            { 'panel-diseno__style-btn--active': store.currentBaby.styleId === style.id }
          ]"
          @click="store.setBabyStyle(style.id)"
        >
          <NuxtImg
            :src="style.thumbnail"
            :alt="style.name"
            class="panel-diseno__style-preview"
            :style="{ transform: isFlipped ? 'scaleX(-1)' : 'none' }"
            width="74"
            height="74"
            loading="lazy"
          />
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
  gap: 20px;

  &__title {
    font-family: $font-primary;
    font-size: 16px;
    font-weight: $font-weight-semibold;
    line-height: 24px;
    color: #2f3038;
    margin: 0;
  }

  &__tabs {
    margin-bottom: 8px;
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-inline: 20px;
  }

  &__label {
    font-family: $font-primary;
    font-size: 14px;
    font-weight: $font-weight-medium;
    color: #717680;
  }

  // Orientation - button group style (butted together)
  &__orientation {
    display: flex;
    border-radius: 8px;
    overflow: hidden;
  }

  &__orient-btn {
    @include button-reset;
    flex: 1;
    min-height: 40px;
    padding: 10px 16px;
    font-family: $font-primary;
    font-size: 16px;
    font-weight: $font-weight-bold;
    background: #f5f5f5;
    color: #414651;
    border-right: 1px solid #e9eaeb;
    transition: background-color $transition-fast, color $transition-fast;

    &:last-child {
      border-right: none;
    }

    @include hover {
      background: #ebebeb;
    }

    &--active {
      background: #fff0e5;
      color: #db6800;
      border-right-color: #eaddd3;
    }
  }

  // Styles grid - 74x74px images
  &__styles {
    display: grid;
    grid-template-columns: repeat(4, 74px);
    gap: 8px;
  }

  &__style-btn {
    @include button-reset;
    width: 74px;
    height: 74px;
    border-radius: 12px;
    border: 1px solid #e9eaeb;
    overflow: hidden;
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

  &__style-preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 11px;
    transition: transform $transition-fast;
  }

  // Color picker
  &__colors {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
  }

  &__color-btn {
    @include button-reset;
    @include flex-center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid transparent;
    transition: transform $transition-fast, box-shadow $transition-fast;

    @include hover {
      transform: scale(1.1);
    }

    &--active {
      box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #2f3038;
    }

    svg {
      color: #ffffff;
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
    }
  }
}
</style>
