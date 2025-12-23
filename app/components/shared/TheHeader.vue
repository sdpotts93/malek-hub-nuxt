<script setup lang="ts">
const route = useRoute()
const uiStore = useUIStore()
const cartStore = useCartStore()

const navigation = [
  { name: 'Personaliza', href: '/personaliza', icon: 'personaliza' },
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
        <span class="the-header__logo-text">studio<strong>M</strong></span>
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
          {{ item.name }}
        </NuxtLink>
      </nav>

      <!-- Actions -->
      <div class="the-header__actions">
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

        <!-- Notifications (placeholder) -->
        <button
          class="the-header__action-btn"
          aria-label="Notificaciones"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
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
    max-width: 1440px;
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
    font-weight: $font-weight-medium;
    color: $color-text-secondary;
    border-radius: $radius-lg;
    transition: background-color $transition-fast, color $transition-fast;

    @include hover {
      background: $color-bg-tertiary;
      color: $color-text-primary;
    }

    &--active {
      background: $color-brand-light;
      color: $color-brand;

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
  }

  &__cart-badge {
    position: absolute;
    top: 4px;
    right: 4px;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    background: $color-brand;
    color: $color-text-inverse;
    font-size: 10px;
    font-weight: $font-weight-bold;
    border-radius: $radius-full;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
