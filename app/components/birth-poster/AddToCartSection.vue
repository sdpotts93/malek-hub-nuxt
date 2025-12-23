<script setup lang="ts">
interface Props {
  price: number
  compareAtPrice: number
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

// Calculate discount percentage
const discountPercent = computed(() => {
  if (props.compareAtPrice <= props.price) return 0
  return Math.round((1 - props.price / props.compareAtPrice) * 100)
})
</script>

<template>
  <div :class="['add-to-cart', { 'add-to-cart--compact': compact }]">
    <!-- Price -->
    <div class="add-to-cart__price-row">
      <div class="add-to-cart__prices">
        <span v-if="compareAtPrice > price" class="add-to-cart__compare-price">
          {{ formatPrice(compareAtPrice) }}
        </span>
        <span class="add-to-cart__price">
          {{ formatPrice(price) }}
        </span>
        <span v-if="discountPercent > 0" class="add-to-cart__discount">
          -{{ discountPercent }}%
        </span>
      </div>
    </div>

    <!-- Add to Cart Button -->
    <button
      class="add-to-cart__button"
      :disabled="isLoading"
      @click="emit('add-to-cart')"
    >
      <span v-if="isLoading" class="add-to-cart__spinner" />
      <span v-else>Agregar al carrito</span>
    </button>

    <!-- Shipping Info -->
    <div v-if="!compact" class="add-to-cart__shipping">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"/>
        <path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2"/>
        <circle cx="7" cy="18" r="2"/>
        <path d="M15 18H9"/>
        <circle cx="17" cy="18" r="2"/>
      </svg>
      <span>Envío Gratuito 3-5 días</span>
    </div>

    <!-- Reviews (placeholder) -->
    <div v-if="!compact" class="add-to-cart__reviews">
      <div class="add-to-cart__stars">
        <svg v-for="i in 5" :key="i" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      </div>
      <span class="add-to-cart__review-count">128 reseñas</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.add-to-cart {
  padding: $space-xl $space-3xl;
  border-bottom: 1px solid $color-border;
  display: flex;
  flex-direction: column;
  gap: $space-lg;

  &--compact {
    padding: $space-lg $space-xl;
    gap: $space-md;
  }

  &__price-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__prices {
    display: flex;
    align-items: baseline;
    gap: $space-md;
  }

  &__compare-price {
    font-size: $font-size-sm;
    color: $color-text-muted;
    text-decoration: line-through;
  }

  &__price {
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    color: $color-text-primary;

    .add-to-cart--compact & {
      font-size: $font-size-lg;
    }
  }

  &__discount {
    padding: $space-xs $space-md;
    background: $color-brand-light;
    color: $color-brand;
    font-size: $font-size-xs;
    font-weight: $font-weight-bold;
    border-radius: $radius-full;
  }

  &__button {
    @include button-reset;
    @include flex-center;
    width: 100%;
    padding: $space-xl;
    background: $color-brand;
    color: $color-text-inverse;
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    border-radius: $radius-lg;
    transition: background-color $transition-fast, opacity $transition-fast;

    .add-to-cart--compact & {
      padding: $space-lg;
      font-size: $font-size-sm;
    }

    @include hover {
      background: $color-brand-hover;
    }

    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  }

  &__spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  &__shipping {
    display: flex;
    align-items: center;
    gap: $space-md;
    font-size: $font-size-sm;
    color: $color-text-secondary;

    svg {
      color: $color-success;
    }
  }

  &__reviews {
    display: flex;
    align-items: center;
    gap: $space-md;
  }

  &__stars {
    display: flex;
    gap: 2px;
    color: #fbbf24;
  }

  &__review-count {
    font-size: $font-size-sm;
    color: $color-text-secondary;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
