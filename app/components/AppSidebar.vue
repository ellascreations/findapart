<script setup lang="ts">
const route = useRoute()
const supabase = useSupabaseClient()
const { profile, company, loadProfile, clearProfile } = useProfile()

const mobileOpen = ref(false)
const authenticatedUser = ref<any | null>(null)
const resolvedRole = ref('')
const resolvedCompany = ref<any | null>(null)

const resolveAccount = async () => {
  // Do not depend on useSupabaseUser() hydration for sidebar permissions.
  const { data: userData, error: userError } = await supabase.auth.getUser()
  const authUser = userData.user

  if (userError || !isValidUuid(authUser?.id)) {
    authenticatedUser.value = null
    resolvedRole.value = ''
    resolvedCompany.value = null
    clearProfile()
    return
  }

  authenticatedUser.value = authUser

  // First allow the shared composable to populate its normal state.
  await loadProfile()

  // Then resolve directly from the database so a slow/stale reactive
  // Supabase user cannot leave the sidebar showing public links only.
  const { data, error } = await supabase
    .from('profiles')
    .select('id,full_name,email,role,account_status,company_id,companies(*)')
    .eq('id', authUser.id)
    .maybeSingle()

  if (!error && data) {
    resolvedRole.value = data.role || ''
    resolvedCompany.value = (data as any).companies || null
    useState<any | null>('current-profile', () => null).value = data
    useState<any | null>('current-company', () => null).value = (data as any).companies || null
  } else {
    resolvedRole.value = profile.value?.role || ''
    resolvedCompany.value = company.value || null
  }
}

onMounted(resolveAccount)
watch(() => route.fullPath, async () => {
  mobileOpen.value = false
  await resolveAccount()
})

watch(profile, value => {
  if (value?.role) resolvedRole.value = value.role
}, { deep: true })

watch(company, value => {
  if (value?.id) resolvedCompany.value = value
}, { deep: true })

const role = computed(() => profile.value?.role || resolvedRole.value || '')
const isAdmin = computed(() => ['admin', 'superadmin'].includes(role.value))
const activeCompany = computed(() => company.value?.id ? company.value : resolvedCompany.value)
const companyType = computed(() => activeCompany.value?.type || '')
const isLoggedIn = computed(() => !!authenticatedUser.value)

const publicItems = [
  { to: '/', label: 'Home', icon: '⌂' },
  { to: '/search', label: 'Marketplace', icon: '⌕' },
]

const repairerItems = [
  { to: '/repairer/dashboard', label: 'Dashboard', icon: '⌂' },
  { to: '/search', label: 'Find Parts', icon: '⌕' },
  { to: '/repairer/wanted', label: 'My Wanted Parts', icon: '◎' },
  { to: '/repairer/wanted/new', label: 'New Wanted Request', icon: '+' },
  { to: '/account/company', label: 'Company Profile', icon: '▣' },
]

const supplierItems = [
  { to: '/supplier/dashboard', label: 'Dashboard', icon: '⌂' },
  { to: '/supplier/parts', label: 'My Parts', icon: '▦' },
  { to: '/supplier/parts/new', label: 'Add Part', icon: '+' },
  { to: '/supplier/wanted', label: 'Wanted Requests', icon: '◎' },
  { to: '/account/company', label: 'Company Profile', icon: '▣' },
]

const adminItems = [
  { to: '/admin', label: 'Dashboard', icon: '⌂' },
  { to: '/admin/users', label: 'Users', icon: '◉' },
  { to: '/admin/companies', label: 'Companies', icon: '▣' },
  { to: '/admin/listings', label: 'Listings', icon: '▦' },
  { to: '/admin/wanted', label: 'Wanted Requests', icon: '◎' },
  { to: '/admin/vehicles', label: 'Vehicles', icon: '◇' },
  { to: '/admin/audit', label: 'Audit Log', icon: '≡' },
]

const active = (to: string) => {
  if (to === '/') return route.path === '/'
  if (to === '/admin' || to.endsWith('/dashboard')) return route.path === to
  return route.path.startsWith(to)
}

const logout = async () => {
  await supabase.auth.signOut()
  authenticatedUser.value = null
  resolvedRole.value = ''
  resolvedCompany.value = null
  clearProfile()
  mobileOpen.value = false
  await navigateTo('/')
}
</script>

<template>
  <button class="sidebar-mobile-toggle" type="button" aria-label="Open navigation" @click="mobileOpen = true">
    <span></span><span></span><span></span>
  </button>

  <div v-if="mobileOpen" class="sidebar-overlay" @click="mobileOpen = false"></div>

  <aside class="app-sidebar" :class="{ open: mobileOpen }">
    <div class="sidebar-top">
      <button class="sidebar-mobile-close" type="button" aria-label="Close navigation" @click="mobileOpen = false">×</button>
      <NuxtLink to="/" class="sidebar-logo-link" aria-label="Find a Part home">
        <img src="/brand/find-a-part-logo.webp" alt="Find a Part - Parts. People. Solutions." class="sidebar-logo">
      </NuxtLink>
    </div>

    <div class="sidebar-scroll">
      <nav class="sidebar-section">
        <div class="sidebar-section-title">Find a Part</div>
        <NuxtLink
          v-for="item in publicItems"
          :key="item.to"
          :to="item.to"
          class="sidebar-link"
          :class="{ active: active(item.to) }"
        >
          <span class="sidebar-icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <nav v-if="companyType === 'repairer'" class="sidebar-section">
        <div class="sidebar-section-title">Repairer</div>
        <NuxtLink
          v-for="item in repairerItems"
          :key="item.to"
          :to="item.to"
          class="sidebar-link"
          :class="{ active: active(item.to) }"
        >
          <span class="sidebar-icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <nav v-if="companyType === 'supplier'" class="sidebar-section">
        <div class="sidebar-section-title">Supplier</div>
        <NuxtLink
          v-for="item in supplierItems"
          :key="item.to"
          :to="item.to"
          class="sidebar-link"
          :class="{ active: active(item.to) }"
        >
          <span class="sidebar-icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <nav v-if="isAdmin" class="sidebar-section">
        <div class="sidebar-section-title">Administration</div>
        <NuxtLink
          v-for="item in adminItems"
          :key="item.to"
          :to="item.to"
          class="sidebar-link"
          :class="{ active: active(item.to) }"
        >
          <span class="sidebar-icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>
    </div>

    <div class="sidebar-account">
      <template v-if="isLoggedIn">
        <div class="sidebar-user">
          <div class="sidebar-user-avatar">{{ (profile?.full_name || authenticatedUser?.email || 'U').charAt(0).toUpperCase() }}</div>
          <div class="sidebar-user-copy">
            <strong>{{ profile?.full_name || 'Account' }}</strong>
            <span>{{ activeCompany?.name || authenticatedUser?.email }}</span>
          </div>
        </div>
        <button class="sidebar-signout" type="button" @click="logout">Sign Out</button>
      </template>
      <template v-else>
        <NuxtLink to="/login" class="btn btn-primary sidebar-auth-btn">Sign In</NuxtLink>
        <NuxtLink to="/register" class="btn btn-secondary sidebar-auth-btn">Create Account</NuxtLink>
      </template>
    </div>
  </aside>
</template>
