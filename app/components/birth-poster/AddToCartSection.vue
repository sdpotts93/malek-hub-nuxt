<script setup lang="ts">
interface Props {
  price: number
  compareAtPrice: number | null
  isLoading?: boolean
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  compact: false,
})

const emit = defineEmits<{
  'add-to-cart': []
}>()

const { formatPrice } = useShopifyCart()
</script>

<template>
  <div :class="['add-to-cart', { 'add-to-cart--compact': compact }]">
    <!-- Price Row -->
    <div class="add-to-cart__price-row">
      <span class="add-to-cart__label">Total</span>
      <div class="add-to-cart__prices">
        <span v-if="compareAtPrice && compareAtPrice > price" class="add-to-cart__compare-price">
          {{ formatPrice(compareAtPrice) }}
        </span>
        <span class="add-to-cart__price">
          {{ formatPrice(price) }}
        </span>
      </div>
    </div>

    <!-- Add to Cart Button + Info -->
    <div class="add-to-cart__action-group">
      <button
        class="add-to-cart__button"
        :disabled="isLoading"
        @click="emit('add-to-cart')"
      >
        <span class="add-to-cart__button-text" :class="{ 'add-to-cart__button-text--hidden': isLoading }">
          Agregar al carrito
        </span>
        <span v-if="isLoading" class="add-to-cart__spinner" />
      </button>

      <!-- Info Row: Shipping + Reviews -->
      <div v-if="!compact" class="add-to-cart__info-row">
        <div class="add-to-cart__shipping">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"/>
            <path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2"/>
            <circle cx="7" cy="18" r="2"/>
            <path d="M15 18H9"/>
            <circle cx="17" cy="18" r="2"/>
          </svg>
          <span>Envio Gratuito 3-5 días</span>
        </div>

        <div class="add-to-cart__reviews">
          <div class="add-to-cart__stars">
            <svg v-for="i in 5" :key="i" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <span class="add-to-cart__review-text">
            <span class="add-to-cart__review-prefix">Más de</span>
            <span class="add-to-cart__review-count">6000 reseñas</span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.add-to-cart {
  padding: 20px;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  gap: 13px;
  flex-shrink: 0;
  box-shadow:
    0px -12px 16px -4px rgba(10, 13, 18, 0.03),
    0px -4px 6px -2px rgba(10, 13, 18, 0.03),
    0px -2px 2px -1px rgba(10, 13, 18, 0.04);

  &--compact {
    padding: 12px 16px;
    gap: 8px;
  }

  &__price-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__label {
    font-family: $font-primary;
    font-size: 18px;
    font-weight: $font-weight-bold;
    line-height: 28px;
    color: #181d27;
  }

  &__prices {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    text-align: center;
  }

  &__compare-price {
    font-family: $font-primary;
    font-size: 16px;
    font-weight: $font-weight-semibold;
    line-height: 24px;
    color: #717680;
    text-decoration: line-through;
  }

  &__price {
    font-family: $font-primary;
    font-size: 18px;
    font-weight: $font-weight-bold;
    line-height: 28px;
    color: #181d27;

    .add-to-cart--compact & {
      font-size: 16px;
      line-height: 24px;
    }
  }

  &__action-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__button {
    @include button-reset;
    @include flex-center;
    position: relative;
    width: 100%;
    padding: 16px 22px;
    background: $color-brand;
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #ffffff;
    font-family: $font-primary;
    font-size: 18px;
    font-weight: $font-weight-semibold;
    line-height: 28px;
    border-radius: 10px;
    overflow: hidden;
    transition: background-color $transition-fast, opacity $transition-fast;

    // Skeuomorphic inner shadows
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      border-radius: 10px;
      box-shadow:
        inset 0px 0px 0px 1px rgb(255 255 255 / 33%),
        inset 0px -2px 0px 0px rgba(10, 13, 18, 0.05);
    }

    .add-to-cart--compact & {
      padding: 12px 16px;
      font-size: 16px;
      line-height: 24px;
    }

    @include hover {
      background: $color-brand-hover;
    }

    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  }

  &__button-text {
    &--hidden {
      visibility: hidden;
    }
  }

  &__spinner {
    position: absolute;
    width: 24px;
    height: 24px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  &__info-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__shipping {
    display: flex;
    align-items: center;
    gap: 4px;

    span {
      font-family: $font-primary;
      font-size: 8px;
      font-weight: $font-weight-semibold;
      line-height: 20px;
      color: #181d27;
    }

    svg {
      width: 18px;
      height: 18px;
      color: #2f3038;
    }
  }

  &__reviews {
    display: flex;
    align-items: center;
    gap: 3px;
  }

  &__stars {
    display: flex;
    align-items: center;

    svg {
      width: 15px;
      height: 15px;
      color: #d9d618;
    }
  }

  &__review-text {
    font-size: 8px;
    line-height: 23px;
    color: #181d27;
    text-align: center;
  }

  &__review-prefix {
    font-family: $font-primary;
    font-weight: $font-weight-medium;
  }

  &__review-count {
    font-family: $font-primary;
    font-weight: $font-weight-extrabold;
    margin-left: 2px;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
