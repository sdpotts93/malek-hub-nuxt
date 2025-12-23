<script setup lang="ts">
const store = useBirthPosterStore()

// Format date for input
const dateValue = computed({
  get() {
    const date = store.currentBaby.fechaNacimiento
    if (!date) return ''
    return new Date(date).toISOString().split('T')[0]
  },
  set(value: string) {
    store.setBabyFechaNacimiento(value ? new Date(value) : null)
  },
})
</script>

<template>
  <div class="panel-datos">
    <h3 class="panel-datos__title">Datos del bebé</h3>

    <!-- Baby Tabs (if multiple babies) -->
    <BirthPosterBabyTabs v-if="store.babyCount > 1" class="panel-datos__tabs" />

    <!-- Nombre -->
    <div class="panel-datos__field">
      <label class="panel-datos__label" for="nombre">
        Nombre
        <span class="panel-datos__required">*</span>
      </label>
      <input
        id="nombre"
        type="text"
        class="panel-datos__input"
        :value="store.currentBaby.nombre"
        placeholder="Nombre del bebé"
        @input="store.setBabyNombre(($event.target as HTMLInputElement).value)"
      >
    </div>

    <!-- Altura -->
    <div class="panel-datos__field">
      <label class="panel-datos__label" for="altura">
        Altura (cm)
        <span class="panel-datos__required">*</span>
      </label>
      <div class="panel-datos__input-group">
        <input
          id="altura"
          type="number"
          class="panel-datos__input"
          :value="store.currentBaby.altura"
          min="30"
          max="70"
          step="0.5"
          @input="store.setBabyAltura(Number(($event.target as HTMLInputElement).value))"
        >
        <span class="panel-datos__unit">cm</span>
      </div>
    </div>

    <!-- Peso (optional) -->
    <div class="panel-datos__field">
      <label class="panel-datos__label" for="peso">
        Peso (gramos)
        <span class="panel-datos__optional">(opcional)</span>
      </label>
      <div class="panel-datos__input-group">
        <input
          id="peso"
          type="number"
          class="panel-datos__input"
          :value="store.currentBaby.peso ?? ''"
          min="500"
          max="6000"
          step="10"
          placeholder="ej. 3400"
          @input="store.setBabyPeso(($event.target as HTMLInputElement).value ? Number(($event.target as HTMLInputElement).value) : null)"
        >
        <span class="panel-datos__unit">g</span>
      </div>
    </div>

    <!-- Fecha de nacimiento (optional) -->
    <div class="panel-datos__field">
      <label class="panel-datos__label" for="fecha">
        Fecha de nacimiento
        <span class="panel-datos__optional">(opcional)</span>
      </label>
      <input
        id="fecha"
        type="date"
        class="panel-datos__input"
        v-model="dateValue"
      >
    </div>

    <!-- Lugar de nacimiento (optional) -->
    <div class="panel-datos__field">
      <label class="panel-datos__label" for="lugar">
        Lugar de nacimiento
        <span class="panel-datos__optional">(opcional)</span>
      </label>
      <input
        id="lugar"
        type="text"
        class="panel-datos__input"
        :value="store.currentBaby.lugarNacimiento ?? ''"
        placeholder="ej. Ciudad de México"
        @input="store.setBabyLugarNacimiento(($event.target as HTMLInputElement).value || null)"
      >
    </div>
  </div>
</template>

<style lang="scss" scoped>
.panel-datos {
  display: flex;
  flex-direction: column;
  gap: $space-3xl;

  &__title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
  }

  &__tabs {
    margin-bottom: $space-lg;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: $space-md;
  }

  &__label {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-text-secondary;
    display: flex;
    align-items: center;
    gap: $space-xs;
  }

  &__required {
    color: $color-error;
  }

  &__optional {
    font-weight: $font-weight-normal;
    color: $color-text-muted;
    font-size: $font-size-xs;
  }

  &__input {
    @include input-reset;
    width: 100%;
    padding: $space-lg;
    background: $color-bg-secondary;
    border: 1px solid $color-border;
    border-radius: $radius-lg;
    font-size: $font-size-base;
    transition: border-color $transition-fast, box-shadow $transition-fast;

    &::placeholder {
      color: $color-text-muted;
    }

    &:focus {
      border-color: $color-brand;
      box-shadow: 0 0 0 3px rgba($color-brand, 0.1);
    }
  }

  &__input-group {
    position: relative;
    display: flex;
    align-items: center;

    .panel-datos__input {
      padding-right: $space-4xl;
    }
  }

  &__unit {
    position: absolute;
    right: $space-lg;
    color: $color-text-muted;
    font-size: $font-size-sm;
    pointer-events: none;
  }
}
</style>
