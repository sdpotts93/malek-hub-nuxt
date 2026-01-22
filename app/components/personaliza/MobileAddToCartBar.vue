<script setup lang="ts">
interface Props {
  price: number
  compareAtPrice: number | null
  isLoading?: boolean
  missingElements?: string[]
  canProceed?: boolean // If false, only shows "Volver a editar" in modal (no "Continuar" option)
  hasImage?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  missingElements: () => [],
  canProceed: true,
  hasImage: true,
})

const emit = defineEmits<{
  'add-to-cart': []
  'edit': []
  'upload': []
}>()

const { formatPrice } = useShopifyCart()

// Modal state
const showWarningModal = ref(false)

// Handle add to cart click
function handleAddToCartClick() {
  if (props.missingElements && props.missingElements.length > 0) {
    showWarningModal.value = true
  } else {
    emit('add-to-cart')
  }
}

// Proceed with add to cart despite warnings
function handleProceedAnyway() {
  showWarningModal.value = false
  emit('add-to-cart')
}

// Cancel and close modal - emit edit event to navigate to archivo panel
function handleCancel() {
  showWarningModal.value = false
  emit('edit')
}

// Check if compare price should be shown
const showComparePrice = computed(() => {
  return props.compareAtPrice !== null && props.compareAtPrice > props.price
})

// Formatted compare price (only used when showComparePrice is true)
const formattedComparePrice = computed(() => {
  return props.compareAtPrice !== null ? formatPrice(props.compareAtPrice) : ''
})

</script>

<template>
  <Teleport to="body">
    <div class="mobile-add-to-cart-bar">
      <template v-if="props.hasImage">
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
          <span class="mobile-add-to-cart-bar__shipping">
            Envio Gratuito 3-5 dias
          </span>
        </div>

        <!-- Add to Cart Button -->
        <button
          class="mobile-add-to-cart-bar__button"
          :disabled="isLoading"
          @click="handleAddToCartClick"
        >
          <span v-if="isLoading" class="mobile-add-to-cart-bar__spinner" />
          <span v-else>Agregar al carrito</span>
        </button>
      </template>
      <template v-else>
        <button
          class="mobile-add-to-cart-bar__button mobile-add-to-cart-bar__button--solo"
          type="button"
          @click="emit('upload')"
        >
          <span class="mobile-add-to-cart-bar__button-label">Cargar archivos</span>
          <svg class="mobile-add-to-cart-bar__button-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M6.66699 13.3333L10.0003 10M10.0003 10L13.3337 13.3333M10.0003 10V17.5M16.667 13.9524C17.6849 13.1117 18.3337 11.8399 18.3337 10.4167C18.3337 7.88536 16.2816 5.83333 13.7503 5.83333C13.5682 5.83333 13.3979 5.73833 13.3054 5.58145C12.2187 3.73736 10.2124 2.5 7.91699 2.5C4.46521 2.5 1.66699 5.29822 1.66699 8.75C1.66699 10.4718 2.36372 12.0309 3.48945 13.1613" stroke="currentColor" stroke-width="1.67" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </template>

    <!-- Warning Modal for Missing Elements -->
    <Transition name="modal">
      <div
        v-if="showWarningModal"
        class="mobile-add-to-cart-bar__modal-overlay"
        @click="handleCancel"
      >
        <div class="mobile-add-to-cart-bar__modal" @click.stop>
          <div class="mobile-add-to-cart-bar__modal-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <path d="M12 9v4"/>
              <path d="M12 17h.01"/>
            </svg>
          </div>
          <h3 class="mobile-add-to-cart-bar__modal-title">Elementos faltantes</h3>
          <p class="mobile-add-to-cart-bar__modal-text">
            Tu diseño tiene los siguientes elementos pendientes:
          </p>
          <ul class="mobile-add-to-cart-bar__modal-list">
            <li v-for="(element, index) in missingElements" :key="index">
              {{ element }}
            </li>
          </ul>
          <p v-if="canProceed" class="mobile-add-to-cart-bar__modal-question">
            ¿Deseas continuar de todas formas?
          </p>
          <div :class="['mobile-add-to-cart-bar__modal-actions', { 'mobile-add-to-cart-bar__modal-actions--single': !canProceed }]">
            <button
              class="mobile-add-to-cart-bar__modal-btn mobile-add-to-cart-bar__modal-btn--secondary"
              @click="handleCancel"
            >
              Volver a editar
            </button>
            <button
              v-if="canProceed"
              class="mobile-add-to-cart-bar__modal-btn mobile-add-to-cart-bar__modal-btn--primary"
              @click="handleProceedAnyway"
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    </Transition>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
.mobile-add-to-cart-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 88px;
  background: #ffffff;
  border-top: 1px solid #f5f5f5;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  z-index: $z-fixed + 1;

  &__info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  &__prices {
    display: flex;
    align-items: baseline;
    gap: 8px;
    flex-wrap: wrap;
  }

  &__price {
    font-size: 18px;
    font-weight: $font-weight-semibold;
    color: #181d27;
    line-height: 1.3;
  }

  &__compare-price {
    font-size: $font-size-xs;
    color: $color-text-muted;
    text-decoration: line-through;
  }

  &__shipping {
    font-size: 9.5px;
    font-weight: $font-weight-medium;
    color: #181d27;
  }

  &__button {
    @include button-reset;
    @include flex-center;
    flex: 1 0 0;
    padding: 10px 16px;
    background: #252b37;
    color: #ffffff;
    font-size: 16px;
    font-weight: $font-weight-semibold;
    border-radius: 8px;
    border: 2px solid rgba(255, 255, 255, 0.12);
    transition: background-color $transition-fast, opacity $transition-fast;
    position: relative;
    overflow: hidden;
    box-shadow: 0px 1px 2px 0px rgba(10, 13, 18, 0.05);

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      box-shadow: inset 0px 0px 0px 1px rgba(10, 13, 18, 0.18), inset 0px -2px 0px 0px rgba(10, 13, 18, 0.05);
    }

    @include hover {
      background: #1a1f28;
    }

    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  }

  &__button--solo {
    width: 100%;
    gap: 8px;
  }

  &__button-label {
    display: inline-flex;
    align-items: center;
  }

  &__button-icon {
    flex-shrink: 0;
  }

  &__spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  // Modal styles
  &__modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: $z-modal;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  &__modal {
    background: white;
    border-radius: 12px;
    padding: 24px;
    max-width: 400px;
    width: 100%;
    text-align: center;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  &__modal-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    background: #fef3c7;
    color: #d97706;
  }

  &__modal-title {
    font-family: $font-primary;
    font-size: 18px;
    font-weight: $font-weight-semibold;
    color: #181d27;
    margin: 0 0 16px;
  }

  &__modal-text {
    font-family: $font-primary;
    font-size: 14px;
    color: #535862;
    margin: 0 0 12px;
    line-height: 1.5;
  }

  &__modal-list {
    text-align: left;
    margin: 0 0 16px;
    padding-left: 20px;
    font-family: $font-primary;
    font-size: 14px;
    color: #535862;
    line-height: 1.6;
    list-style-type: disc;

    li {
      margin-bottom: 4px;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  &__modal-question {
    font-family: $font-primary;
    font-size: 14px;
    font-weight: $font-weight-medium;
    color: #181d27;
    margin: 0 0 20px;
  }

  &__modal-actions {
    display: flex;
    gap: 12px;

    &--single {
      .mobile-add-to-cart-bar__modal-btn {
        flex: none;
        width: 100%;
      }
    }
  }

  &__modal-btn {
    @include button-reset;
    flex: 1;
    padding: 12px 16px;
    font-family: $font-primary;
    font-size: 14px;
    font-weight: $font-weight-semibold;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color $transition-fast;

    &--secondary {
      background: #f5f5f5;
      color: #414651;

      @include hover {
        background: #ebebeb;
      }
    }

    &--primary {
      background: $color-brand;
      color: white;

      @include hover {
        background: darken($color-brand, 8%);
      }
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// Modal transition
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;

  .mobile-add-to-cart-bar__modal {
    transition: transform 0.2s ease;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .mobile-add-to-cart-bar__modal {
    transform: scale(0.95);
  }
}
</style>
