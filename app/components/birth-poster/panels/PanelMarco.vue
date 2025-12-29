<script setup lang="ts">
import type { FrameStyle } from '~/types'

const store = useBirthPosterStore()

// Frame styles with thumbnail and actual frame images
const frameStyles: FrameStyle[] = [
  { id: 'frame-negro', name: 'Negro', image: '/frames/negro-thumbnail.webp', frameImage: '/frame-images/frame-black.webp', price: 850 },
  { id: 'frame-blanco', name: 'Blanco', image: '/frames/blanco-thumbnail.webp', frameImage: '/frame-images/frame-white.webp', price: 850 },
  { id: 'frame-roble', name: 'Roble', image: '/frames/roble-thumbnail.webp', frameImage: '/frame-images/frame-roble.webp', price: 950 },
  { id: 'frame-nogal', name: 'Nogal', image: '/frames/nogal-thumbnail.webp', frameImage: '/frame-images/fame-nogal.webp', price: 950 },
]

function selectFrame(frame: FrameStyle) {
  store.setFrameStyle(frame)
}
</script>

<template>
  <div class="panel-marco">
    <div class="panel-marco__section">
      <h3 class="panel-marco__title">Marco del poster</h3>
      <p class="panel-marco__description">
        Añade un marco de madera de alta calidad a tu poster
      </p>
    </div>

    <!-- Frame options -->
    <div class="panel-marco__frames">
      <!-- No frame option -->
      <button
        :class="[
          'panel-marco__frame-btn',
          { 'panel-marco__frame-btn--active': !store.frameStyle }
        ]"
        @click="store.setFrameStyle(null)"
      >
        <NuxtImg
          src="/frames/sin-marco-thumbnail.webp"
          alt="Sin marco"
          class="panel-marco__frame-preview"
          loading="lazy"
        />
      </button>

      <!-- Frame styles -->
      <button
        v-for="frame in frameStyles"
        :key="frame.id"
        :class="[
          'panel-marco__frame-btn',
          { 'panel-marco__frame-btn--active': store.frameStyle?.id === frame.id }
        ]"
        @click="selectFrame(frame)"
      >
        <NuxtImg
          :src="frame.image"
          :alt="`Marco ${frame.name}`"
          class="panel-marco__frame-preview"
          loading="lazy"
        />
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.panel-marco {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-inline: 20px;
  }

  &__title {
    font-family: $font-primary;
    font-size: 16px;
    font-weight: $font-weight-semibold;
    line-height: 24px;
    color: #2f3038;
    margin: 0;
  }

  &__description {
    font-family: $font-primary;
    font-size: 14px;
    color: #717680;
    margin: 0;
    line-height: 1.4;
  }

  // Grid layout for frame options - matches panel-diseno__styles
  &__frames {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
    padding-inline: 20px;
  }

  &__frame-btn {
    @include button-reset;
    aspect-ratio: 1;
    width: 100%;
    border-radius: 12px;
    overflow: hidden;
    background: #ffffff;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 12px;
      box-shadow: inset 0 0 0 1px #e9eaeb;
      transition: box-shadow $transition-fast;
      pointer-events: none;
    }

    @include hover {
      &::after {
        box-shadow: inset 0 0 0 1px #db6800;
      }
    }

    &--active {
      &::after {
        box-shadow: inset 0 0 0 2px #db6800;
      }
    }
  }

  &__frame-preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}
</style>
