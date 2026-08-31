<script setup lang="ts">
definePageMeta({middleware:['auth','supplier']})
const supabase=useSupabaseClient()
const {company,profile,loadProfile}=useProfile()
const stats=reactive({active:0,total:0,sold:0,draft:0,wanted:0})
const loading=ref(true)

onMounted(async()=>{
  await loadProfile()
  if(!isValidUuid(company.value?.id)){loading.value=false;return}
  const base=()=>supabase.from('parts').select('*',{count:'exact',head:true}).eq('seller_company_id',company.value.id)
  const [a,t,s,d]=await Promise.all([base().eq('status','active'),base(),base().eq('status','sold'),base().eq('status','draft')])
  stats.active=a.count||0;stats.total=t.count||0;stats.sold=s.count||0;stats.draft=d.count||0
  const w=await supabase.from('wanted_requests').select('*',{count:'exact',head:true}).eq('status','open')
  stats.wanted=w.count||0
  loading.value=false
})
</script>

<template>
<section class="section"><div class="container">
  <div class="dashboard-head">
    <div>
      <div class="kicker">Supplier portal</div>
      <h1 class="page-title" style="margin-top:8px">Welcome back{{profile?.full_name ? `, ${profile.full_name}` : ''}}</h1>
      <p class="muted" v-if="company">{{company.name}}</p>
    </div>
    <div class="dashboard-actions">
      <NuxtLink class="btn btn-secondary" to="/supplier/wanted">Browse Wanted Parts</NuxtLink>
      <NuxtLink class="btn btn-primary" to="/supplier/parts/new">+ Add Part</NuxtLink>
    </div>
  </div>

  <div class="grid grid-4" style="margin-top:24px">
    <NuxtLink to="/supplier/parts" class="card stat"><strong>{{loading?'—':stats.active}}</strong><span class="muted">Active listings</span></NuxtLink>
    <NuxtLink to="/supplier/parts" class="card stat"><strong>{{loading?'—':stats.draft}}</strong><span class="muted">Draft listings</span></NuxtLink>
    <NuxtLink to="/supplier/parts" class="card stat"><strong>{{loading?'—':stats.sold}}</strong><span class="muted">Sold parts</span></NuxtLink>
    <NuxtLink to="/supplier/wanted" class="card stat"><strong>{{loading?'—':stats.wanted}}</strong><span class="muted">Open wanted requests</span></NuxtLink>
  </div>

  <h2 style="margin:30px 0 14px">Supplier tools</h2>
  <div class="grid grid-3">
    <div class="card action-card">
      <h2>My Inventory</h2>
      <p class="muted">Manage all {{stats.total}} listings, update stock, edit fitment or mark parts sold.</p>
      <NuxtLink class="btn btn-primary" to="/supplier/parts">Manage Parts</NuxtLink>
    </div>
    <div class="card action-card">
      <h2>Wanted Requests</h2>
      <p class="muted">Browse requests from repairers and submit an offer when you have the right part.</p>
      <NuxtLink class="btn btn-secondary" to="/supplier/wanted">Find Requests</NuxtLink>
    </div>
    <div class="card action-card">
      <h2>Company Profile</h2>
      <p class="muted">Maintain your business details, logo, contact details and approval information.</p>
      <NuxtLink class="btn btn-secondary" to="/account/company">Manage Company</NuxtLink>
    </div>
  </div>
</div></section>
</template>
