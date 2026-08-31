<script setup lang="ts">
const route = useRoute()
const { profile, company, loadProfile } = useProfile()

onMounted(loadProfile)

const role = computed(() => profile.value?.role || '')
const isAdmin = computed(() => ['admin', 'superadmin'].includes(role.value))
const companyType = computed(() => company.value?.type || '')

const adminItems = [
  { to: '/admin', label: 'Dashboard', icon: '⌂' },
  { to: '/admin/users', label: 'Users', icon: '◉' },
  { to: '/admin/companies', label: 'Companies', icon: '▣' },
  { to: '/admin/listings', label: 'Listings', icon: '▦' },
  { to: '/admin/wanted', label: 'Wanted', icon: '◎' },
  { to: '/admin/vehicles', label: 'Vehicles', icon: '◇' },
  { to: '/admin/audit', label: 'Audit', icon: '≡' },
]

const repairerItems = [
  { to: '/repairer/dashboard', label: 'Dashboard', icon: '⌂' },
  { to: '/search', label: 'Find Parts', icon: '⌕' },
  { to: '/repairer/wanted', label: 'Wanted Parts', icon: '◎' },
  { to: '/repairer/wanted/new', label: 'New Request', icon: '+' },
  { to: '/account/company', label: 'Company', icon: '▣' },
]

const supplierItems = [
  { to: '/supplier/dashboard', label: 'Dashboard', icon: '⌂' },
  { to: '/supplier/parts', label: 'My Parts', icon: '▦' },
  { to: '/supplier/parts/new', label: 'Add Part', icon: '+' },
  { to: '/supplier/wanted', label: 'Wanted Requests', icon: '◎' },
  { to: '/account/company', label: 'Company', icon: '▣' },
]

const items = computed(() => {
  // The current area decides which navigation is shown.
  if (route.path.startsWith('/admin')) return isAdmin.value ? adminItems : []
  if (route.path.startsWith('/repairer')) return companyType.value === 'repairer' ? repairerItems : []
  if (route.path.startsWith('/supplier')) return companyType.value === 'supplier' ? supplierItems : []

  // Company profile belongs to the marketplace company, not the admin role.
  if (route.path.startsWith('/account')) {
    if (companyType.value === 'repairer') return repairerItems
    if (companyType.value === 'supplier') return supplierItems
  }

  return []
})

const show = computed(() => items.value.length > 0)

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
