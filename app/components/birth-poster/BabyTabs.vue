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
      <span class="baby-tabs__label">Bebé {{ i }}</span>
      <span
        v-if="store.activePanel === 'datos' && store.babyHasMissingData(i - 1)"
        class="baby-tabs__badge"
      >!</span>
    </button>
  </div>
</template>

<style lang="scss" scoped>
.baby-tabs {
  display: flex;
  border-radius: 0px;
  overflow: hidden;

  &__tab {
    @include button-reset;
    flex: 1;
    min-height: 40px;
    padding: 18px 16px;
    font-family: $font-primary;
    font-size: 16px;
    font-weight: $font-weight-bold;
    background: #f5f5f5;
    color: #414651;
    border-right: 1px solid #e9eaeb;
    transition: background-color $transition-fast, color $transition-fast;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    border-bottom: 1px solid #e9eaeb;
    @include mobile {
      min-height: unset;
      padding: 12px 0;
    }

    &:last-child {
      border-right: none;
    }

    @include hover {
      background: #ebebeb;
    }

    &--active {
      background: transparent;
      color: #db6800;
      border-right-color: #eaddd3;
      border-bottom: none;
      @include hover {
        background: transparent;
      }
    }
  }

  &__label {
    // Inherits font styles from parent
  }

  &__badge {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 13px;
    height: 13px;
    background: $color-error;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-family: $font-primary;
    font-size: 11px;
    font-weight: $font-weight-bold;
    color: #ffffff;
    line-height: 1;
    @include mobile {
      right: 12px;
    }
  }
}
</style>
