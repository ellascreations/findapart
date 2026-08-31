<script setup lang="ts">
definePageMeta({middleware:['auth','consumer']})
const route=useRoute(), supabase=useSupabaseClient()
const request=ref<any>(null), offers=ref<any[]>([]), loading=ref(true), errorMessage=ref('')
const id=computed(()=>String(route.params.id||''))

const load=async()=>{
  if(!isValidUuid(id.value)){errorMessage.value='Invalid wanted request.';loading.value=false;return}
  const {data,error}=await supabase.from('wanted_requests').select('*, vehicles(*)').eq('id',id.value).maybeSingle()
  if(error||!data){errorMessage.value=error?.message||'Request not found';loading.value=false;return}
  request.value=data
  const o=await supabase.from('wanted_offers').select('*, companies(name), parts(id,title)').eq('request_id',id.value).order('price')
  offers.value=o.data||[]
  loading.value=false
}

onMounted(load)
const accept=async(offerId:string)=>{if(!confirm('Accept this offer? Other pending offers will be declined.'))return; const {error}=await supabase.rpc('accept_wanted_offer',{p_offer_id:offerId}); if(error){errorMessage.value=error.message;return} await load()}
const cancel=async()=>{if(!confirm('Cancel this wanted request?'))return; const {error}=await supabase.from('wanted_requests').update({status:'cancelled',closed_at:new Date().toISOString()}).eq('id',id.value); if(error){errorMessage.value=error.message;return} await load()}
</script>

<template>
<section class="section"><div class="container">
  <div v-if="errorMessage" class="notice error">{{errorMessage}}</div>
  <div v-if="loading">Loading…</div>
  <template v-else-if="request">
    <div style="display:flex;justify-content:space-between;gap:16px;align-items:start;flex-wrap:wrap">
      <div><div class="kicker">Private wanted request</div><h1 class="page-title">{{request.part_name}}</h1><p class="muted">{{request.oem_number||'No OEM number'}} · {{request.delivery_city||''}} {{request.delivery_state_region||''}}</p></div>
      <div style="display:flex;gap:8px"><span class="badge">{{request.status}}</span><button v-if="request.status==='open'" class="btn btn-secondary" @click="cancel">Cancel Request</button></div>
    </div>
    <div class="card" style="padding:22px;margin-top:20px"><p><strong>Preferred colour:</strong> {{request.preferred_colour||'Any'}}</p><p><strong>Condition:</strong> {{request.condition_notes||'Any'}}</p><p><strong>Required by:</strong> {{request.required_by||'Not specified'}}</p><p><strong>Notes:</strong> {{request.notes||'—'}}</p></div>
    <h2 style="margin-top:30px">Supplier Offers ({{offers.length}})</h2>
    <div v-if="!offers.length" class="card empty-state">No supplier offers yet.</div>
    <div v-else class="grid" style="gap:14px"><div v-for="o in offers" :key="o.id" class="card" style="padding:20px"><div style="display:flex;justify-content:space-between;gap:15px;flex-wrap:wrap"><div><h3 style="margin:0">{{o.companies?.name||'Supplier'}}</h3><p class="muted">{{o.message||'No message'}}</p><p v-if="o.eta_text"><strong>ETA:</strong> {{o.eta_text}}</p></div><div style="text-align:right"><strong style="font-size:24px">{{o.currency}} {{Number(o.price).toFixed(2)}}</strong><p class="muted">Freight: {{o.freight_price==null?'TBC':`${o.currency} ${Number(o.freight_price).toFixed(2)}`}}</p><span class="badge">{{o.status}}</span><div><button v-if="request.status==='open'&&o.status==='pending'" class="btn btn-primary" style="margin-top:10px" @click="accept(o.id)">Accept Offer</button></div></div></div></div></div>
  </template>
</div></section>
</template>
