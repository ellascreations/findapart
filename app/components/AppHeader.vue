<script setup lang="ts">
const route = useRoute()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { profile, company, loadProfile, clearProfile } = useProfile()

watch(user, async v => {
  if (v?.id && isValidUuid(v.id)) await loadProfile()
  else clearProfile()
}, { immediate: true })

onMounted(loadProfile)

const isAdmin = computed(() => ['admin', 'superadmin'].includes(profile.value?.role || ''))
const marketplacePortal = computed(() => {
  if (company.value?.type === 'repairer') {
    return { to: '/repairer/dashboard', label: 'Repairer Portal' }
  }
  if (company.value?.type === 'supplier') {
    return { to: '/supplier/dashboard', label: 'Supplier Portal' }
  }
  return null
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
          <NuxtLink
            v-if="marketplacePortal"
            :to="marketplacePortal.to"
            class="btn btn-secondary header-portal-btn"
          >
            {{ marketplacePortal.label }}
          </NuxtLink>

          <NuxtLink
            v-if="isAdmin"
            to="/admin"
            class="btn btn-primary header-portal-btn"
          >
            Admin
          </NuxtLink>

          <button class="btn btn-secondary header-signout" @click="logout">Sign Out</button>
        </template>

        <NuxtLink v-else to="/login" class="btn btn-primary header-portal-btn">Sign In</NuxtLink>
      </nav>
    </div>
  </header>
</template>
