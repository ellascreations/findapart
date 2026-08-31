<script setup lang="ts">
definePageMeta({ middleware: ['admin'] })
const supabase = useSupabaseClient()
const loading = ref(true)
const stats = reactive({ users:0, companies:0, pending:0, parts:0, wanted:0, vehicles:0 })
const loadStats = async () => {
  loading.value = true
  const [users, companies, pending, parts, wanted, vehicles] = await Promise.all([
    supabase.from('profiles').select('*',{count:'exact',head:true}),
    supabase.from('companies').select('*',{count:'exact',head:true}),
    supabase.from('companies').select('*',{count:'exact',head:true}).eq('approved',false),
    supabase.from('parts').select('*',{count:'exact',head:true}),
    supabase.from('wanted_requests').select('*',{count:'exact',head:true}).eq('status','open'),
    supabase.from('vehicles').select('*',{count:'exact',head:true}).eq('active',true),
  ])
  stats.users=users.count||0; stats.companies=companies.count||0; stats.pending=pending.count||0
  stats.parts=parts.count||0; stats.wanted=wanted.count||0; stats.vehicles=vehicles.count||0
  loading.value=false
}
onMounted(loadStats)
</script>
<template>
<section class="section"><div class="container">
  <div class="kicker">Find a Part administration</div>
  <h1 class="page-title" style="margin-top:8px;">Control Centre</h1>
  <p class="muted">Manage users, companies, listings, wanted requests and the vehicle catalogue.</p>
  <div class="grid grid-3" style="margin-top:24px;">
    <NuxtLink to="/admin/users" class="card stat"><strong>{{loading?'—':stats.users}}</strong><span class="muted">Users</span></NuxtLink>
    <NuxtLink to="/admin/companies" class="card stat"><strong>{{loading?'—':stats.companies}}</strong><span class="muted">Companies · {{stats.pending}} pending</span></NuxtLink>
    <NuxtLink to="/admin/listings" class="card stat"><strong>{{loading?'—':stats.parts}}</strong><span class="muted">Part listings</span></NuxtLink>
    <NuxtLink to="/admin/wanted" class="card stat"><strong>{{loading?'—':stats.wanted}}</strong><span class="muted">Open wanted requests</span></NuxtLink>
    <NuxtLink to="/admin/vehicles" class="card stat"><strong>{{loading?'—':stats.vehicles}}</strong><span class="muted">Vehicle records</span></NuxtLink>
    <NuxtLink to="/admin/audit" class="card stat"><strong>Audit</strong><span class="muted">Administration activity log</span></NuxtLink>
  </div>
</div></section>
</template>
