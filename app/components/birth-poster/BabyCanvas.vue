<script setup lang="ts">
import { POSTER_SIZES } from '~/types'

const store = useBirthPosterStore()

// Calculate canvas dimensions (maintain aspect ratio)
const maxCanvasWidth = 500
const maxCanvasHeight = 700

const canvasDimensions = computed(() => {
  const size = POSTER_SIZES[store.posterSize]
  const aspectRatio = size.width / size.height

  let width = maxCanvasWidth
  let height = width / aspectRatio

  if (height > maxCanvasHeight) {
    height = maxCanvasHeight
    width = height * aspectRatio
  }

  return { width, height }
})

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

// Get CSS filter for illustration color
function getColorFilter(color: string): string {
  if (!color || color === '#000000') return 'none'

  // For now, use a simple invert + hue-rotate approach
  // In production, you'd use a more sophisticated color-to-filter conversion
  return `brightness(0) saturate(100%) invert(100%)`
}
</script>

<template>
  <div
    class="baby-canvas"
    :style="{
      width: canvasDimensions.width + 'px',
      height: canvasDimensions.height + 'px',
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
            filter: getColorFilter(baby.illustrationColor),
          }"
        >
          <!-- Placeholder baby illustration -->
          <svg
            viewBox="0 0 100 140"
            fill="currentColor"
            :style="{
              transform: baby.orientation === 'izquierda' ? 'scaleX(-1)' : 'none'
            }"
          >
            <!-- Simple baby silhouette placeholder -->
            <ellipse cx="50" cy="25" rx="20" ry="22" />
            <ellipse cx="50" cy="75" rx="30" ry="45" />
            <ellipse cx="20" cy="55" rx="10" ry="20" />
            <ellipse cx="80" cy="55" rx="10" ry="20" />
            <ellipse cx="35" cy="120" rx="12" ry="18" />
            <ellipse cx="65" cy="120" rx="12" ry="18" />
          </svg>
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
  transition: width $transition-base, height $transition-base;

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
    transition: filter $transition-base;

    svg {
      width: 100%;
      height: auto;
    }
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
