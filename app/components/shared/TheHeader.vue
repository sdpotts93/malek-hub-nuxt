<script setup lang="ts">
const route = useRoute()
const uiStore = useUIStore()
const cartStore = useCartStore()

const navigation = [
  { name: 'Personaliza', href: '/personaliza', icon: 'image' },
  { name: 'Birth Poster', href: '/birth-poster', icon: 'birth-poster' },
  { name: 'Momentos', href: '/momentos', icon: 'moments' },
]

const isActive = (href: string) => route.path === href

// Check if on a tool page (for showing history button on mobile)
const isToolPage = computed(() => route.path === '/birth-poster' || route.path === '/personaliza' || route.path === '/momentos')
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
          <svg v-else-if="item.icon == 'birth-poster'" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 14 18" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M3.07684 10.7247C3.19371 11.7304 3.36051 12.4898 3.72329 13.3852C4.08594 14.2803 4.8858 15.4771 5.86157 16.1892C6.83733 16.9012 8.42889 17.5661 9.50479 17.4947C10.5807 17.4236 11.0602 17.026 11.5551 16.5225C12.0498 16.0189 13.1621 14.4862 13.5497 13.0549C13.9377 11.6239 13.6957 11.1217 13.3835 10.7064C13.0716 10.2911 12.3677 10.0092 11.4071 10.0826C10.4464 10.156 9.40867 10.752 9.34964 11.2445C9.25834 12.0058 10.676 12.1109 10.4464 12.7796C10.3542 13.0489 10.0105 13.2658 9.09837 13.2383C8.18619 13.211 7.18766 12.7679 6.95554 12.0641C6.72341 11.3603 6.82488 10.7137 7.31779 10.3724C9.39957 8.93126 10.0942 7.74411 10.2308 7.20426C10.3673 6.6644 10.1536 6.03147 9.61349 5.54627C8.45366 4.50432 6.12127 4.96998 4.99022 5.77152C3.31151 6.96146 2.85141 8.78553 3.07684 10.7247ZM5.81565 0.885972C5.62141 1.32397 5.36545 2.23867 5.62368 2.99313C5.88205 3.7476 6.85942 4.60179 7.93438 4.40247C9.00921 4.20302 8.97628 2.52535 8.76557 1.79747C8.57494 1.13941 7.61564 0.0565121 6.9455 0.00385636C6.27535 -0.0487993 6.01003 0.447707 5.81565 0.885972ZM2.65931 3.47408C3.28862 4.39489 4.27282 4.53876 4.77242 4.36856C5.27201 4.19823 5.05608 2.80751 4.75515 2.16872C4.37911 1.37091 3.50241 1.29764 2.99224 1.5576C2.48206 1.81729 2.03013 2.55327 2.65931 3.47408ZM1.04352 4.13254C0.378461 4.36218 0.570562 5.7396 0.955433 6.28677C1.34017 6.83394 2.49063 7.13724 2.934 6.64366C3.37751 6.15008 2.8253 5.17396 2.55877 4.85815C2.29224 4.54209 1.70858 3.9029 1.04352 4.13254ZM0.0557052 7.57617C0.244325 7.14575 1.11286 7.1887 1.7644 7.56341C2.58555 8.03585 2.61888 9.221 2.13481 9.41434C1.74338 9.57071 1.04968 9.46952 0.616479 9.12632C0.183281 8.78313 -0.132915 8.00646 0.0557052 7.57617Z"/></svg>
          <svg v-else-if="item.icon == 'moments'" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"><!-- Icon from TDesign Icons by TDesign - https://github.com/Tencent/tdesign-icons/blob/main/LICENSE --><g fill="none"><path d="M3 3v18h6l2-9l2-9z"/><path d="M21 3h-8L9 21h12z"/><path stroke="#000" class="stroke" stroke-width="2" d="M13 3H3v18h6m4-18h8v13M13 3l-2 9m-2 9h12v-5M9 21l2-9m10 4l-10-4"/></g></svg>
          {{ item.name }}
        </NuxtLink>
      </nav>

      <!-- Actions -->
      <div class="the-header__actions">
        <!-- Home (mobile only, on tool pages) -->
        <button
          v-if="isToolPage"
          :class="[
            'the-header__action-btn',
            'the-header__action-btn--mobile-only',
            { 'the-header__action-btn--active': uiStore.mobileNavWrapperContent === 'home' }
          ]"
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
          :class="[
            'the-header__action-btn',
            'the-header__action-btn--mobile-only',
            { 'the-header__action-btn--active': uiStore.mobileNavWrapperContent === 'history' }
          ]"
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

    &--active {
      background: $color-brand-lightish;
      color: $color-text-primary;
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
