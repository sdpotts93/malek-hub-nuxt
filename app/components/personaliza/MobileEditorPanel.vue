<script setup lang="ts">
import type { PersonalizaPanelType, PersonalizaSize, TextStyle } from '~/stores/personaliza'
import type { FrameStyle } from '~/types'

interface Props {
  activePanel: PersonalizaPanelType
}

defineProps<Props>()

const emit = defineEmits<{
  'change-image': []
}>()

const store = usePersonalizaStore()

const previewImage = computed(() => {
  return store.croppedImageUrl || store.imageUrl || store.imageS3Url
})

const availableSizes = computed(() => {
  return Object.entries(store.availableSizes).map(([key, data]) => ({
    id: key as PersonalizaSize,
    ...data,
  }))
})

function formatSizeLabel(sizeId: PersonalizaSize): string {
  const size = store.availableSizes[sizeId]
  if (!size) return ''
  return size.label.replace(/\s/g, '').replace(/cm/i, '').toUpperCase()
}

const textStyles: { id: TextStyle; label: string }[] = [
  { id: 'moderno', label: 'Moderno' },
  { id: 'clasico', label: 'Clasico' },
  { id: 'minimalista', label: 'Minimalista' },
]

const marginOptions = [
  { id: 'none', label: '🚫', color: null },
  { id: 'white', label: 'Blanco', color: '#ffffff' },
  { id: 'black', label: 'Negro', color: '#000000' },
  { id: 'beige', label: 'Beige', color: '#f8f6f2' },
]

const frameStyles: FrameStyle[] = [
  { id: 'frame-negro', name: 'Negro', image: '/frames/negro-thumbnail.webp', frameImage: '/frame-images/frame-black.webp', frameImageHorizontal: '/frame-images/frame-black-horizontal.webp', frameImageSquare: '/frame-images/frame-black-square.webp', price: 850 },
  { id: 'frame-blanco', name: 'Blanco', image: '/frames/blanco-thumbnail.webp', frameImage: '/frame-images/frame-white.webp', frameImageHorizontal: '/frame-images/frame-white-horizontal.webp', frameImageSquare: '/frame-images/frame-white-square.webp', price: 850 },
  { id: 'frame-roble', name: 'Roble', image: '/frames/roble-thumbnail.webp', frameImage: '/frame-images/frame-roble.webp', frameImageHorizontal: '/frame-images/frame-roble-horizontal.webp', frameImageSquare: '/frame-images/frame-roble-square.webp', price: 950 },
  { id: 'frame-nogal', name: 'Nogal', image: '/frames/nogal-thumbnail.webp', frameImage: '/frame-images/fame-nogal.webp', frameImageHorizontal: '/frame-images/frame-nogal-horizontal.webp', frameImageSquare: '/frame-images/frame-nogal-square.webp', price: 950 },
]

const frameOptions = computed(() => {
  return [
    { id: 'none', label: '🚫', frame: null as FrameStyle | null },
    ...frameStyles.map(frame => ({ id: frame.id, label: frame.name, frame })),
  ]
})

function handleMarginSelect(option: typeof marginOptions[number]) {
  if (option.color === null) {
    store.setHasMargin(false)
    return
  }
  store.setHasMargin(true)
  store.setMarginColor(option.color)
}

function isMarginActive(option: typeof marginOptions[number]) {
  if (option.color === null) {
    return !store.hasMargin
  }
  return store.hasMargin && store.marginColor === option.color
}
</script>

<template>
  <div class="mobile-panel">
    <div v-if="activePanel === 'archivo'" class="mobile-panel__section">
      <div class="mobile-panel__archivo">
        <div class="mobile-panel__thumb">
          <img v-if="previewImage" :src="previewImage" alt="" class="mobile-panel__thumb-image">
        </div>
        <button class="mobile-panel__button" type="button" @click="emit('change-image')">
          Cambiar imagen
        </button>
      </div>
    </div>

    <div v-else-if="activePanel === 'medidas'" class="mobile-panel__section">
      <div class="mobile-panel__segmented">
        <button
          v-for="size in availableSizes"
          :key="size.id"
          :class="['mobile-panel__segmented-btn', { 'mobile-panel__segmented-btn--active': store.posterSize === size.id }]"
          type="button"
          @click="store.setPosterSize(size.id)"
        >
          {{ formatSizeLabel(size.id) }}
        </button>
      </div>
    </div>

    <div v-else-if="activePanel === 'texto'" class="mobile-panel__section mobile-panel__section--stacked">
      <div class="mobile-panel__segmented">
        <button
          v-for="style in textStyles"
          :key="style.id"
          :class="[
            'mobile-panel__segmented-btn',
            `mobile-panel__segmented-btn--${style.id}`,
            { 'mobile-panel__segmented-btn--active': store.textStyle === style.id }
          ]"
          type="button"
          @click="store.setTextStyle(style.id)"
        >
          {{ style.label }}
        </button>
      </div>
      <div class="mobile-panel__inputs">
        <label class="mobile-panel__input">
          <span class="mobile-panel__input-label">Título</span>
          <input
            class="mobile-panel__input-field"
            type="text"
            :value="store.title"
            placeholder="Añade un título"
            maxlength="50"
            @input="store.setTitle(($event.target as HTMLInputElement).value)"
          >
        </label>
        <label class="mobile-panel__input">
          <span class="mobile-panel__input-label">Subtítulo</span>
          <input
            class="mobile-panel__input-field"
            type="text"
            :value="store.subtitle"
            placeholder="Subtítulo"
            maxlength="100"
            @input="store.setSubtitle(($event.target as HTMLInputElement).value)"
          >
        </label>
      </div>
    </div>

    <div v-else-if="activePanel === 'margen'" class="mobile-panel__section">
      <div class="mobile-panel__segmented">
        <button
          v-for="option in marginOptions"
          :key="option.id"
          :class="['mobile-panel__segmented-btn', { 'mobile-panel__segmented-btn--active': isMarginActive(option) }]"
          type="button"
          @click="handleMarginSelect(option)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <div v-else-if="activePanel === 'marco'" class="mobile-panel__section">
      <div class="mobile-panel__segmented">
        <button
          v-for="option in frameOptions"
          :key="option.id"
          :class="['mobile-panel__segmented-btn', { 'mobile-panel__segmented-btn--active': store.frameStyle?.id === option.id || (!store.frameStyle && option.id === 'none') }]"
          type="button"
          @click="store.setFrameStyle(option.frame)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.mobile-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__section {
    display: flex;
    flex-direction: column;
    gap: 12px;

    &--stacked {
      gap: 16px;
    }
  }

  &__archivo {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 16px;
  }

  &__thumb {
    width: 48px;
    height: 66px;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
  }

  &__thumb-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__button {
    @include button-reset;
    padding: 10px 16px;
    background: #ffffff;
    border: 1px solid #d5d7da;
    border-radius: 8px;
    font-family: $font-primary;
    font-size: 14px;
    font-weight: $font-weight-semibold;
    color: #414651;
    box-shadow: 0 1px 2px rgba(10, 13, 18, 0.05);
  }

  &__segmented {
    display: flex;
    align-items: center;
    background: #f5f5f5;
    border-radius: 8px;
    overflow: hidden;
    gap: 0;
  }

  &__segmented-btn {
    @include button-reset;
    flex: 1;
    min-height: 40px;
    padding: 10px 12px;
    font-family: $font-primary;
    font-size: 15px;
    font-weight: $font-weight-bold;
    color: #181d27;
    text-align: center;
    position: relative;

    &--active {
      background: #ffffff;
      border: 1px solid #d5d7da;
      box-shadow: 0 0 12px rgba(0, 0, 0, 0.08);
      z-index: 1;
      border-radius: 8px;
    }

    &--clasico {
      font-family: 'Averia Serif Libre', serif;
    }

    &--minimalista {
      font-family: 'Avenir', sans-serif;
      font-weight: $font-weight-normal;
    }
  }

  &__inputs {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  &__input {
    display: flex;
    flex-direction: column;
    gap: 6px;
    position: relative;
  }

  &__input-label {
    font-family: $font-primary;
    font-size: 9px;
    font-weight: $font-weight-medium;
    color: #2f3038;
    position: absolute;
    background: white;
    left: 10px;
    top: -5px;
    padding-inline: 4px;
    text-transform: uppercase;
  }

  &__input-field {
    width: 100%;
    border: 1px solid #d5d7da;
    border-radius: 8px;
    padding: 10px 12px;
    font-family: $font-primary;
    font-size: 16px;
    color: #2f3038;
    background: #ffffff;
    box-shadow: 0 1px 2px rgba(10, 13, 18, 0.05);

    &::placeholder {
      color: #717680;
    }
  }
}
</style>
