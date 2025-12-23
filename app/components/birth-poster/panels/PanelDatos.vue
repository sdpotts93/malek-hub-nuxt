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
  gap: 20px;
  padding-inline: 20px;


  &__title {
    font-family: $font-primary;
    font-size: 16px;
    font-weight: $font-weight-semibold;
    line-height: 24px;
    color: #2f3038;
    margin: 0;
  }

  &__tabs {
    margin-bottom: 8px;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__label {
    font-family: $font-primary;
    font-size: 14px;
    font-weight: $font-weight-medium;
    color: #414651;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__required {
    color: #ef4444;
  }

  &__optional {
    font-weight: $font-weight-normal;
    color: #717680;
    font-size: 12px;
  }

  &__input {
    @include input-reset;
    width: 100%;
    padding: 10px 14px;
    background: #ffffff;
    border: 1px solid #d5d7da;
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(10, 13, 18, 0.05);
    font-family: $font-primary;
    font-size: 16px;
    color: #2f3038;
    transition: border-color $transition-fast, box-shadow $transition-fast;

    &::placeholder {
      color: #717680;
    }

    &:focus {
      border-color: #db6800;
      box-shadow: 0 1px 2px rgba(10, 13, 18, 0.05), 0 0 0 3px rgba(219, 104, 0, 0.1);
    }
  }

  &__input-group {
    position: relative;
    display: flex;
    align-items: center;

    .panel-datos__input {
      padding-right: 48px;
    }
  }

  &__unit {
    position: absolute;
    right: 14px;
    color: #717680;
    font-family: $font-primary;
    font-size: 16px;
    pointer-events: none;
  }
}
</style>
