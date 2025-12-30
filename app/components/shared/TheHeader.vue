<script setup lang="ts">
const route = useRoute()
const uiStore = useUIStore()
const cartStore = useCartStore()

const navigation = [
  { name: 'Personaliza', href: '/personaliza', icon: 'image' },
  { name: 'Birth Poster', href: '/birth-poster', icon: 'birth-poster' },
  { name: 'Momentos', href: '/moments', icon: 'moments' },
]

const isActive = (href: string) => route.path === href

// Check if on a tool page (for showing history button on mobile)
const isToolPage = computed(() => route.path === '/birth-poster')
</script>

<template>
  <header class="the-header">
    <div class="the-header__container">
      <!-- Logo -->
      <NuxtLink to="/" class="the-header__logo">
        <NuxtImg height="32" src="/logos/logo-full.png" />
      </NuxtLink>

      <!-- Desktop Navigation -->
      <nav class="the-header__nav">
        <NuxtLink
          v-for="item in navigation"
          :key="item.href"
          :to="item.href"
          :class="[
            'the-header__nav-item',
            { 'the-header__nav-item--active': isActive(item.href) }
          ]"
        >
          <svg v-if="item.icon === 'image'" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Remix Icon by Remix Design - https://github.com/Remix-Design/RemixIcon/blob/master/License --><path fill="#000" d="M20 3a1 1 0 0 1 1 1v1.757l-2 2V5H5v8.1l4-4l4.328 4.329l-1.415 1.413L9 11.93l-4 3.999V19h10.533l.708.001l1.329-1.33L18.9 19h.1v-2.758l2-2V20a1 1 0 0 1-1 1H4c-.55 0-1-.45-1-1V4a1 1 0 0 1 1-1zm1.778 4.808l1.414 1.414L15.414 17l-1.416-.002l.002-1.412zM15.5 7a1.5 1.5 0 1 1 0 3a1.5 1.5 0 0 1 0-3"/></svg>
          <svg v-else-if="item.icon == 'birth-poster'"  xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-v-02281a80=""><path d="M9 12h.01" data-v-02281a80=""></path><path d="M15 12h.01" data-v-02281a80=""></path><path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5" data-v-02281a80=""></path><path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1" data-v-02281a80=""></path></svg>
          <svg v-else-if="item.icon == 'moments'" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from TDesign Icons by TDesign - https://github.com/Tencent/tdesign-icons/blob/main/LICENSE --><g fill="none"><path d="M3 3v18h6l2-9l2-9z"/><path d="M21 3h-8L9 21h12z"/><path stroke="#000" class="stroke" stroke-width="2" d="M13 3H3v18h6m4-18h8v13M13 3l-2 9m-2 9h12v-5M9 21l2-9m10 4l-10-4"/></g></svg>
          {{ item.name }}
        </NuxtLink>
      </nav>

      <!-- Actions -->
      <div class="the-header__actions">
        <!-- Home (mobile only, on tool pages) -->
        <button
          v-if="isToolPage"
          class="the-header__action-btn the-header__action-btn--mobile-only"
          aria-label="Inicio"
          @click="uiStore.openMobileNavWrapper('home')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </button>

        <!-- History (mobile only, on tool pages) -->
        <button
          v-if="isToolPage"
          class="the-header__action-btn the-header__action-btn--mobile-only"
          aria-label="Historial"
          @click="uiStore.openMobileNavWrapper('history')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </button>

        <!-- Cart -->
        <button
          class="the-header__action-btn the-header__cart-btn"
          aria-label="Carrito"
          @click="uiStore.toggleCart"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="8" cy="21" r="1"/>
            <circle cx="19" cy="21" r="1"/>
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
          </svg>
          <span
            v-if="cartStore.totalQuantity > 0"
            class="the-header__cart-badge"
          >
            {{ cartStore.totalQuantity }}
          </span>
        </button>
      </div>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.the-header {
  height: $header-height;
  background: $color-bg-primary;
  border-bottom: 1px solid $color-border;
  flex-shrink: 0;

  &__container {
    height: 100%;
    margin: 0 auto;
    padding: 0 $space-3xl;
    display: flex;
    align-items: center;
    gap: $space-4xl;

    @include mobile {
      padding: 0 $space-xl;
      gap: $space-xl;
    }
  }

  &__logo {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  &__logo-text {
    font-family: $font-secondary;
    font-size: $font-size-xl;
    font-weight: $font-weight-normal;
    color: $color-text-primary;
    letter-spacing: -0.02em;

    strong {
      font-weight: $font-weight-bold;
      color: $color-brand;
    }
  }

  &__nav {
    display: flex;
    align-items: center;
    gap: $space-md;
    flex: 1;
    justify-content: center;

    @include mobile {
      display: none;
    }
  }

  &__nav-item {
    padding: $space-md $space-xl;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: $color-text-secondary;
    border-radius: $radius-lg;
    transition: background-color $transition-fast, color $transition-fast;
    display: flex;
    align-items: center;
    gap: 10px;

    svg {
      height: 20px;
      width: 20px;
    }
    @include hover {
      background: $color-bg-tertiary;
      color: $color-text-primary;
    }

    &--active {
      background: $color-brand-light;
      color: $color-brand;

      svg {
        path {
          fill: $color-brand;
          &.stroke {
            stroke: $color-brand;
          }
        }
        // Stroke-based icons (like baby icon with fill="none")
        &[fill="none"] path {
          fill: none;
          stroke: $color-brand;
        }
      }
      @include hover {
        background: $color-brand-light;
        color: $color-brand;
      }
    }
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: $space-md;
    flex-shrink: 0;
    @include mobile {
      margin-left: auto
    }
  }

  &__action-btn {
    @include button-reset;
    @include flex-center;
    width: 40px;
    height: 40px;
    border-radius: $radius-lg;
    color: $color-text-secondary;
    transition: background-color $transition-fast, color $transition-fast;

    @include hover {
      background: $color-bg-tertiary;
      color: $color-text-primary;
    }

    svg {
      width: 20px;
      height: 20px;
    }

    &--mobile-only {
      display: none;

      @include mobile {
        display: flex;
      }
    }
  }

  &__cart-btn {
    position: relative;
    background: #1a202c;
    color: white;
    border-radius: $radius-xl;

    @include hover {
      background: #2d3748;
      color: white;
    }

    svg {
      width: 18px;
      height: 18px;
    }
  }

  &__cart-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    background: #e53e3e;
    color: white;
    font-size: 11px;
    font-weight: $font-weight-bold;
    border-radius: $radius-full;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
