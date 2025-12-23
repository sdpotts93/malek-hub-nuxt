<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
// Initialize cart on app mount
const { initCart } = useShopifyCart()

onMounted(() => {
  initCart()
})
</script>
