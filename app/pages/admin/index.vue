<script setup lang="ts">
definePageMeta({ middleware: ['auth','admin'] })
const supabase = useSupabaseClient()
const stats = reactive({ suppliers:0, repairers:0, parts:0, vehicles:0 })
const loading = ref(true)
const loadStats = async () => {
  loading.value = true
  const [suppliers, repairers, parts, vehicles] = await Promise.all([
    supabase.from('profiles').select('*',{count:'exact',head:true}).eq('role','supplier'),
    supabase.from('profiles').select('*',{count:'exact',head:true}).eq('role','repairer'),
    supabase.from('parts').select('*',{count:'exact',head:true}).eq('status','active'),
    supabase.from('vehicles').select('*',{count:'exact',head:true}).eq('active',true)
  ])
  stats.suppliers=suppliers.count||0; stats.repairers=repairers.count||0; stats.parts=parts.count||0; stats.vehicles=vehicles.count||0
  loading.value=false
}
onMounted(loadStats)
</script>
<template><section class="section"><div class="container"><div class="kicker">Find a Part administration</div><h1 class="page-title" style="margin-top:8px;">Admin Dashboard</h1><div class="grid grid-4" style="margin-top:24px;"><div class="card stat"><strong>{{loading?'—':stats.suppliers}}</strong><span class="muted">Suppliers</span></div><div class="card stat"><strong>{{loading?'—':stats.repairers}}</strong><span class="muted">Repairers</span></div><div class="card stat"><strong>{{loading?'—':stats.parts}}</strong><span class="muted">Active parts</span></div><div class="card stat"><strong>{{loading?'—':stats.vehicles}}</strong><span class="muted">Vehicle records</span></div></div><div class="grid grid-3" style="margin-top:22px;"><div class="card" style="padding:22px;"><h3>Company approvals</h3><p class="muted">Approve or reject supplier and repairer businesses.</p><button class="btn btn-secondary" disabled>Coming in Admin stage</button></div><div class="card" style="padding:22px;"><h3>Listings</h3><p class="muted">Review marketplace listings and reported parts.</p><button class="btn btn-secondary" disabled>Coming in Admin stage</button></div><div class="card" style="padding:22px;"><h3>Users</h3><p class="muted">Manage account roles, access and marketplace status.</p><button class="btn btn-secondary" disabled>Coming in Admin stage</button></div><div class="card" style="padding:22px;"><h3>Vehicle Catalogue</h3><p class="muted">Manage years, makes, models, variants, body styles and engines used across Find a Part.</p><NuxtLink to="/admin/vehicles" class="btn btn-secondary">Manage Vehicles</NuxtLink></div></div></div></section></template>
