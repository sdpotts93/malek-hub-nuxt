<script setup lang="ts">
import type { TextStyle } from '~/stores/personaliza'
import { MARGIN_COLORS } from '~/stores/personaliza'

const store = usePersonalizaStore()

// Text style options with font info for button preview
const textStyles: { id: TextStyle; label: string }[] = [
  { id: 'moderno', label: 'Moderno' },
  { id: 'clasico', label: 'Clásico' },
  { id: 'minimalista', label: 'Minimalista' },
]

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
  <div class="panel-texto">
    <div class="panel-texto__section">
      <h3 class="panel-texto__title">
        <svg class="panel-texto__title-icon" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 3.875C1 2.98195 1 2.53542 1.1459 2.18319C1.34043 1.71355 1.71355 1.34043 2.18319 1.1459C2.53542 1 2.98195 1 3.875 1H13.4583C14.3514 1 14.7979 1 15.1501 1.1459C15.6198 1.34043 15.9929 1.71355 16.1874 2.18319C16.3333 2.53542 16.3333 2.98195 16.3333 3.875M5.79167 16.3333H11.5417M8.66667 1V16.3333" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Personaliza el texto
      </h3>
      <!-- <p class="panel-texto__description">
        Anade texto y personaliza el estilo de tu poster
      </p> -->
    </div>

    <!-- Text Style -->
    <div class="panel-texto__section">
      <!-- <label class="panel-texto__label">Estilo de texto</label> -->
      <div class="panel-texto__styles">
        <button
          v-for="style in textStyles"
          :key="style.id"
          :class="[
            'panel-texto__style-btn',
            `panel-texto__style-btn--${style.id}`,
            { 'panel-texto__style-btn--active': store.textStyle === style.id }
          ]"
          @click="store.setTextStyle(style.id)"
        >
          {{ style.label }}
        </button>
      </div>
    </div>

    <!-- Title input -->
    <div class="panel-texto__section">
      <label class="panel-texto__label">Titulo (opcional)</label>
      <input
        type="text"
        :value="store.title"
        placeholder="Ej: Nuestra boda"
        class="panel-texto__input"
        maxlength="50"
        @input="store.setTitle(($event.target as HTMLInputElement).value)"
      >
    </div>

    <!-- Subtitle input -->
    <div class="panel-texto__section">
      <label class="panel-texto__label">Subtitulo (opcional)</label>
      <input
        type="text"
        :value="store.subtitle"
        placeholder="Ej: 15 de marzo, 2024"
        class="panel-texto__input"
        maxlength="100"
        @input="store.setSubtitle(($event.target as HTMLInputElement).value)"
      >
    </div>

    <!-- Separator -->
    <div class="panel-texto__separator" />

    <!-- Margin selector -->
    <div class="panel-texto__section">
      <label class="panel-texto__label panel-texto__label--with-icon">
        <svg class="panel-texto__label-icon" width="20" height="22" viewBox="0 0 20 22" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13.4583 3.39583L9.625 7.22917L5.79167 3.39583" fill="currentColor" fill-opacity="0.2"/>
          <path d="M13.4583 17.7708L9.625 13.9375L5.79167 17.7708" fill="currentColor" fill-opacity="0.2"/>
          <path d="M1 10.5833H18.25M9.625 1V7.22917M9.625 7.22917L13.4583 3.39583M9.625 7.22917L5.79167 3.39583M9.625 20.1667V13.9375M9.625 13.9375L13.4583 17.7708M9.625 13.9375L5.79167 17.7708" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Margen
      </label>
      <div class="panel-texto__margin-buttons">
        <button
          :class="[
            'panel-texto__margin-btn',
            { 'panel-texto__margin-btn--active': store.hasMargin }
          ]"
          @click="store.setHasMargin(true)"
        >
          Con margen
        </button>
        <button
          :class="[
            'panel-texto__margin-btn',
            { 'panel-texto__margin-btn--active': !store.hasMargin }
          ]"
          @click="store.setHasMargin(false)"
        >
          Sin margen
        </button>
      </div>
    </div>

    <!-- Margin color (only if margin is enabled) -->
    <div v-if="store.hasMargin" class="panel-texto__section panel-texto__section--pr0">
      <div class="panel-texto__color-header">
        <label class="panel-texto__label">Color del margen</label>
        <div class="panel-texto__color-nav">
          <button
            class="panel-texto__nav-btn"
            aria-label="Scroll left"
            @click="scrollColors('left')"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.75 10.5L5.25 7L8.75 3.5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button
            class="panel-texto__nav-btn"
            aria-label="Scroll right"
            @click="scrollColors('right')"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5.25 3.5L8.75 7L5.25 10.5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
      <div ref="colorScrollRef" class="panel-texto__colors-scroll">
        <div class="panel-texto__colors">
          <button
            v-for="color in MARGIN_COLORS"
            :key="color.id"
            :class="[
              'panel-texto__color-btn',
              { 'panel-texto__color-btn--active': store.marginColor === color.hex }
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
.panel-texto {
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

  &__separator {
    height: 1px;
    background-color: #e5e7eb;
    width: calc(100% - 40px);
    margin: 4px auto;
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

  &__label {
    font-family: $font-primary;
    font-size: 14px;
    font-weight: $font-weight-medium;
    color: #414651;

    &--with-icon {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  &__label-icon {
    color: $color-brand;
    flex-shrink: 0;
    width: 18px;
    height: 18px;
  }

  &__hint {
    font-family: $font-primary;
    font-size: 12px;
    color: #717680;
    margin: 0;
    margin-top: -4px;
  }

  // Text style buttons
  &__styles {
    display: flex;
    border-radius: 8px;
    overflow: hidden;
  }

  &__style-btn {
    @include button-reset;
    @include flex-center;
    flex: 1;
    min-height: 40px;
    padding: 8px 16px;
    font-size: 14px;
    background: #f5f5f5;
    color: #414651;
    transition: background-color $transition-fast, color $transition-fast;

    // Font-specific styles for each button
    &--moderno {
      font-family: $font-primary;
      font-weight: $font-weight-semibold;
    }

    &--clasico {
      font-family: $font-serif;
      font-weight: $font-weight-normal;
    }

    &--minimalista {
      font-family: $font-minimal;
      font-weight: $font-weight-light;
    }

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
      border-top-right-radius: 8px;
      border-bottom-right-radius: 8px;
    }

    &:first-child {
      border-top-left-radius: 8px;
      border-bottom-left-radius: 8px;
    }

    @include hover {
      background: #ebebeb;

      &.panel-texto__style-btn--active {
        background: $color-brand-light;
      }
    }
  }

  // Input
  &__input {
    padding: 12px 14px;
    font-family: $font-primary;
    font-size: 14px;
    color: #181d27;
    background: #ffffff;
    border: 1px solid #d5d6d9;
    border-radius: 8px;
    outline: none;
    transition: border-color $transition-fast;

    &::placeholder {
      color: #a0a4ab;
    }

    &:focus {
      border-color: $color-brand;
    }
  }

  // Margin buttons
  &__margin-buttons {
    display: flex;
    border-radius: 8px;
    overflow: hidden;
  }

  &__margin-btn {
    @include button-reset;
    @include flex-center;
    flex: 1;
    min-height: 40px;
    padding: 8px 16px;
    font-family: $font-primary;
    font-size: 14px;
    font-weight: $font-weight-semibold;
    background: #f5f5f5;
    color: #414651;
    transition: background-color $transition-fast, color $transition-fast;
    border-right: 1px solid #d5d7da;

    &:last-child {
      border-right: none;
    }

    &--active {
      background: $color-brand-light;
      color: $color-brand;
      border-right-color: $color-border;
    }

    @include hover {
      background: #ebebeb;

      &.panel-texto__margin-btn--active {
        background: $color-brand-light;
      }
    }
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
