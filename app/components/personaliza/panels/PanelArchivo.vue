<script setup lang="ts">
import { Cropper, RectangleStencil } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import type { ImageFormat } from '~/stores/personaliza'

const store = usePersonalizaStore()

// File input ref
const fileInput = ref<HTMLInputElement | null>(null)
const cropperRef = ref<any>(null)

// Drag state
const isDragging = ref(false)

// Format options
const formatOptions: { id: ImageFormat; label: string; aspectRatio: number }[] = [
  { id: '1:1', label: 'Cuadrado', aspectRatio: 1 },
  { id: '4:3', label: 'Horizontal', aspectRatio: 4 / 3 },
  { id: '3:4', label: 'Vertical', aspectRatio: 3 / 4 },
]

// Accepted file types
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// Handle file selection
function handleFileSelect() {
  fileInput.value?.click()
}

function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) processFile(file)
}

// Drag and drop handlers
function onDragOver(e: DragEvent) {
  e.preventDefault()
  isDragging.value = true
}

function onDragLeave() {
  isDragging.value = false
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) processFile(file)
}

// Process uploaded file
function processFile(file: File) {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    alert('Solo se aceptan imagenes JPG, PNG o WEBP')
    return
  }

  store.setImage(file)
}

// Change image
function handleChangeImage() {
  store.clearImage()
  nextTick(() => {
    fileInput.value?.click()
  })
}

// Format selection
function selectFormat(format: ImageFormat) {
  store.setImageFormat(format)
  nextTick(() => {
    resizeStencil()
  })
}

// Zoom controls
function handleZoomIn() {
  if (cropperRef.value) {
    cropperRef.value.zoom(1.25)
  }
}

function handleZoomOut() {
  if (cropperRef.value) {
    cropperRef.value.zoom(0.8)
  }
}

// Handle zoom slider
function handleZoomSlider(e: Event) {
  const input = e.target as HTMLInputElement
  store.setZoomLevel(Number(input.value))
  // Apply zoom based on slider value
  if (cropperRef.value) {
    // Normalize zoom: 0 = 1x, 100 = 3x
    const zoomLevel = 1 + (Number(input.value) / 100) * 2
    cropperRef.value.setCoordinates((state: any) => {
      const { imageSize } = state
      const newWidth = imageSize.width / zoomLevel
      const newHeight = newWidth / store.aspectRatio
      return {
        width: newWidth,
        height: newHeight,
        left: (imageSize.width - newWidth) / 2,
        top: (imageSize.height - newHeight) / 2,
      }
    })
  }
}

// Resize stencil when format changes
async function resizeStencil() {
  const cropper = cropperRef.value
  if (!cropper) return

  cropper.reset()
  await new Promise(resolve => setTimeout(resolve, 100))

  cropper.setCoordinates(({ imageSize }: any) => {
    let width = imageSize.width
    let height = width / store.aspectRatio

    if (height > imageSize.height) {
      height = imageSize.height
      width = height * store.aspectRatio
    }

    return {
      left: (imageSize.width - width) / 2,
      top: (imageSize.height - height) / 2,
      width,
      height,
    }
  })
}

// Handle crop change to generate preview
function handleCropChange() {
  if (!cropperRef.value) return

  const { canvas } = cropperRef.value.getResult()
  if (!canvas) return

  canvas.toBlob((blob: Blob | null) => {
    if (blob) {
      store.setCroppedImage(blob)
    }
  }, 'image/jpeg', 0.95)
}

// Acknowledge size warning
function acknowledgeWarning() {
  store.acknowledgeSizeWarning()
}
</script>

<template>
  <div class="panel-archivo">
    <div class="panel-archivo__section">
      <h3 class="panel-archivo__title">
        <svg class="panel-archivo__title-icon" width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6.75 8.66667C7.80855 8.66667 8.66667 7.80855 8.66667 6.75C8.66667 5.69145 7.80855 4.83333 6.75 4.83333C5.69145 4.83333 4.83333 5.69145 4.83333 6.75C4.83333 7.80855 5.69145 8.66667 6.75 8.66667Z"/>
          <path class="panel-archivo__title-icon-fill" d="M1 5.6C1 3.98985 1 3.18477 1.31336 2.56978C1.58899 2.02881 2.02881 1.58899 2.56978 1.31336C3.18477 1 3.98985 1 5.6 1H15.5667C17.1768 1 17.9819 1 18.5969 1.31336C19.1379 1.58899 19.5777 2.02881 19.8533 2.56978C20.1667 3.18477 20.1667 3.98985 20.1667 5.6V13.65C20.1667 15.2602 20.1667 16.0652 19.8533 16.6802C19.5777 17.2212 19.1379 17.661 18.5969 17.9366C17.9819 18.25 17.1768 18.25 15.5667 18.25H5.6C3.98985 18.25 3.18477 18.25 2.56978 17.9366C2.02881 17.661 1.58899 17.2212 1.31336 16.6802C1 16.0652 1 15.2602 1 13.65V5.6Z"/>
          <path d="M3.17742 17.9892L9.4991 11.6676C9.87862 11.288 10.0684 11.0983 10.2872 11.0272C10.4797 10.9647 10.687 10.9647 10.8795 11.0272C11.0983 11.0983 11.2881 11.2881 11.6676 11.6676L17.9471 17.9471M12.5 12.5L15.2491 9.7509C15.6286 9.37138 15.8184 9.18162 16.0372 9.11053C16.2297 9.04799 16.437 9.04799 16.6295 9.11053C16.8483 9.18162 17.038 9.37138 17.4176 9.7509L20.1667 12.5M8.66667 6.75C8.66667 7.80855 7.80855 8.66667 6.75 8.66667C5.69145 8.66667 4.83333 7.80855 4.83333 6.75C4.83333 5.69145 5.69145 4.83333 6.75 4.83333C7.80855 4.83333 8.66667 5.69145 8.66667 6.75ZM5.6 18.25H15.5667C17.1768 18.25 17.9819 18.25 18.5969 17.9366C19.1379 17.661 19.5777 17.2212 19.8533 16.6802C20.1667 16.0652 20.1667 15.2602 20.1667 13.65V5.6C20.1667 3.98985 20.1667 3.18477 19.8533 2.56978C19.5777 2.02881 19.1379 1.58899 18.5969 1.31336C17.9819 1 17.1768 1 15.5667 1H5.6C3.98985 1 3.18477 1 2.56978 1.31336C2.02881 1.58899 1.58899 2.02881 1.31336 2.56978C1 3.18477 1 3.98985 1 5.6V13.65C1 15.2602 1 16.0652 1.31336 16.6802C1.58899 17.2212 2.02881 17.661 2.56978 17.9366C3.18477 18.25 3.98985 18.25 5.6 18.25Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Sube tu imagen
      </h3>
      <p class="panel-archivo__description">
        Arrastra tu imagen o haz clic para seleccionar
      </p>
    </div>

    <!-- Upload zone (when no image) -->
    <div
      v-if="!store.hasImage"
      class="panel-archivo__upload-zone"
      :class="{ 'panel-archivo__upload-zone--dragging': isDragging }"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
      @click="handleFileSelect"
    >
      <div class="panel-archivo__upload-icon">
        <svg width="32" height="29" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6.75 8.66667C7.80855 8.66667 8.66667 7.80855 8.66667 6.75C8.66667 5.69145 7.80855 4.83333 6.75 4.83333C5.69145 4.83333 4.83333 5.69145 4.83333 6.75C4.83333 7.80855 5.69145 8.66667 6.75 8.66667Z"/>
          <path class="panel-archivo__upload-icon-fill" d="M1 5.6C1 3.98985 1 3.18477 1.31336 2.56978C1.58899 2.02881 2.02881 1.58899 2.56978 1.31336C3.18477 1 3.98985 1 5.6 1H15.5667C17.1768 1 17.9819 1 18.5969 1.31336C19.1379 1.58899 19.5777 2.02881 19.8533 2.56978C20.1667 3.18477 20.1667 3.98985 20.1667 5.6V13.65C20.1667 15.2602 20.1667 16.0652 19.8533 16.6802C19.5777 17.2212 19.1379 17.661 18.5969 17.9366C17.9819 18.25 17.1768 18.25 15.5667 18.25H5.6C3.98985 18.25 3.18477 18.25 2.56978 17.9366C2.02881 17.661 1.58899 17.2212 1.31336 16.6802C1 16.0652 1 15.2602 1 13.65V5.6Z"/>
          <path d="M3.17742 17.9892L9.4991 11.6676C9.87862 11.288 10.0684 11.0983 10.2872 11.0272C10.4797 10.9647 10.687 10.9647 10.8795 11.0272C11.0983 11.0983 11.2881 11.2881 11.6676 11.6676L17.9471 17.9471M12.5 12.5L15.2491 9.7509C15.6286 9.37138 15.8184 9.18162 16.0372 9.11053C16.2297 9.04799 16.437 9.04799 16.6295 9.11053C16.8483 9.18162 17.038 9.37138 17.4176 9.7509L20.1667 12.5M8.66667 6.75C8.66667 7.80855 7.80855 8.66667 6.75 8.66667C5.69145 8.66667 4.83333 7.80855 4.83333 6.75C4.83333 5.69145 5.69145 4.83333 6.75 4.83333C7.80855 4.83333 8.66667 5.69145 8.66667 6.75ZM5.6 18.25H15.5667C17.1768 18.25 17.9819 18.25 18.5969 17.9366C19.1379 17.661 19.5777 17.2212 19.8533 16.6802C20.1667 16.0652 20.1667 15.2602 20.1667 13.65V5.6C20.1667 3.98985 20.1667 3.18477 19.8533 2.56978C19.5777 2.02881 19.1379 1.58899 18.5969 1.31336C17.9819 1 17.1768 1 15.5667 1H5.6C3.98985 1 3.18477 1 2.56978 1.31336C2.02881 1.58899 1.58899 2.02881 1.31336 2.56978C1 3.18477 1 3.98985 1 5.6V13.65C1 15.2602 1 16.0652 1.31336 16.6802C1.58899 17.2212 2.02881 17.661 2.56978 17.9366C3.18477 18.25 3.98985 18.25 5.6 18.25Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <p class="panel-archivo__upload-text">
        <span class="panel-archivo__upload-link">Clic para subir</span>
        o arrastra y suelta
      </p>
      <p class="panel-archivo__upload-hint">PNG, JPG o WEBP</p>
    </div>

    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      class="panel-archivo__file-input"
      @change="handleFileChange"
    >

    <!-- Image uploaded state -->
    <template v-if="store.hasImage">
      <!-- Format selector -->
      <div class="panel-archivo__section">
        <label class="panel-archivo__label">Formato</label>
        <div class="panel-archivo__formats">
          <button
            v-for="format in formatOptions"
            :key="format.id"
            :class="[
              'panel-archivo__format-btn',
              { 'panel-archivo__format-btn--active': store.imageFormat === format.id }
            ]"
            @click="selectFormat(format.id)"
          >
            {{ format.label }}
          </button>
        </div>
      </div>

      <!-- Cropper -->
      <div class="panel-archivo__cropper-section">
        <div class="panel-archivo__cropper-container">
          <Cropper
            ref="cropperRef"
            :src="store.imageUrl!"
            :stencil-component="RectangleStencil"
            :stencil-props="{
              handlers: {},
              aspectRatio: store.aspectRatio,
              resizable: false,
              movable: false
            }"
            :image-restriction="'stencil'"
            :resize-image="{
              adjustStencil: false
            }"
            @ready="resizeStencil"
            @change="handleCropChange"
          />
        </div>

        <!-- Zoom controls -->
        <div class="panel-archivo__zoom">
          <button
            class="panel-archivo__zoom-btn"
            aria-label="Alejar"
            @click="handleZoomOut"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.3-4.3"/>
              <path d="M8 11h6"/>
            </svg>
          </button>
          <input
            type="range"
            min="0"
            max="100"
            :value="store.zoomLevel"
            class="panel-archivo__zoom-slider"
            @input="handleZoomSlider"
          >
          <button
            class="panel-archivo__zoom-btn"
            aria-label="Acercar"
            @click="handleZoomIn"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.3-4.3"/>
              <path d="M11 8v6"/>
              <path d="M8 11h6"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Change image button -->
      <div class="panel-archivo__change-section">
        <button
          class="panel-archivo__change-btn"
          @click="handleChangeImage"
        >
          Cambiar imagen
        </button>
      </div>

      <!-- Size warning -->
      <div
        v-if="store.showSizeWarning"
        class="panel-archivo__warning"
      >
        <div class="panel-archivo__warning-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/>
            <path d="M12 9v4"/>
            <path d="M12 17h.01"/>
          </svg>
        </div>
        <div class="panel-archivo__warning-content">
          <p class="panel-archivo__warning-title">Resolucion baja</p>
          <p class="panel-archivo__warning-text">
            Tu imagen tiene una resolucion menor a la recomendada para el tamano seleccionado.
            El resultado podria verse pixelado.
          </p>
          <label class="panel-archivo__warning-checkbox">
            <input
              type="checkbox"
              :checked="store.sizeWarningAcknowledged"
              @change="acknowledgeWarning"
            >
            <span>Entiendo y quiero continuar</span>
          </label>
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.panel-archivo {
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

  &__title-icon-fill {
    fill: #FFCBA3;
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

  // Upload zone
  &__upload-zone {
    margin-inline: 20px;
    padding: 32px 20px;
    background: #fafafa;
    border: 2px dashed #e9eaeb;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: border-color $transition-fast, background-color $transition-fast;

    &:hover,
    &--dragging {
      border-color: $color-brand;
      background: #fff8f2;
    }
  }

  &__upload-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #717680;

    .panel-archivo__upload-zone:hover &,
    .panel-archivo__upload-zone--dragging & {
      color: $color-brand;
    }
  }

  &__upload-icon-fill {
    fill: #e5e7eb;

    .panel-archivo__upload-zone:hover &,
    .panel-archivo__upload-zone--dragging & {
      fill: #FFCBA3;
    }
  }

  &__upload-text {
    font-family: $font-primary;
    font-size: 14px;
    color: #535861;
    margin: 0;
    text-align: center;
  }

  &__upload-link {
    color: $color-brand;
    font-weight: $font-weight-semibold;
  }

  &__upload-hint {
    font-family: $font-primary;
    font-size: 12px;
    color: #717680;
    margin: 0;
  }

  &__file-input {
    display: none;
  }

  // Format selector
  &__formats {
    display: flex;
    border-radius: 8px;
    overflow: hidden;
  }

  &__format-btn {
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

      &.panel-archivo__format-btn--active {
        background: #fff0e5;
      }
    }
  }

  // Cropper
  &__cropper-section {
    padding-inline: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__cropper-container {
    width: 100%;
    aspect-ratio: 1;
    max-height: 300px;
    border-radius: 8px;
    overflow: hidden;
    background: #1a1a1a;
  }

  // Zoom controls
  &__zoom {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__zoom-btn {
    @include button-reset;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #414651;
    transition: background-color $transition-fast;

    @include hover {
      background: #ebebeb;
    }
  }

  &__zoom-slider {
    flex: 1;
    height: 4px;
    appearance: none;
    background: #e9eaeb;
    border-radius: 2px;
    cursor: pointer;

    &::-webkit-slider-thumb {
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: $color-brand;
      cursor: pointer;
    }

    &::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: $color-brand;
      cursor: pointer;
      border: none;
    }
  }

  // Change image button
  &__change-section {
    padding-inline: 20px;
  }

  &__change-btn {
    @include button-reset;
    width: 100%;
    padding: 12px 16px;
    font-family: $font-primary;
    font-size: 14px;
    font-weight: $font-weight-semibold;
    color: $color-brand;
    background: transparent;
    border: 1px solid $color-brand;
    border-radius: 8px;
    transition: background-color $transition-fast;

    @include hover {
      background: #fff8f2;
    }
  }

  // Size warning
  &__warning {
    margin-inline: 20px;
    padding: 16px;
    background: #fef3cd;
    border: 1px solid #f0ad4e;
    border-radius: 8px;
    display: flex;
    gap: 12px;
  }

  &__warning-icon {
    flex-shrink: 0;
    color: #856404;
  }

  &__warning-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__warning-title {
    font-family: $font-primary;
    font-size: 14px;
    font-weight: $font-weight-semibold;
    color: #856404;
    margin: 0;
  }

  &__warning-text {
    font-family: $font-primary;
    font-size: 13px;
    color: #856404;
    margin: 0;
    line-height: 1.4;
  }

  &__warning-checkbox {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: $font-primary;
    font-size: 13px;
    color: #856404;
    cursor: pointer;

    input {
      width: 16px;
      height: 16px;
      cursor: pointer;
    }
  }
}

// Cropper overrides
:deep(.vue-advanced-cropper__background) {
  background-color: #1a1a1a;
}

:deep(.vue-rectangle-stencil) {
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border: 2px dashed rgba(255, 255, 255, 0.6);
    pointer-events: none;
  }
}
</style>
