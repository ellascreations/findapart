<script setup lang="ts">
const route = useRoute()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { profile, loadProfile, clearProfile } = useProfile()

watch(user, async v => {
  if (v?.id && isValidUuid(v.id)) await loadProfile()
  else clearProfile()
}, { immediate: true })

const dashboardPath = computed(() => {
  if (profile.value?.role === 'supplier') return '/supplier/dashboard'
  if (profile.value?.role === 'repairer') return '/repairer/dashboard'
  if (['admin', 'superadmin'].includes(profile.value?.role || '')) return '/admin'
  return '/'
})

const portalLabel = computed(() => {
  if (profile.value?.role === 'supplier') return 'Supplier Portal'
  if (profile.value?.role === 'repairer') return 'Repairer Portal'
  if (['admin', 'superadmin'].includes(profile.value?.role || '')) return 'Admin'
  return 'Dashboard'
})

const logout = async () => {
  await supabase.auth.signOut()
  clearProfile()
  await navigateTo('/')
}
</script>

<template>
  <header class="site-header">
    <div class="container site-header-inner">
      <NuxtLink to="/" class="brand-link">
        <span class="brand-mark">F</span>
        <span class="brand-copy"><strong>FIND A PART</strong><small>Every Part. Everywhere.</small></span>
      </NuxtLink>

      <nav class="site-nav">
        <NuxtLink to="/search" class="header-link" :class="{ active: route.path.startsWith('/search') }">Marketplace</NuxtLink>
        <template v-if="user">
          <NuxtLink :to="dashboardPath" class="btn btn-primary header-portal-btn">{{ portalLabel }}</NuxtLink>
          <button class="btn btn-secondary header-signout" @click="logout">Sign Out</button>
        </template>
        <NuxtLink v-else to="/login" class="btn btn-primary header-portal-btn">Sign In</NuxtLink>
      </nav>
    </div>
  </header>
</template>
