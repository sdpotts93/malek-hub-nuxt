<script setup lang="ts">
const store = useBirthPosterStore()
</script>

<template>
  <div class="baby-tabs">
    <button
      v-for="i in store.babyCount"
      :key="i"
      :class="[
        'baby-tabs__tab',
        { 'baby-tabs__tab--active': store.activeBabyTab === i - 1 }
      ]"
      @click="store.setActiveBabyTab(i - 1)"
    >
      Bebé {{ i }}
    </button>
  </div>
</template>

<style lang="scss" scoped>
.baby-tabs {
  display: flex;
  gap: $space-md;
  padding: $space-md;
  background: $color-bg-secondary;
  border-radius: $radius-lg;

  &__tab {
    @include button-reset;
    flex: 1;
    padding: $space-md $space-lg;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-text-secondary;
    border-radius: $radius-md;
    transition: background-color $transition-fast, color $transition-fast;

    @include hover {
      background: $color-bg-tertiary;
      color: $color-text-primary;
    }

    &--active {
      background: $color-bg-primary;
      color: $color-brand;
      box-shadow: $shadow-sm;

      @include hover {
        background: $color-bg-primary;
        color: $color-brand;
      }
    }
  }
}
</style>
