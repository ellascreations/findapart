<script setup lang="ts">
definePageMeta({ middleware:['auth','repairer'] })
const supabase=useSupabaseClient()
const { company, profile, loadProfile }=useProfile()
const stats=reactive({ open:0, offers:0, fulfilled:0 })
const loading=ref(true)

onMounted(async()=>{
  await loadProfile()
  if(!isValidUuid(company.value?.id)){ loading.value=false; return }
  const [req,fulfilled]=await Promise.all([
    supabase.from('wanted_requests').select('id',{count:'exact'}).eq('repairer_company_id',company.value.id).eq('status','open'),
    supabase.from('wanted_requests').select('id',{count:'exact',head:true}).eq('repairer_company_id',company.value.id).eq('status','fulfilled')
  ])
  stats.open=req.count||0
  stats.fulfilled=fulfilled.count||0
  const ids=(req.data||[]).map((r:any)=>r.id).filter(isValidUuid)
  if(ids.length){
    const o=await supabase.from('wanted_offers').select('*',{count:'exact',head:true}).in('request_id',ids).eq('status','pending')
    stats.offers=o.count||0
  }
  loading.value=false
})
</script>

<template>
<section class="section"><div class="container">
  <div class="dashboard-head">
    <div>
      <div class="kicker">Repairer portal</div>
      <h1 class="page-title" style="margin-top:8px">Welcome back{{profile?.full_name ? `, ${profile.full_name}` : ''}}</h1>
      <p class="muted" v-if="company">{{company.name}}</p>
    </div>
    <div class="dashboard-actions">
      <NuxtLink class="btn btn-secondary" to="/search">Find a Part</NuxtLink>
      <NuxtLink class="btn btn-primary" to="/repairer/wanted/new">+ New Wanted Request</NuxtLink>
    </div>
  </div>

  <div class="grid grid-3" style="margin-top:24px">
    <NuxtLink to="/repairer/wanted" class="card stat"><strong>{{loading?'—':stats.open}}</strong><span class="muted">Open requests</span></NuxtLink>
    <NuxtLink to="/repairer/wanted" class="card stat"><strong>{{loading?'—':stats.offers}}</strong><span class="muted">Offers waiting for you</span></NuxtLink>
    <NuxtLink to="/repairer/wanted" class="card stat"><strong>{{loading?'—':stats.fulfilled}}</strong><span class="muted">Fulfilled requests</span></NuxtLink>
  </div>

  <h2 style="margin:30px 0 14px">What would you like to do?</h2>
  <div class="grid grid-3">
    <div class="card action-card">
      <h2>Search Marketplace</h2>
      <p class="muted">Search supplier stock by vehicle, OEM number, condition and location.</p>
      <NuxtLink class="btn btn-primary" to="/search">Find Parts</NuxtLink>
    </div>
    <div class="card action-card">
      <h2>My Wanted Parts</h2>
      <p class="muted">See your requests and supplier offers in one place. {{stats.offers}} offer{{stats.offers===1?'':'s'}} currently need your attention.</p>
      <NuxtLink class="btn btn-secondary" to="/repairer/wanted">View Requests & Offers</NuxtLink>
    </div>
    <div class="card action-card">
      <h2>Request a Part</h2>
      <p class="muted">Can't find what you need? Publish a request and let approved suppliers respond.</p>
      <NuxtLink class="btn btn-secondary" to="/repairer/wanted/new">Create Request</NuxtLink>
    </div>
  </div>
</div></section>
</template>
