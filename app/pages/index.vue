<script setup lang="ts">
const title = 'Studio Malek - Herramientas de Diseño'
const description = 'Herramientas de diseño fáciles de usar para crear posters únicos y memorables'

useHead({
  title,
})

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogUrl: 'https://creaciones.studiomalek.com',
  ogImage: 'https://creaciones.studiomalek.com/homepage-og.jpg',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  twitterTitle: title,
  twitterDescription: description,
  twitterImage: 'https://creaciones.studiomalek.com/homepage-og.jpg',
})

const tools = [
  {
    name: 'Personaliza',
    description: 'Crea cuadros únicos con tus fotos o diseños.',
    href: '/personaliza',
    available: true,
    image: '/landing/personaliza.jpg',
    buttonText: 'Sube tu imagen aquí',
  },
  {
    name: 'Momentos',
    description: 'Diseña un collage con tus fotos favoritas.',
    href: '/momentos',
    available: true,
    image: '/landing/momentos.png',
    buttonText: 'Empieza a diseñar',
  },
  {
    name: 'Póster de nacimiento',
    description: 'Celebra la llegada de tu bebé.',
    href: '/poster-de-nacimiento',
    available: true,
    image: '/landing/birth-poster.jpg',
    buttonText: 'Crea tu recuerdo',
  },
]
</script>

<template>
  <div class="home-page">
    <SharedTheHeader />

    <main class="home-page__main">
      <div class="home-page__container">
        <!-- Hero -->
        <section class="home-page__hero">
          <h1 class="home-page__title">
            ¿Que vas a diseñar hoy?
          </h1>
          <p class="home-page__subtitle">
            Con nuestras herramientas de diseño podrás crear cuadros personalizados 100% a tu estilo.
          </p>
        </section>

        <!-- Tools Grid -->
        <section class="home-page__tools">
          <div
            v-for="tool in tools"
            :key="tool.href"
            :class="[
              'tool-card',
              { 'tool-card--disabled': !tool.available }
            ]"
          >
            <div class="tool-card__image">
              <NuxtImg
                :src="tool.image"
                :alt="tool.name"
                width="400"
                height="300"
                loading="lazy"
              />
            </div>

            <div class="tool-card__content">
              <h2 class="tool-card__name">{{ tool.name }}</h2>
              <p class="tool-card__description">{{ tool.description }}</p>
            </div>

            <div class="tool-card__footer">
              <NuxtLink
                v-if="tool.available"
                :to="tool.href"
                class="tool-card__button"
              >
                {{ tool.buttonText }}
              </NuxtLink>
              <span v-else class="tool-card__coming-soon">
                Próximamente
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>

    <SharedCartSidebar />
  </div>
</template>

<style lang="scss" scoped>
.home-page {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, $color-bg-secondary 0%, $color-bg-primary 100%);

  &__main {
    flex: 1;
    display: flex;
    align-items: center;
    padding: $space-6xl $space-3xl;

    @include mobile {
      padding: $space-3xl $space-xl;
      align-items: flex-start;
    }
  }

  &__container {
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }

  &__hero {
    text-align: center;
    margin-bottom: $space-6xl;

    @include mobile {
      margin-bottom: $space-4xl;
    }
  }

  &__title {
    font-size: 48px;
    font-weight: $font-weight-bold;
    line-height: 1.1;
    margin-bottom: $space-xl;

    @include mobile {
      font-size: 32px;
    }
  }

  &__highlight {
    color: $color-brand;
  }

  &__subtitle {
    font-size: $font-size-lg;
    color: $color-text-secondary;
    max-width: 500px;
    margin: 0 auto;

    @include mobile {
      font-size: $font-size-base;
    }
  }

  &__tools {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $space-3xl;

    @include tablet {
      grid-template-columns: repeat(2, 1fr);
    }

    @include mobile {
      grid-template-columns: 1fr;
      gap: $space-xl;
    }
  }
}

.tool-card {
  background: $color-bg-primary;
  border: 1px solid $color-border;
  border-radius: $radius-2xl;
  padding: $space-3xl;
  display: flex;
  flex-direction: column;
  gap: $space-xl;
  transition: transform $transition-base, box-shadow $transition-base;

  @include hover {
    transform: translateY(-4px);
    box-shadow: $shadow-lg;
  }

  &--disabled {
    opacity: 0.7;

    @include hover {
      transform: none;
      box-shadow: none;
    }
  }

  &__image {
    width: 100%;
    aspect-ratio: 4 / 3;
    border-radius: $radius-xl;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .tool-card--disabled & {
      opacity: 0.5;
      filter: grayscale(1);
    }
  }

  &__content {
    flex: 1;
  }

  &__name {
    font-size: $font-size-xl;
    font-weight: $font-weight-semibold;
    margin-bottom: $space-md;
  }

  &__description {
    font-size: $font-size-sm;
    color: $color-text-secondary;
    line-height: $line-height-relaxed;
  }

  &__footer {
    margin-top: auto;
  }

  &__button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: $space-lg $space-2xl;
    background: $color-brand;
    color: $color-text-inverse;
    font-weight: $font-weight-semibold;
    border-radius: $radius-lg;
    transition: background-color $transition-fast;

    @include hover {
      background: $color-brand-hover;
    }
  }

  &__coming-soon {
    display: inline-flex;
    padding: $space-md $space-xl;
    background: $color-bg-tertiary;
    color: $color-text-muted;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    border-radius: $radius-lg;
  }
}
</style>
