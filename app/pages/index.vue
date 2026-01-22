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
    name: 'Personaliza',
    description: 'Crea cuadros únicos con tus fotos o diseños.',
    href: '/personaliza',
    available: true,
    icon: 'palette',
    buttonText: 'Sube tu imagen aquí',
  },
  {
    name: 'Momentos',
    description: 'Diseña un collage con tus fotos favoritas.',
    href: '/momentos',
    available: true,
    icon: 'image',
    buttonText: 'Empieza a diseñar',
  },
  {
    name: 'Póster de nacimiento',
    description: 'Celebra la llegada de tu bebé.',
    href: '/birth-poster',
    available: true,
    icon: 'baby',
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
            <div class="tool-card__icon">
              <svg v-if="tool.icon === 'baby'" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 14 18" fill="currentColor">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M3.07684 10.7247C3.19371 11.7304 3.36051 12.4898 3.72329 13.3852C4.08594 14.2803 4.8858 15.4771 5.86157 16.1892C6.83733 16.9012 8.42889 17.5661 9.50479 17.4947C10.5807 17.4236 11.0602 17.026 11.5551 16.5225C12.0498 16.0189 13.1621 14.4862 13.5497 13.0549C13.9377 11.6239 13.6957 11.1217 13.3835 10.7064C13.0716 10.2911 12.3677 10.0092 11.4071 10.0826C10.4464 10.156 9.40867 10.752 9.34964 11.2445C9.25834 12.0058 10.676 12.1109 10.4464 12.7796C10.3542 13.0489 10.0105 13.2658 9.09837 13.2383C8.18619 13.211 7.18766 12.7679 6.95554 12.0641C6.72341 11.3603 6.82488 10.7137 7.31779 10.3724C9.39957 8.93126 10.0942 7.74411 10.2308 7.20426C10.3673 6.6644 10.1536 6.03147 9.61349 5.54627C8.45366 4.50432 6.12127 4.96998 4.99022 5.77152C3.31151 6.96146 2.85141 8.78553 3.07684 10.7247ZM5.81565 0.885972C5.62141 1.32397 5.36545 2.23867 5.62368 2.99313C5.88205 3.7476 6.85942 4.60179 7.93438 4.40247C9.00921 4.20302 8.97628 2.52535 8.76557 1.79747C8.57494 1.13941 7.61564 0.0565121 6.9455 0.00385636C6.27535 -0.0487993 6.01003 0.447707 5.81565 0.885972ZM2.65931 3.47408C3.28862 4.39489 4.27282 4.53876 4.77242 4.36856C5.27201 4.19823 5.05608 2.80751 4.75515 2.16872C4.37911 1.37091 3.50241 1.29764 2.99224 1.5576C2.48206 1.81729 2.03013 2.55327 2.65931 3.47408ZM1.04352 4.13254C0.378461 4.36218 0.570562 5.7396 0.955433 6.28677C1.34017 6.83394 2.49063 7.13724 2.934 6.64366C3.37751 6.15008 2.8253 5.17396 2.55877 4.85815C2.29224 4.54209 1.70858 3.9029 1.04352 4.13254ZM0.0557052 7.57617C0.244325 7.14575 1.11286 7.1887 1.7644 7.56341C2.58555 8.03585 2.61888 9.221 2.13481 9.41434C1.74338 9.57071 1.04968 9.46952 0.616479 9.12632C0.183281 8.78313 -0.132915 8.00646 0.0557052 7.57617Z"/>
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
