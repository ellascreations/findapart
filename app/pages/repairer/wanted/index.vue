<script setup lang="ts">
definePageMeta({middleware:['auth','repairer']})
const supabase=useSupabaseClient()
const {company,loadProfile}=useProfile()
const rows=ref<any[]>([])
const loading=ref(true)
const filter=ref<'all'|'open'|'fulfilled'|'cancelled'>('all')
const filters=['all','open','fulfilled','cancelled'] as const
const setFilter=(value:typeof filters[number])=>{filter.value=value}

const load=async()=>{
  loading.value=true
  await loadProfile()
  if(!isValidUuid(company.value?.id)){loading.value=false;return}
  let query=supabase.from('wanted_requests').select('*, vehicles(*), wanted_offers(id,status)').eq('repairer_company_id',company.value.id).order('created_at',{ascending:false})
  if(filter.value!=='all') query=query.eq('status',filter.value)
  const {data}=await query
  rows.value=data||[]
  loading.value=false
}

watch(filter,load)
onMounted(load)
const pendingOffers=(r:any)=>(r.wanted_offers||[]).filter((o:any)=>o.status==='pending').length
const vehicleLabel=(v:any)=>v?[v.year,v.make,v.model,v.series,v.variant].filter(Boolean).join(' '):'Vehicle not specified'
</script>

<template>
<section class="section"><div class="container">
  <div class="dashboard-head">
    <div><div class="kicker">Repairer portal</div><h1 class="page-title">My Wanted Parts</h1><p class="muted">Requests and supplier offers are managed here.</p></div>
    <NuxtLink class="btn btn-primary" to="/repairer/wanted/new">+ Create Request</NuxtLink>
  </div>

  <div class="page-actions" style="margin-top:20px">
    <button v-for="f in filters" :key="f" class="btn" :class="filter===f?'btn-primary':'btn-secondary'" @click="setFilter(f)">{{f==='all'?'All Requests':f.charAt(0).toUpperCase()+f.slice(1)}}</button>
  </div>

  <div v-if="loading" class="card empty-state">Loading requests…</div>
  <div v-else-if="!rows.length" class="card empty-state"><h2>No requests here</h2><p class="muted">Create a wanted request and approved suppliers can send you offers.</p><NuxtLink class="btn btn-primary" to="/repairer/wanted/new">Create Request</NuxtLink></div>
  <div v-else class="grid" style="gap:14px;margin-top:22px">
    <NuxtLink v-for="r in rows" :key="r.id" :to="`/repairer/wanted/${r.id}`" class="card request-card">
      <div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><h3 style="margin:0">{{r.part_name}}</h3><span class="badge">{{r.status}}</span></div>
        <p class="muted" style="margin:7px 0 0">{{vehicleLabel(r.vehicles)}}</p>
        <div class="request-meta">
          <span class="badge" v-if="r.oem_number">OEM {{r.oem_number}}</span>
          <span class="badge" v-if="r.delivery_city || r.delivery_state_region">{{[r.delivery_city,r.delivery_state_region].filter(Boolean).join(', ')}}</span>
          <span class="badge" v-if="r.required_by">Needed by {{new Date(r.required_by+'T00:00:00').toLocaleDateString()}}</span>
        </div>
      </div>
      <div class="offer-count">
        <strong>{{pendingOffers(r)}}</strong>
        <span>{{pendingOffers(r)===1?'Offer waiting':'Offers waiting'}}</span>
        <div style="margin-top:6px;font-size:12px;font-weight:900">View →</div>
      </div>
    </NuxtLink>
  </div>
</div></section>
</template>
