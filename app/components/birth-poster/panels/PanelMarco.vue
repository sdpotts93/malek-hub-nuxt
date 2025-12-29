<script setup lang="ts">
import type { FrameStyle } from '~/types'

const store = useBirthPosterStore()

// Frame styles with actual thumbnail images
const frameStyles: FrameStyle[] = [
  { id: 'frame-negro', name: 'Negro', image: '/frames/negro-thumbnail.webp', price: 850 },
  { id: 'frame-blanco', name: 'Blanco', image: '/frames/blanco-thumbnail.webp', price: 850 },
  { id: 'frame-roble', name: 'Roble', image: '/frames/roble-thumbnail.webp', price: 950 },
  { id: 'frame-nogal', name: 'Nogal', image: '/frames/nogal-thumbnail.webp', price: 950 },
]

function selectFrame(frame: FrameStyle | null) {
  store.setFrameStyle(frame)
}
</script>

<template>
  <div class="panel-marco">

    <p class="panel-marco__info">
      Añade un marco de madera de alta calidad a tu poster
    </p>

    <!-- Frame options -->
    <div class="panel-marco__frames">
      <button
        v-for="frame in frameStyles"
        :key="frame.id"
        :class="[
          'panel-marco__option',
          { 'panel-marco__option--active': store.frameStyle?.id === frame.id }
        ]"
        @click="selectFrame(frame)"
      >
        <div class="panel-marco__thumbnail-wrapper">
          <NuxtImg
            :src="frame.image"
            :alt="`Marco ${frame.name}`"
            class="panel-marco__thumbnail"
            width="56"
            height="56"
          />
        </div>
        <span class="panel-marco__option-name">{{ frame.name }}</span>
      </button>

      <!-- No frame option -->
      <button
        :class="[
          'panel-marco__option',
          { 'panel-marco__option--active': !store.frameStyle }
        ]"
        @click="selectFrame(null)"
      >
        <div class="panel-marco__thumbnail-wrapper">
          <NuxtImg
            src="/frames/sin-marco-thumbnail.webp"
            alt="Sin marco"
            class="panel-marco__thumbnail"
            width="56"
            height="56"
          />
        </div>
        <span class="panel-marco__option-name">Sin Marco</span>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.panel-marco {
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
    margin: 0;
  }

  // Grid layout for frame options
  &__frames {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }

  &__option {
    @include button-reset;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 8px;
    background: transparent;

    @include hover {
      .panel-marco__thumbnail-wrapper::after {
        box-shadow: inset 0 0 0 1px #db6800;
      }
    }

    &--active {
      .panel-marco__thumbnail-wrapper::after {
        box-shadow: inset 0 0 0 2px #db6800;
      }
    }
  }

  &__thumbnail-wrapper {
    position: relative;
    width: 56px;
    height: 56px;
    border-radius: 8px;
    overflow: hidden;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 8px;
      box-shadow: inset 0 0 0 1px #e9eaeb;
      transition: box-shadow $transition-fast;
      pointer-events: none;
    }
  }

  &__thumbnail {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__option-name {
    font-family: $font-primary;
    font-size: 11px;
    font-weight: $font-weight-semibold;
    color: #2f3038;
    line-height: 1.2;
    text-align: center;

    .panel-marco__option--active & {
      color: #db6800;
    }
  }
}
</style>
