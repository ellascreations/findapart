<script setup lang="ts">
definePageMeta({middleware:['auth','supplier']})
await navigateTo('/account/company', { replace: true })
</script>
<template><div /></template>
