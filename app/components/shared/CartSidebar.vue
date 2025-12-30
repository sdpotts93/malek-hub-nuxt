<script setup lang="ts">
const uiStore = useUIStore()
const { lines, subtotal, isEmpty, isLoading, formatPrice, removeItem, updateQuantity, checkout } = useShopifyCart()

// Get visible attributes (not prefixed with _)
function getVisibleAttributes(attributes: Array<{ key: string; value: string }>) {
  return attributes.filter(attr => !attr.key.startsWith('_'))
}

// Close on escape
onMounted(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      uiStore.closeCart()
    }
  }
  window.addEventListener('keydown', handleEscape)
  onUnmounted(() => window.removeEventListener('keydown', handleEscape))
})
</script>

<template>
  <Teleport to="body">
    <!-- Overlay -->
    <Transition name="fade">
      <div
        v-if="uiStore.isCartOpen"
        class="cart-sidebar__overlay"
        @click="uiStore.closeCart"
      />
    </Transition>

    <!-- Sidebar -->
    <Transition name="slide-right">
      <aside
        v-if="uiStore.isCartOpen"
        class="cart-sidebar"
        role="dialog"
        aria-label="Carrito de compras"
      >
        <!-- Header -->
        <div class="cart-sidebar__header">
          <h2 class="cart-sidebar__title">Tu Carrito</h2>
          <button
            class="cart-sidebar__close"
            aria-label="Cerrar carrito"
            @click="uiStore.closeCart"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18"/>
              <path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="cart-sidebar__content">
          <!-- Loading state -->
          <div v-if="isLoading" class="cart-sidebar__loading">
            <span class="cart-sidebar__spinner" />
            Cargando...
          </div>

          <!-- Empty state -->
          <div v-else-if="isEmpty" class="cart-sidebar__empty">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="8" cy="21" r="1"/>
              <circle cx="19" cy="21" r="1"/>
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
            </svg>
            <p>Tu carrito está vacío</p>
            <NuxtLink
              to="/birth-poster"
              class="cart-sidebar__cta"
              @click="uiStore.closeCart"
            >
              Crear un diseño
            </NuxtLink>
          </div>

          <!-- Items -->
          <div v-else class="cart-sidebar__items">
            <div
              v-for="item in lines"
              :key="item.id"
              class="cart-item"
            >
              <!-- Thumbnail - prefer thumbnail > design image > Shopify image -->
              <div class="cart-item__image">
                <NuxtImg
                  v-if="item.thumbnailImage"
                  :src="item.thumbnailImage"
                  :alt="item.productTitle"
                  class="cart-item__img"
                  width="80"
                  height="100"
                  loading="lazy"
                />
                <NuxtImg
                  v-else-if="item.designImage"
                  :src="item.designImage"
                  :alt="item.productTitle"
                  class="cart-item__img"
                  width="80"
                  height="100"
                  loading="lazy"
                />
                <NuxtImg
                  v-else-if="item.shopifyImage"
                  :src="item.shopifyImage"
                  :alt="item.productTitle"
                  width="80"
                  height="100"
                />
                <div v-else class="cart-item__placeholder" />
              </div>

              <!-- Details -->
              <div class="cart-item__details">
                <h3 class="cart-item__title">{{ item.productTitle }}</h3>

                <!-- Custom attributes (visible ones only, not _prefixed) -->
                <div v-if="getVisibleAttributes(item.attributes).length" class="cart-item__attrs">
                  <span
                    v-for="attr in getVisibleAttributes(item.attributes)"
                    :key="attr.key"
                  >
                    <strong>{{ attr.key }}:</strong> {{ attr.value }}
                  </span>
                </div>

                <!-- Price & Quantity -->
                <div class="cart-item__footer">
                  <span class="cart-item__price">
                    {{ formatPrice(item.price) }}
                  </span>

                  <div class="cart-item__quantity">
                    <button
                      class="cart-item__qty-btn"
                      @click="updateQuantity(item.id, item.quantity - 1)"
                    >
                      -
                    </button>
                    <span>{{ item.quantity }}</span>
                    <button
                      class="cart-item__qty-btn"
                      @click="updateQuantity(item.id, item.quantity + 1)"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <!-- Remove button -->
              <button
                class="cart-item__remove"
                aria-label="Eliminar"
                @click="removeItem(item.id)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 6h18"/>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div v-if="!isEmpty" class="cart-sidebar__footer">
          <div class="cart-sidebar__subtotal">
            <span>Subtotal</span>
            <span class="cart-sidebar__subtotal-price">{{ formatPrice(subtotal) }}</span>
          </div>
          <p class="cart-sidebar__shipping">
            Envío calculado en el checkout
          </p>
          <button
            class="cart-sidebar__checkout"
            @click="checkout"
          >
            Proceder al pago
          </button>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.cart-sidebar {
  position: fixed;
  top: 0;
  right: 0;
  width: 100%;
  max-width: 400px;
  height: 100dvh;
  background: $color-bg-primary;
  box-shadow: $shadow-xl;
  z-index: $z-modal;
  display: flex;
  flex-direction: column;

  @include mobile {
    max-width: 100%;
  }

  &__overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: $z-modal-backdrop;
  }

  &__header {
    @include flex-between;
    padding: $space-xl $space-3xl;
    border-bottom: 1px solid $color-border;
    flex-shrink: 0;
  }

  &__title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
  }

  &__close {
    @include button-reset;
    @include flex-center;
    width: 32px;
    height: 32px;
    border-radius: $radius-md;
    color: $color-text-secondary;

    @include hover {
      background: $color-bg-tertiary;
      color: $color-text-primary;
    }
  }

  &__content {
    flex: 1;
    overflow-y: auto;
    @include custom-scrollbar;
  }

  &__loading,
  &__empty {
    @include flex-center;
    flex-direction: column;
    gap: $space-xl;
    padding: $space-6xl $space-3xl;
    color: $color-text-secondary;
    text-align: center;

    svg {
      opacity: 0.5;
    }
  }

  &__cta {
    padding: $space-md $space-xl;
    background: $color-brand;
    color: $color-text-inverse;
    font-weight: $font-weight-medium;
    border-radius: $radius-lg;
    transition: background-color $transition-fast;

    @include hover {
      background: $color-brand-hover;
    }
  }

  &__spinner {
    width: 24px;
    height: 24px;
    border: 2px solid $color-border;
    border-top-color: $color-brand;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  &__items {
    padding: $space-xl;
    display: flex;
    flex-direction: column;
    gap: $space-xl;
  }

  &__footer {
    padding: $space-xl $space-3xl;
    border-top: 1px solid $color-border;
    flex-shrink: 0;
  }

  &__subtotal {
    @include flex-between;
    margin-bottom: $space-md;
  }

  &__subtotal-price {
    font-size: $font-size-lg;
    font-weight: $font-weight-bold;
  }

  &__shipping {
    font-size: $font-size-sm;
    color: $color-text-secondary;
    margin-bottom: $space-xl;
  }

  &__checkout {
    @include button-reset;
    width: 100%;
    padding: $space-xl;
    background: $color-brand;
    color: $color-text-inverse;
    font-weight: $font-weight-semibold;
    border-radius: $radius-lg;
    transition: background-color $transition-fast;

    @include hover {
      background: $color-brand-hover;
    }
  }
}

.cart-item {
  display: flex;
  gap: $space-lg;
  padding: $space-lg;
  background: $color-bg-secondary;
  border-radius: $radius-lg;

  &__image {
    width: 80px;
    height: 100px;
    border-radius: $radius-md;
    overflow: hidden;
    flex-shrink: 0;
    background: $color-bg-tertiary;

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  &__placeholder {
    width: 100%;
    height: 100%;
    background: $color-bg-tertiary;
  }

  &__details {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: $space-xs;
  }

  &__title {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    @include text-truncate;
  }

  &__attrs {
    font-size: $font-size-xs;
    color: $color-text-secondary;
    display: flex;
    flex-wrap: wrap;
    gap: $space-xxs;
    flex-direction: column;
    margin-top: $space-md;

    span {
      // &::after {
      //   content: '•';
      //   margin-left: $space-xs;
      // }

      &:last-child::after {
        display: none;
      }
    }
  }

  &__footer {
    @include flex-between;
    margin-top: auto;
  }

  &__price {
    font-weight: $font-weight-semibold;
    color: $color-brand;
  }

  &__quantity {
    display: flex;
    align-items: center;
    gap: $space-md;
    font-size: $font-size-sm;
  }

  &__qty-btn {
    @include button-reset;
    @include flex-center;
    width: 24px;
    height: 24px;
    border: 1px solid $color-border;
    border-radius: $radius-md;
    font-weight: $font-weight-bold;

    @include hover {
      background: $color-bg-tertiary;
    }
  }

  &__remove {
    @include button-reset;
    @include flex-center;
    width: 28px;
    height: 28px;
    color: $color-text-muted;
    align-self: flex-start;

    @include hover {
      color: $color-error;
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
