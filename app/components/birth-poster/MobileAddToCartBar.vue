<script setup lang="ts">
interface Props {
  price: number
  compareAtPrice: number | null
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
})

const emit = defineEmits<{
  'add-to-cart': []
}>()

const { formatPrice } = useShopifyCart()

// Check if compare price should be shown
const showComparePrice = computed(() => {
  return props.compareAtPrice !== null && props.compareAtPrice > props.price
})

// Formatted compare price (only used when showComparePrice is true)
const formattedComparePrice = computed(() => {
  return props.compareAtPrice !== null ? formatPrice(props.compareAtPrice) : ''
})

// Calculate discount percentage
const discountPercent = computed(() => {
  if (props.compareAtPrice === null || props.compareAtPrice <= props.price) return 0
  return Math.round((1 - props.price / props.compareAtPrice) * 100)
})
</script>

<template>
  <div class="mobile-add-to-cart-bar">
    <!-- Price Info -->
    <div class="mobile-add-to-cart-bar__info">
      <div class="mobile-add-to-cart-bar__prices">
        <span class="mobile-add-to-cart-bar__price">
          {{ formatPrice(price) }}
        </span>
        <span v-if="showComparePrice" class="mobile-add-to-cart-bar__compare-price">
          {{ formattedComparePrice }}
        </span>
      </div>
      <span v-if="discountPercent > 0" class="mobile-add-to-cart-bar__discount">
        -{{ discountPercent }}%
      </span>
    </div>

    <!-- Add to Cart Button -->
    <button
      class="mobile-add-to-cart-bar__button"
      :disabled="isLoading"
      @click="emit('add-to-cart')"
    >
      <span v-if="isLoading" class="mobile-add-to-cart-bar__spinner" />
      <span v-else>Agregar al carrito</span>
    </button>
  </div>
</template>

<style lang="scss" scoped>
.mobile-add-to-cart-bar {
  position: fixed;
  bottom: $bottom-navbar-height;
  left: 0;
  right: 0;
  height: $mobile-cart-bar-height;
  background: $color-bg-primary;
  border-top: 1px solid $color-border;
  padding: $space-lg $space-xl;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-lg;
  z-index: $z-fixed;

  &__info {
    display: flex;
    align-items: center;
    gap: $space-md;
  }

  &__prices {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__price {
    font-size: $font-size-lg;
    font-weight: $font-weight-bold;
    color: $color-text-primary;
    line-height: 1.2;
  }

  &__compare-price {
    font-size: $font-size-xs;
    color: $color-text-muted;
    text-decoration: line-through;
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
    flex: 1;
    max-width: 200px;
    padding: $space-lg $space-xl;
    background: $color-brand;
    color: $color-text-inverse;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    border-radius: $radius-lg;
    transition: background-color $transition-fast, opacity $transition-fast;

    @include hover {
      background: $color-brand-hover;
    }

    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  }

  &__spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
