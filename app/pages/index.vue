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
  ogUrl: 'https://hub.studiomalek.com',
  ogImage: '/og-image.jpg',
})

const tools = [
  {
    name: 'Birth Poster',
    description: 'Crea un poster personalizado para celebrar el nacimiento de tu bebé',
    href: '/birth-poster',
    available: true,
    icon: 'baby',
  },
  {
    name: 'Personaliza',
    description: 'Diseña posters personalizados con tus propias fotos y textos',
    href: '/personaliza',
    available: true,
    icon: 'palette',
  },
  {
    name: 'Momentos',
    description: 'Captura tus momentos más especiales en diseños únicos',
    href: '/moments',
    available: false,
    icon: 'image',
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
            Crea diseños <span class="home-page__highlight">personalizados</span>
          </h1>
          <p class="home-page__subtitle">
            Herramientas de diseño fáciles de usar para crear posters únicos y memorables
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
            <div class="tool-card__icon">
              <svg v-if="tool.icon === 'baby'" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 12h.01"/>
                <path d="M15 12h.01"/>
                <path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/>
                <path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1"/>
              </svg>
              <svg v-else-if="tool.icon === 'palette'" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="13.5" cy="6.5" r=".5"/>
                <circle cx="17.5" cy="10.5" r=".5"/>
                <circle cx="8.5" cy="7.5" r=".5"/>
                <circle cx="6.5" cy="12.5" r=".5"/>
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.75 1.5-1.5 0-.37-.13-.71-.37-.96A.7.7 0 0 1 13 19c0-.37.13-.71.37-.96.24-.25.57-.37.93-.37h2.2A6.5 6.5 0 0 0 22 12c0-5.5-4.5-10-10-10Z"/>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                <circle cx="9" cy="9" r="2"/>
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
              </svg>
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
                Comenzar
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

  &__icon {
    width: 64px;
    height: 64px;
    background: $color-brand-light;
    border-radius: $radius-xl;
    @include flex-center;
    color: $color-brand;

    .tool-card--disabled & {
      background: $color-bg-tertiary;
      color: $color-text-muted;
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
