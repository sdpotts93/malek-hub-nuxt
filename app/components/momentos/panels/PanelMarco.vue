<script setup lang="ts">
import type { FrameStyle } from '~/types'

const store = useMomentosStore()

// Frame styles with thumbnail and actual frame images
const frameStyles: FrameStyle[] = [
  { id: 'frame-negro', name: 'Negro', image: '/frames/negro-thumbnail.webp', frameImage: '/frame-images/frame-black.webp', frameImageHorizontal: '/frame-images/frame-black-horizontal.webp', frameImageSquare: '/frame-images/frame-black-square.webp', price: 850 },
  { id: 'frame-blanco', name: 'Blanco', image: '/frames/blanco-thumbnail.webp', frameImage: '/frame-images/frame-white.webp', frameImageHorizontal: '/frame-images/frame-white-horizontal.webp', frameImageSquare: '/frame-images/frame-white-square.webp', price: 850 },
  { id: 'frame-roble', name: 'Roble', image: '/frames/roble-thumbnail.webp', frameImage: '/frame-images/frame-roble.webp', frameImageHorizontal: '/frame-images/frame-roble-horizontal.webp', frameImageSquare: '/frame-images/frame-roble-square.webp', price: 950 },
  { id: 'frame-nogal', name: 'Nogal', image: '/frames/nogal-thumbnail.webp', frameImage: '/frame-images/fame-nogal.webp', frameImageHorizontal: '/frame-images/frame-nogal-horizontal.webp', frameImageSquare: '/frame-images/frame-nogal-square.webp', price: 950 },
]

function selectFrame(frame: FrameStyle) {
  store.setFrameStyle(frame)
}
</script>

<template>
  <div class="panel-marco">
    <div class="panel-marco__section">
      <h3 class="panel-marco__title">
        <svg class="panel-marco__title-icon" width="20" height="20" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clip-path="url(#clip0_frame_marco)">
            <path d="M8.08496 5.18176H14.915C15.6145 5.18176 16.079 5.18291 16.4355 5.21204C16.7805 5.24022 16.9358 5.28985 17.0322 5.33899C17.3029 5.477 17.5232 5.69714 17.6611 5.9679C17.7102 6.06431 17.7599 6.21918 17.7881 6.5636C17.8172 6.92021 17.8184 7.38549 17.8184 8.08508V14.9152C17.8184 15.6146 17.8172 16.0791 17.7881 16.4357C17.7599 16.7806 17.7103 16.9359 17.6611 17.0323C17.5231 17.3031 17.303 17.5233 17.0322 17.6613C16.9358 17.7104 16.7805 17.76 16.4355 17.7882C16.079 17.8173 15.6145 17.8185 14.915 17.8185H8.08496C7.38537 17.8185 6.92008 17.8173 6.56348 17.7882C6.21905 17.76 6.06419 17.7103 5.96777 17.6613C5.69702 17.5233 5.47687 17.3031 5.33887 17.0323C5.28973 16.9359 5.2401 16.7806 5.21191 16.4357C5.18279 16.0791 5.18164 15.6146 5.18164 14.9152V8.08508C5.18164 7.38549 5.18278 6.92021 5.21191 6.5636C5.2401 6.21902 5.28976 6.06429 5.33887 5.9679C5.47687 5.69706 5.69693 5.47699 5.96777 5.33899C6.06417 5.28988 6.2189 5.24022 6.56348 5.21204C6.92008 5.1829 7.38537 5.18176 8.08496 5.18176Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M16.0127 0.82959C16.8987 0.82959 17.6233 0.828465 18.2109 0.876465C18.8103 0.925435 19.355 1.03008 19.8643 1.28955C20.6588 1.69444 21.3051 2.34068 21.71 3.13525C21.9694 3.64449 22.0741 4.18921 22.123 4.78857C22.1711 5.37618 22.1699 6.10084 22.1699 6.98682V16.0132C22.1699 16.8992 22.171 17.6238 22.123 18.2114C22.0741 18.8108 21.9694 19.3555 21.71 19.8647C21.3051 20.6593 20.6589 21.3055 19.8643 21.7104C19.355 21.9699 18.8103 22.0746 18.2109 22.1235C17.6233 22.1715 16.8987 22.1704 16.0127 22.1704H6.98633C6.10035 22.1704 5.37569 22.1715 4.78809 22.1235C4.18872 22.0746 3.644 21.9699 3.13477 21.7104C2.34019 21.3055 1.69395 20.6593 1.28906 19.8647C1.02959 19.3555 0.924947 18.8108 0.875977 18.2114C0.827976 17.6238 0.829101 16.8992 0.829102 16.0132V6.98682C0.829102 6.10084 0.827971 5.37618 0.875977 4.78857C0.924947 4.18921 1.02959 3.64449 1.28906 3.13525C1.69396 2.34069 2.3402 1.69445 3.13477 1.28955C3.644 1.03008 4.18872 0.925435 4.78809 0.876465C5.37569 0.828459 6.10035 0.82959 6.98633 0.82959H16.0127Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </g>
          <defs>
            <clipPath id="clip0_frame_marco">
              <rect width="23" height="23" fill="white"/>
            </clipPath>
          </defs>
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
      <div class="panel-marco__frame-item">
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
        <span class="panel-marco__frame-label">🚫</span>
      </div>

      <!-- Frame styles -->
      <div
        v-for="frame in frameStyles"
        :key="frame.id"
        class="panel-marco__frame-item"
      >
        <button
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
        <span class="panel-marco__frame-label">{{ frame.name }}</span>
      </div>
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

  &__frame-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }

  &__frame-label {
    font-family: $font-primary;
    font-size: 12px;
    text-align: center;
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
        box-shadow: inset 0 0 0 1px #252b37;
      }
    }

    &--active {
      &::after {
        box-shadow: inset 0 0 0 2px #252b37;
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
