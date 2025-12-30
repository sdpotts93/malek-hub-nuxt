<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
// Initialize cart on app mount
const cart = useShopifyCart()

onMounted(() => {
  cart.init()
})
</script>
