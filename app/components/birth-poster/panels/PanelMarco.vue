<script setup lang="ts">
import type { FrameStyle } from '~/types'

const store = useBirthPosterStore()

// Frame styles with thumbnail and actual frame images
const frameStyles: FrameStyle[] = [
  { id: 'frame-negro', name: 'Negro', image: '/frames/negro-thumbnail.webp', frameImage: '/frame-images/frame-black.webp', frameImageHorizontal: '/frame-images/frame-black-horizontal.webp', price: 850 },
  { id: 'frame-blanco', name: 'Blanco', image: '/frames/blanco-thumbnail.webp', frameImage: '/frame-images/frame-white.webp', frameImageHorizontal: '/frame-images/frame-white-horizontal.webp', price: 850 },
  { id: 'frame-roble', name: 'Roble', image: '/frames/roble-thumbnail.webp', frameImage: '/frame-images/frame-roble.webp', frameImageHorizontal: '/frame-images/frame-roble-horizontal.webp', price: 950 },
  { id: 'frame-nogal', name: 'Nogal', image: '/frames/nogal-thumbnail.webp', frameImage: '/frame-images/fame-nogal.webp', frameImageHorizontal: '/frame-images/frame-nogal-horizontal.webp', price: 950 },
]

function selectFrame(frame: FrameStyle) {
  store.setFrameStyle(frame)
}
</script>

<template>
  <div class="panel-marco">
    <div class="panel-marco__section">
      <h3 class="panel-marco__title">
        <svg class="panel-marco__title-icon" width="20" height="20" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect class="sidebar-nav__svg-frame-fill" x="128" y="384" width="768" height="512"/>
          <path class="omit-fill" d="M992 1024H32q-13 0-22.5-9.5T0 992V288q0-13 9.5-22.5T32 256h211L488 11l.5-1l.5-1q10-9 23-9t23 9l.5 1l.5 1l245 245h211q13 0 22.5 9.5t9.5 22.5v704q0 13-9.5 22.5T992 1024M512 77L333 256h358zm384 307H128v512h768z" fill="currentColor"/>
        </svg>
        Marco del poster
      </h3>
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
  padding-top: 20px;
  @include mobile {
    padding-top: 0;
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-inline: 20px;
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
  }

  &__title-icon {
    color: $color-brand;
    flex-shrink: 0;
    path:not(.omit-fill), rect:not(.omit-fill) {
      fill: $color-icon-fill;
    }
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
        box-shadow: inset 0 0 0 1px $color-brand;
      }
    }

    &--active {
      &::after {
        box-shadow: inset 0 0 0 2px $color-brand;
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
