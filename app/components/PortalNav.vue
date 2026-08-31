<script setup lang="ts">
const route = useRoute()
const { profile, loadProfile } = useProfile()

onMounted(loadProfile)

const role = computed(() => profile.value?.role || '')

const items = computed(() => {
  if (role.value === 'repairer') {
    return [
      { to: '/repairer/dashboard', label: 'Dashboard', icon: '⌂' },
      { to: '/search', label: 'Find Parts', icon: '⌕' },
      { to: '/repairer/wanted', label: 'Wanted Parts', icon: '◎' },
      { to: '/repairer/wanted/new', label: 'New Request', icon: '+' },
      { to: '/account/company', label: 'Company', icon: '▣' },
    ]
  }

  if (role.value === 'supplier') {
    return [
      { to: '/supplier/dashboard', label: 'Dashboard', icon: '⌂' },
      { to: '/supplier/parts', label: 'My Parts', icon: '▦' },
      { to: '/supplier/parts/new', label: 'Add Part', icon: '+' },
      { to: '/supplier/wanted', label: 'Wanted Requests', icon: '◎' },
      { to: '/account/company', label: 'Company', icon: '▣' },
    ]
  }

  if (['admin', 'superadmin'].includes(role.value)) {
    return [
      { to: '/admin', label: 'Dashboard', icon: '⌂' },
      { to: '/admin/users', label: 'Users', icon: '◉' },
      { to: '/admin/companies', label: 'Companies', icon: '▣' },
      { to: '/admin/listings', label: 'Listings', icon: '▦' },
      { to: '/admin/wanted', label: 'Wanted', icon: '◎' },
      { to: '/admin/vehicles', label: 'Vehicles', icon: '◇' },
      { to: '/admin/audit', label: 'Audit', icon: '≡' },
    ]
  }

  return []
})

const show = computed(() => {
  if (!items.value.length) return false
  return route.path.startsWith('/repairer') || route.path.startsWith('/supplier') || route.path.startsWith('/admin') || route.path.startsWith('/account')
})

const active = (to: string) => {
  if (to === '/admin' || to.endsWith('/dashboard')) return route.path === to
  return route.path.startsWith(to)
}
</script>

<template>
  <div v-if="show" class="portal-nav-wrap">
    <div class="container portal-nav">
      <NuxtLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="portal-nav-link"
        :class="{ active: active(item.to) }"
      >
        <span class="portal-nav-icon">{{ item.icon }}</span>
        <span>{{ item.label }}</span>
      </NuxtLink>
    </div>
  </div>
</template>
