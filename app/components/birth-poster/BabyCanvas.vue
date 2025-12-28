<script setup lang="ts">
import { getStyleById } from '~/types'

const store = useBirthPosterStore()

// Determine if poster is vertical or horizontal based on baby count
const isVertical = computed(() => store.babyCount <= 2)

// Aspect ratio: 5:7 for vertical (1-2 babies), 7:5 for horizontal (3-4 babies)
const aspectRatio = computed(() => isVertical.value ? '5 / 7' : '7 / 5')

// Calculate baby illustration sizes based on baby count
const babyLayout = computed(() => {
  const count = store.babyCount

  if (count === 1) {
    return { cols: 1, size: 'large' }
  } else if (count === 2) {
    return { cols: 2, size: 'medium' }
  } else if (count === 3) {
    return { cols: 3, size: 'small' }
  } else {
    return { cols: 2, size: 'small' }
  }
})
</script>

<template>
  <div
    :class="['baby-canvas', { 'baby-canvas--horizontal': !isVertical }]"
    :style="{
      aspectRatio: aspectRatio,
      backgroundColor: store.backgroundColor,
    }"
  >
    <!-- BABY EDIT Section -->
    <div class="baby-canvas__illustration-area">
      <div
        :class="[
          'baby-canvas__babies',
          `baby-canvas__babies--cols-${babyLayout.cols}`,
          `baby-canvas__babies--size-${babyLayout.size}`
        ]"
      >
        <div
          v-for="(baby, index) in store.babies"
          :key="index"
          class="baby-canvas__baby"
          :style="{
            transform: baby.orientation === 'derecha' ? 'scaleX(-1)' : 'none',
          }"
        >
          <NuxtImg
            v-if="getStyleById(baby.styleId)"
            :src="getStyleById(baby.styleId)!.image"
            :alt="getStyleById(baby.styleId)!.name"
            class="baby-canvas__illustration"
          />
        </div>
      </div>
    </div>

    <!-- TEXT EDIT Section -->
    <div class="baby-canvas__text-area">
      <div
        v-for="(baby, index) in store.babies"
        :key="index"
        class="baby-canvas__text-block"
      >
        <p class="baby-canvas__title">
          SCALE 1:1 OF {{ baby.nombre || `Bebé ${index + 1}` }}
        </p>
        <p class="baby-canvas__data">
          {{ baby.altura }} cm
          <template v-if="baby.peso"> / {{ baby.peso }} gramos</template>
          <template v-if="baby.fechaNacimiento">
            / {{ new Date(baby.fechaNacimiento).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            }) }}
          </template>
          <template v-if="baby.lugarNacimiento"> / {{ baby.lugarNacimiento }}</template>
        </p>
      </div>
    </div>

    <!-- Frame overlay (if selected) -->
    <div
      v-if="store.frameStyle"
      class="baby-canvas__frame"
    >
      <!-- Frame visual would go here -->
    </div>
  </div>
</template>

<style lang="scss" scoped>
.baby-canvas {
  position: relative;
  background: white;
  border-radius: $radius-lg;
  box-shadow: $shadow-lg;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
  max-height: 100%;
  width: auto;
  transition: aspect-ratio $transition-base;

  &--horizontal {
    height: auto;
    width: 100%;
    max-width: 100%;
  }

  &__illustration-area {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $space-3xl;
  }

  &__babies {
    display: grid;
    gap: $space-xl;
    width: 100%;
    max-width: 80%;
    justify-items: center;

    &--cols-1 {
      grid-template-columns: 1fr;
    }

    &--cols-2 {
      grid-template-columns: repeat(2, 1fr);
    }

    &--cols-3 {
      grid-template-columns: repeat(3, 1fr);
    }

    &--size-large {
      .baby-canvas__baby {
        max-width: 200px;
      }
    }

    &--size-medium {
      .baby-canvas__baby {
        max-width: 140px;
      }
    }

    &--size-small {
      .baby-canvas__baby {
        max-width: 100px;
      }
    }
  }

  &__baby {
    width: 100%;
    transition: transform $transition-base;
  }

  &__illustration {
    width: 100%;
    height: auto;
    display: block;
  }

  &__text-area {
    padding: $space-xl $space-3xl $space-3xl;
    text-align: center;
  }

  &__text-block {
    margin-bottom: $space-lg;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__title {
    font-size: $font-size-sm;
    font-weight: $font-weight-bold;
    letter-spacing: 0.05em;
    margin-bottom: $space-xs;
  }

  &__data {
    font-size: $font-size-xs;
    color: $color-text-secondary;
  }

  &__frame {
    position: absolute;
    inset: 0;
    pointer-events: none;
    border: 16px solid #8b5a2b; // Default wood color
    border-radius: $radius-lg;
  }
}
</style>
