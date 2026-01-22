<script setup lang="ts">
import { MARGIN_COLORS } from '~/stores/personaliza'

const store = usePersonalizaStore()

// Color scroll container ref
const colorScrollRef = ref<HTMLElement | null>(null)

function scrollColors(direction: 'left' | 'right') {
  if (!colorScrollRef.value) return
  const scrollAmount = 100
  colorScrollRef.value.scrollBy({
    left: direction === 'left' ? -scrollAmount : scrollAmount,
    behavior: 'smooth',
  })
}
</script>

<template>
  <div class="panel-margen">
    <div class="panel-margen__section">
      <h3 class="panel-margen__title">
        <svg class="panel-margen__title-icon" width="20" height="22" viewBox="0 0 20 22" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13.4583 3.39583L9.625 7.22917L5.79167 3.39583" fill="currentColor" fill-opacity="0.2"/>
          <path d="M13.4583 17.7708L9.625 13.9375L5.79167 17.7708" fill="currentColor" fill-opacity="0.2"/>
          <path d="M1 10.5833H18.25M9.625 1V7.22917M9.625 7.22917L13.4583 3.39583M9.625 7.22917L5.79167 3.39583M9.625 20.1667V13.9375M9.625 13.9375L13.4583 17.7708M9.625 13.9375L5.79167 17.7708" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Margen
      </h3>
    </div>

    <div class="panel-margen__section">
      <div class="panel-margen__margin-buttons">
        <button
          :class="[
            'panel-margen__margin-btn',
            { 'panel-margen__margin-btn--active': store.hasMargin }
          ]"
          @click="store.setHasMargin(true)"
        >
          Con margen
        </button>
        <button
          :class="[
            'panel-margen__margin-btn',
            { 'panel-margen__margin-btn--active': !store.hasMargin }
          ]"
          @click="store.setHasMargin(false)"
        >
          Sin margen
        </button>
      </div>
    </div>

    <div v-if="store.hasMargin" class="panel-margen__section panel-margen__section--pr0">
      <div class="panel-margen__color-header">
        <label class="panel-margen__label">Color del margen</label>
        <div class="panel-margen__color-nav">
          <button
            class="panel-margen__nav-btn"
            aria-label="Scroll left"
            @click="scrollColors('left')"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.75 10.5L5.25 7L8.75 3.5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button
            class="panel-margen__nav-btn"
            aria-label="Scroll right"
            @click="scrollColors('right')"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5.25 3.5L8.75 7L5.25 10.5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
      <div ref="colorScrollRef" class="panel-margen__colors-scroll">
        <div class="panel-margen__colors">
          <button
            v-for="color in MARGIN_COLORS"
            :key="color.id"
            :class="[
              'panel-margen__color-btn',
              { 'panel-margen__color-btn--active': store.marginColor === color.hex }
            ]"
            :style="{ backgroundColor: color.hex }"
            :aria-label="color.name"
            :title="color.name"
            @click="store.setMarginColor(color.hex)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.panel-margen {
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

    &--pr0 {
      padding-right: 0;
    }
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
    @include mobile {
      display: none;
    }
  }

  &__title-icon {
    color: $color-brand;
    flex-shrink: 0;
    path:not(.omit-fill), rect:not(.omit-fill) {
      fill: $color-icon-fill;
    }
  }

  &__label {
    font-family: $font-primary;
    font-size: 13px;
    font-weight: $font-weight-medium;
    color: #2f3038;
    margin: 0;
  }

  &__margin-buttons {
    display: flex;
    align-items: center;
    background: #f5f5f5;
    border-radius: 8px;
    overflow: hidden;
    gap: 0;
  }

  &__margin-btn {
    @include button-reset;
    flex: 1;
    min-height: 40px;
    padding: 10px 12px;
    font-family: $font-primary;
    font-size: 15px;
    font-weight: $font-weight-bold;
    color: #181d27;
    text-align: center;
    position: relative;

    &--active {
      background: #ffffff;
      border: 1px solid #d5d7da;
      box-shadow: 0 0 12px rgba(0, 0, 0, 0.08);
      z-index: 1;
      border-radius: 8px;
    }
  }

  &__color-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
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
