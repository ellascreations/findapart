<script setup lang="ts">
definePageMeta({middleware:['auth','supplier']})
const supabase=useSupabaseClient()
const rows=ref<any[]>([])
const loading=ref(true)
const q=ref('')
const load=async()=>{
  loading.value=true
  let query=supabase.from('wanted_requests').select('*, companies(name), vehicles(*)').eq('status','open').order('created_at',{ascending:false})
  if(q.value.trim()) query=query.ilike('part_name',`%${q.value.trim()}%`)
  const {data}=await query.limit(100)
  rows.value=data||[]
  loading.value=false
}
onMounted(load)
const vehicleLabel=(v:any)=>v?[v.year,v.make,v.model,v.series,v.variant].filter(Boolean).join(' '):'Vehicle not specified'
</script>

<template>
<section class="section"><div class="container">
  <div class="dashboard-head"><div><div class="kicker">Supplier portal</div><h1 class="page-title">Wanted Requests</h1><p class="muted">Find repairers and private restorers who need parts you have in stock.</p></div><NuxtLink class="btn btn-secondary" to="/supplier/parts">My Inventory</NuxtLink></div>
  <div class="card" style="padding:16px;margin-top:20px;display:flex;gap:10px"><input v-model="q" class="input" placeholder="Search part name" @keyup.enter="load"><button class="btn btn-primary" @click="load">Search Requests</button></div>
  <div v-if="loading" class="card empty-state">Loading requests…</div>
  <div v-else-if="!rows.length" class="card empty-state"><h2>No open requests match</h2><p class="muted">Try another search or check again later.</p></div>
  <div v-else class="grid" style="gap:14px;margin-top:20px">
    <NuxtLink v-for="r in rows" :key="r.id" :to="`/supplier/wanted/${r.id}`" class="card request-card">
      <div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><h3 style="margin:0">{{r.part_name}}</h3><span class="badge">OPEN</span></div>
        <p class="muted" style="margin:7px 0 0">{{vehicleLabel(r.vehicles)}}</p>
        <div class="request-meta">
          <span class="badge" v-if="r.oem_number">OEM {{r.oem_number}}</span>
          <span class="badge">{{r.preferred_colour||'Any colour'}}</span>
          <span class="badge">{{r.condition_notes||'Any condition'}}</span>
          <span class="badge">{{r.companies?.name||r.requester_name||'Private Restorer'}}</span><span class="badge" v-if="r.delivery_city || r.delivery_state_region">Deliver to {{[r.delivery_city,r.delivery_state_region].filter(Boolean).join(', ')}}</span>
        </div>
      </div>
      <div style="text-align:right"><div class="btn btn-primary">View & Offer →</div></div>
    </NuxtLink>
  </div>
</div></section>
</template>
