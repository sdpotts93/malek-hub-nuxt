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
  border-radius: 8px;
  overflow: hidden;

  &__tab {
    @include button-reset;
    flex: 1;
    min-height: 40px;
    padding: 10px 16px;
    font-family: $font-primary;
    font-size: 16px;
    font-weight: $font-weight-bold;
    background: #f5f5f5;
    color: #414651;
    border-right: 1px solid #e9eaeb;
    transition: background-color $transition-fast, color $transition-fast;

    &:last-child {
      border-right: none;
    }

    @include hover {
      background: #ebebeb;
    }

    &--active {
      background: #fff0e5;
      color: #db6800;
      border-right-color: #eaddd3;
    }
  }
}
</style>
