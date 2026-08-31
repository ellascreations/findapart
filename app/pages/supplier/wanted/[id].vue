<script setup lang="ts">
definePageMeta({middleware:['auth','supplier']})
const route=useRoute(), supabase=useSupabaseClient(); const {company,user,loadProfile}=useProfile(); const request=ref<any>(null), parts=ref<any[]>([]), existing=ref<any>(null), loading=ref(true), errorMessage=ref(''), successMessage=ref('')
const id=computed(()=>String(route.params.id||'')); const form=reactive({part_id:'',price:'',currency:'AUD',freight_price:'',eta_text:'',message:''})
const load=async()=>{await loadProfile(); if(!isValidUuid(id.value)||!isValidUuid(company.value?.id)){errorMessage.value='Invalid request or supplier account.';loading.value=false;return} const r=await supabase.from('wanted_requests').select('*, companies(name), vehicles(*)').eq('id',id.value).maybeSingle(); request.value=r.data; const p=await supabase.from('parts').select('id,title,price').eq('seller_company_id',company.value.id).in('status',['active','draft']).order('title');parts.value=p.data||[]; const e=await supabase.from('wanted_offers').select('*').eq('request_id',id.value).eq('supplier_company_id',company.value.id).in('status',['pending','accepted']).maybeSingle();existing.value=e.data; if(e.data)Object.assign(form,{part_id:e.data.part_id||'',price:String(e.data.price||''),currency:e.data.currency,freight_price:e.data.freight_price==null?'':String(e.data.freight_price),eta_text:e.data.eta_text||'',message:e.data.message||''});loading.value=false}
onMounted(load)
const submitting=ref(false)

const submit=async()=>{
  errorMessage.value=''
  successMessage.value=''

  if(!request.value){
    errorMessage.value='Wanted request is not loaded.'
    return
  }

  await loadProfile()

  if(!isValidUuid(company.value?.id)){
    errorMessage.value='Your supplier company profile is not ready.'
    return
  }

  let authenticatedUserId = isValidUuid(user.value?.id) ? user.value!.id : ''

  if(!authenticatedUserId){
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if(userError || !isValidUuid(userData.user?.id)){
      errorMessage.value = userError?.message || 'Your login session could not be verified. Please sign in again.'
      return
    }
    authenticatedUserId = userData.user!.id
  }

  const price = Number(form.price)
  const freight = form.freight_price === '' ? null : Number(form.freight_price)

  if(!Number.isFinite(price) || price < 0){
    errorMessage.value='Enter a valid price.'
    return
  }

  if(freight !== null && (!Number.isFinite(freight) || freight < 0)){
    errorMessage.value='Enter a valid freight price.'
    return
  }

  const payload={
    request_id:id.value,
    supplier_company_id:company.value.id,
    part_id:isValidUuid(form.part_id)?form.part_id:null,
    price,
    currency:(form.currency||'AUD').trim().toUpperCase(),
    freight_price:freight,
    eta_text:form.eta_text||null,
    message:form.message||null,
    created_by:authenticatedUserId,
    status:'pending'
  }

  submitting.value=true
  try{
    const res=existing.value
      ? await supabase.from('wanted_offers').update(payload).eq('id',existing.value.id).select('id').maybeSingle()
      : await supabase.from('wanted_offers').insert(payload).select('id').maybeSingle()

    if(res.error){
      errorMessage.value=res.error.message
      return
    }

    successMessage.value=existing.value?'Offer updated successfully.':'Offer submitted successfully.'
    await load()
  }catch(err:any){
    errorMessage.value=err?.message||'Unable to submit the offer.'
  }finally{
    submitting.value=false
  }
}
const withdraw=async()=>{if(!existing.value||!confirm('Withdraw this offer?'))return;await supabase.from('wanted_offers').update({status:'withdrawn'}).eq('id',existing.value.id);await load()}
</script>
<template><section class="section"><div class="container" style="max-width:950px"><div v-if="errorMessage" class="notice error">{{errorMessage}}</div><div v-if="successMessage" class="notice">{{successMessage}}</div><div v-if="loading">Loading…</div><template v-else-if="request"><div class="kicker">Wanted part</div><h1 class="page-title">{{request.part_name}}</h1><div class="card" style="padding:20px;margin-top:18px"><p><strong>Repairer:</strong> {{request.companies?.name}}</p><p><strong>OEM:</strong> {{request.oem_number||'Not specified'}}</p><p><strong>Colour:</strong> {{request.preferred_colour||'Any'}}</p><p><strong>Condition:</strong> {{request.condition_notes||'Any'}}</p><p><strong>Delivery:</strong> {{request.delivery_city||''}} {{request.delivery_state_region||''}} {{request.delivery_country_code}}</p><p><strong>Required by:</strong> {{request.required_by||'Not specified'}}</p><p><strong>Notes:</strong> {{request.notes||'—'}}</p></div><form v-if="request.status==='open'" class="card" style="padding:22px;margin-top:20px" @submit.prevent="submit"><h2>{{existing?'Update Your Offer':'Submit an Offer'}}</h2><div class="grid grid-2"><div><label class="label">Link one of your listings (optional)</label><select v-model="form.part_id" class="select"><option value="">No linked listing</option><option v-for="p in parts" :key="p.id" :value="p.id">{{p.title}}</option></select></div><div><label class="label">Price</label><input v-model="form.price" required type="number" min="0" step="0.01" class="input"></div><div><label class="label">Currency</label><input v-model="form.currency" maxlength="3" class="input"></div><div><label class="label">Freight price</label><input v-model="form.freight_price" type="number" min="0" step="0.01" class="input"></div><div><label class="label">ETA</label><input v-model="form.eta_text" class="input" placeholder="2–3 business days"></div></div><div style="margin-top:16px"><label class="label">Message</label><textarea v-model="form.message" rows="5" class="textarea" placeholder="Condition, colour, freight notes..."></textarea></div><div style="display:flex;gap:10px;margin-top:18px"><button class="btn btn-primary" :disabled="submitting">{{submitting?'Submitting…':(existing?'Update Offer':'Submit Offer')}}</button><button v-if="existing" type="button" class="btn btn-secondary" @click="withdraw">Withdraw</button></div></form><div v-else class="notice">This request is {{request.status}} and is no longer accepting offers.</div></template></div></section></template>
