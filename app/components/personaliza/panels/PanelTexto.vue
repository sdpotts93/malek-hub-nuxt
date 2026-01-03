<script setup lang="ts">
import type { TextStyle } from '~/stores/personaliza'
import { MARGIN_COLORS } from '~/stores/personaliza'

const store = usePersonalizaStore()

// Text style options
const textStyles: { id: TextStyle; label: string }[] = [
  { id: 'moderno', label: 'Moderno' },
  { id: 'clasico', label: 'Clasico' },
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
        <svg class="panel-texto__title-icon" width="20" height="20" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15.3334 7.66665L1.91675 21.0833M17.2501 14.375H8.62508M6.32508 18.2083H12.7816C13.016 18.2083 13.1332 18.2083 13.2435 18.1818C13.3413 18.1584 13.4348 18.1196 13.5205 18.0671C13.6172 18.0078 13.7001 17.925 13.8658 17.7592L18.6876 12.9375C18.9166 12.7085 19.0311 12.594 19.1232 12.4926C21.1167 10.2995 21.1167 6.95047 19.1232 4.75737C19.0311 4.65599 18.9166 4.54149 18.6876 4.31249C18.4586 4.08348 18.3441 3.96898 18.2427 3.87683C16.0496 1.88334 12.7006 1.88334 10.5075 3.87683C10.4061 3.96898 10.2916 4.08348 10.0626 4.31248L5.24085 9.13422C5.07511 9.29996 4.99223 9.38283 4.93297 9.47955C4.88042 9.56529 4.8417 9.65877 4.81823 9.75655C4.79175 9.86685 4.79175 9.98405 4.79175 10.2184V16.675C4.79175 17.2117 4.79175 17.4801 4.8962 17.6851C4.98808 17.8654 5.13469 18.012 5.31501 18.1039C5.52001 18.2083 5.78836 18.2083 6.32508 18.2083Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Personaliza tu poster
      </h3>
      <p class="panel-texto__description">
        Anade texto y personaliza el estilo de tu poster
      </p>
    </div>

    <!-- Text Style -->
    <div class="panel-texto__section">
      <label class="panel-texto__label">Estilo de texto</label>
      <div class="panel-texto__styles">
        <button
          v-for="style in textStyles"
          :key="style.id"
          :class="[
            'panel-texto__style-btn',
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

    <!-- Margin toggle -->
    <div class="panel-texto__section">
      <div class="panel-texto__toggle-row">
        <label class="panel-texto__label">Margen blanco</label>
        <button
          :class="[
            'panel-texto__toggle',
            { 'panel-texto__toggle--active': store.hasMargin }
          ]"
          @click="store.setHasMargin(!store.hasMargin)"
        >
          <span class="panel-texto__toggle-knob" />
        </button>
      </div>
      <p class="panel-texto__hint">
        Anade un margen alrededor de tu imagen
      </p>
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
              <path d="M8.75 10.5L5.25 7L8.75 3.5" stroke="#F2330D" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button
            class="panel-texto__nav-btn"
            aria-label="Scroll right"
            @click="scrollColors('right')"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5.25 3.5L8.75 7L5.25 10.5" stroke="#F2330D" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
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
    flex: 1;
    padding: 10px 16px;
    font-family: $font-primary;
    font-size: 14px;
    font-weight: $font-weight-semibold;
    background: #f5f5f5;
    color: #414651;
    transition: background-color $transition-fast, color $transition-fast;

    &--active {
      background: #fff0e5;
      color: $color-brand;
    }

    @include hover {
      background: #ebebeb;

      &.panel-texto__style-btn--active {
        background: #fff0e5;
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

  // Toggle
  &__toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__toggle {
    @include button-reset;
    width: 44px;
    height: 24px;
    background: #e5e7eb;
    border-radius: 12px;
    padding: 2px;
    transition: background-color $transition-fast;
    cursor: pointer;

    &--active {
      background: $color-brand;
    }
  }

  &__toggle-knob {
    display: block;
    width: 20px;
    height: 20px;
    background: #ffffff;
    border-radius: 50%;
    transition: transform $transition-fast;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    .panel-texto__toggle--active & {
      transform: translateX(20px);
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
