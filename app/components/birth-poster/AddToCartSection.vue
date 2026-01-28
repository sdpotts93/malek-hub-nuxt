<script setup lang="ts">
interface Props {
  price: number
  compareAtPrice: number | null
  isLoading?: boolean
  compact?: boolean
  missingElements?: string[]
  canProceed?: boolean // If false, only shows "Volver a editar" in modal (no "Continuar" option)
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  compact: false,
  missingElements: () => [],
  canProceed: true,
})

const emit = defineEmits<{
  'add-to-cart': []
  'edit': []
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

// Cancel and close modal - emit edit event to navigate to datos panel
function handleCancel() {
  showWarningModal.value = false
  emit('edit')
}
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
        @click="handleAddToCartClick"
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
          <span>Envío Gratis a partir de $1,000 MXN</span>
        </div>

        <div class="add-to-cart__reviews">
          <div class="add-to-cart__stars">
            <svg v-for="i in 5" :key="i" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <span class="add-to-cart__review-text">
            <span class="add-to-cart__review-prefix">Más de</span>
            <span class="add-to-cart__review-count">6,000 reseñas</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Warning Modal for Missing Elements -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showWarningModal"
          class="add-to-cart__modal-overlay"
          @click="handleCancel"
        >
          <div class="add-to-cart__modal" @click.stop>
            <div class="add-to-cart__modal-icon add-to-cart__modal-icon--warning">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <path d="M12 9v4"/>
                <path d="M12 17h.01"/>
              </svg>
            </div>
            <h3 class="add-to-cart__modal-title">Elementos faltantes</h3>
            <p class="add-to-cart__modal-text">
              Tu diseño tiene los siguientes elementos pendientes:
            </p>
            <ul class="add-to-cart__modal-list">
              <li v-for="(element, index) in missingElements" :key="index">
                {{ element }}
              </li>
            </ul>
            <p v-if="canProceed" class="add-to-cart__modal-question">
              ¿Deseas continuar de todas formas?
            </p>
            <div :class="['add-to-cart__modal-actions', { 'add-to-cart__modal-actions--single': !canProceed }]">
              <button
                class="add-to-cart__modal-btn add-to-cart__modal-btn--secondary"
                @click="handleCancel"
              >
                Volver a editar
              </button>
              <button
                v-if="canProceed"
                class="add-to-cart__modal-btn add-to-cart__modal-btn--primary"
                @click="handleProceedAnyway"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
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
    background: #252b37;
    border: 2px solid rgba(255, 255, 255, 0.12);
    color: #ffffff;
    font-family: $font-primary;
    font-size: 18px;
    font-weight: $font-weight-semibold;
    line-height: 28px;
    border-radius: 10px;
    overflow: hidden;
    transition: background-color $transition-fast, opacity $transition-fast;
    box-shadow: 0px 1px 2px 0px rgba(10, 13, 18, 0.05);

    // Skeuomorphic inner shadows
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      border-radius: 10px;
      box-shadow:
        inset 0px 0px 0px 1px rgba(10, 13, 18, 0.18),
        inset 0px -2px 0px 0px rgba(10, 13, 18, 0.05);
    }

    .add-to-cart--compact & {
      padding: 12px 16px;
      font-size: 16px;
      line-height: 24px;
    }

    @include hover {
      background: #1a1f28;
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
      color: $color-yellow;
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

    &--warning {
      background: #fef3c7;
      color: #d97706;
    }
  }

  &__modal-title {
    font-family: $font-primary;
    font-size: 18px;
    font-weight: $font-weight-semibold;
    color: #181d27;
    margin: 0 0 24px;
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
      .add-to-cart__modal-btn {
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

  .add-to-cart__modal {
    transition: transform 0.2s ease;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .add-to-cart__modal {
    transform: scale(0.95);
  }
}
</style>
