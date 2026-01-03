<script setup lang="ts">
import { ref } from 'vue'
import { BACKGROUND_COLORS } from '~/types'

const store = useBirthPosterStore()

const babyCountOptions = [1, 2, 3, 4] as const

// Color scroll container ref
const colorScrollRef = ref<HTMLElement | null>(null)

const scrollColors = (direction: 'left' | 'right') => {
  if (!colorScrollRef.value) return
  const scrollAmount = 100
  colorScrollRef.value.scrollBy({
    left: direction === 'left' ? -scrollAmount : scrollAmount,
    behavior: 'smooth'
  })
}
</script>

<template>
  <div class="panel-general">
    <h3 class="panel-general__title">
      <svg class="panel-general__title-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16">
        <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">
          <circle cx="8" cy="8" r="1.75"/>
          <path d="m6.75 1.75-.5 1.5-1.5 1-2-.5-1 2 1.5 1.5v1.5l-1.5 1.5 1 2 2-.5 1.5 1 .5 1.5h2.5l.5-1.5 1.5-1 2 .5 1-2-1.5-1.5v-1.5l1.5-1.5-1-2-2 .5-1.5-1-.5-1.5z"/>
        </g>
      </svg>
      Diseño general del poster
    </h3>

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

    <!-- Separator -->
    <div class="panel-general__separator" />

    <!-- Background Color -->
    <div class="panel-general__section panel-general__section--pr0">
      <div class="panel-general__color-header">
        <label class="panel-general__label">Color de fondo</label>
        <div class="panel-general__color-nav">
          <button
            class="panel-general__nav-btn"
            aria-label="Scroll left"
            @click="scrollColors('left')"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.75 10.5L5.25 7L8.75 3.5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button
            class="panel-general__nav-btn"
            aria-label="Scroll right"
            @click="scrollColors('right')"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5.25 3.5L8.75 7L5.25 10.5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
      <div ref="colorScrollRef" class="panel-general__colors-scroll">
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
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.panel-general {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 20px;
  @include mobile {
    padding-top: 0;
  }

  &__title {
    font-family: $font-primary;
    font-size: 16px;
    font-weight: $font-weight-semibold;
    line-height: 24px;
    color: #2f3038;
    margin: 0;
    padding-inline: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__title-icon {
    color: $color-brand;
    flex-shrink: 0;
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-inline: 20px;
    &--pr0 {
      padding-right: 0;
    }
  }

  &__separator {
    height: 1px;
    background-color: #e5e7eb;
    width: calc(100% - 40px);
    margin: 4px auto;
  }

  &__label {
    font-family: $font-primary;
    font-size: 16px;
    // font-weight: $font-weight-semibold;
    line-height: 24px;
    color: #2f3038;
  }

  // Color header with title and arrows
  &__color-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-right: 20px;
  }

  &__color-nav {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #fafafa;
    border-radius: 5px;
    padding: 4px 5px;
  }

  &__nav-btn {
    @include button-reset;
    @include flex-center;
    width: 14px;
    height: 14px;
    cursor: pointer;

    svg {
      display: block;
      stroke: $color-brand;
    }

    @include hover {
      opacity: 0.7;
    }
  }

  // Button group - buttons butted together
  &__baby-count {
    display: flex;
    border-radius: 8px;
    overflow: hidden;
  }

  &__count-btn {
    @include button-reset;
    @include flex-center;
    min-height: 40px;
    padding: 8px 22px;
    font-family: $font-primary;
    font-size: 16px;
    font-weight: $font-weight-bold;
    line-height: 24px;
    background: #f5f5f5;
    color: #414651;
    transition: background-color $transition-fast, color $transition-fast;

    &--active {
      background: $color-brand-light;
      color: $color-brand;
      border-right: 1px solid #dedede;
      border-left: 1px solid #dedede;
      &:last-child {
        border-right: none;
      }
      &:first-child {
        border-left: none;
      }
    }

    &:last-child {
      border-right: none;
      border-top-right-radius: 8px;
      border-bottom-right-radius: 8px;

    }

    @include hover {
      background: #ebebeb;
    }

  }

  // Color picker - horizontal scroll container
  &__colors-scroll {
    overflow-x: auto;
    overflow-y: visible;
    padding: 8px 0;
    margin: -8px 0;
    scrollbar-width: none;
    -ms-overflow-style: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  &__colors {
    display: flex;
    gap: 14px;
    padding-left: 6px;

    &::after {
      content: '';
      min-width: 20px;
      flex-shrink: 0;
    }
  }

  &__color-btn {
    @include button-reset;
    @include flex-center;
    width: 40px;
    height: 40px;
    min-width: 40px;
    border-radius: 100px;
    border: 1px solid $color-border;
    transition: box-shadow $transition-fast;
    position: relative;
    flex-shrink: 0;

    @include hover {
      opacity: 0.9;
    }

    &--active {
      box-shadow: 0 0 0 3px #ffffff, 0 0 0 5.5px #000000;
    }
  }
}
</style>
