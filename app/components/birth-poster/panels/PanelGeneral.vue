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
    <!-- Baby Count -->
    <div class="panel-general__section">
      <label class="panel-general__label">Numero de bebes</label>
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
              <path d="M8.75 10.5L5.25 7L8.75 3.5" stroke="#F2330D" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button
            class="panel-general__nav-btn"
            aria-label="Scroll right"
            @click="scrollColors('right')"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5.25 3.5L8.75 7L5.25 10.5" stroke="#F2330D" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
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
    background-color: $color-border;
  }

  &__label {
    font-family: $font-primary;
    font-size: 16px;
    font-weight: $font-weight-semibold;
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
    padding: 0 4px;
  }

  &__nav-btn {
    @include button-reset;
    @include flex-center;
    width: 14px;
    height: 14px;
    cursor: pointer;

    svg {
      display: block;
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
    gap: 12px;
    padding: 0 2px;
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
