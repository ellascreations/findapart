<script setup lang="ts">
definePageMeta({middleware:['auth','consumer']})
const supabase=useSupabaseClient()
const {profile,loadProfile,resolveUserId}=useProfile()
const form=reactive({vehicle_id:null as string|null,part_name:'',oem_number:'',preferred_colour:'',condition_notes:'Used OEM preferred',required_by:'',delivery_country_code:'AU',delivery_state_region:'',delivery_city:'',notes:''})
const saving=ref(false), errorMessage=ref('')

onMounted(()=>loadProfile())

const submit=async()=>{
  errorMessage.value=''
  await loadProfile()
  const userId=await resolveUserId()
  if(!isValidUuid(userId)){errorMessage.value='Your login session is not ready. Please sign out and sign in again.';return}

  saving.value=true
  const {data,error}=await supabase.from('wanted_requests').insert({
    repairer_company_id:null,
    vehicle_id:isValidUuid(form.vehicle_id)?form.vehicle_id:null,
    part_name:form.part_name,
    oem_number:form.oem_number||null,
    preferred_colour:form.preferred_colour||null,
    condition_notes:form.condition_notes||null,
    required_by:form.required_by||null,
    delivery_country_code:form.delivery_country_code||'AU',
    delivery_state_region:form.delivery_state_region||null,
    delivery_city:form.delivery_city||null,
    notes:form.notes||null,
    requester_name:profile.value?.full_name||null,
    created_by:userId,
    status:'open'
  }).select('id').single()
  saving.value=false

  if(error){errorMessage.value=error.message;return}
  await navigateTo(`/consumer/wanted/${data.id}`)
}
</script>

<template>
<section class="section"><div class="container" style="max-width:900px">
  <div class="kicker">Private owner parts request</div><h1 class="page-title">Create Wanted Request</h1>
  <p class="muted">No company details are required. Approved suppliers can respond with an offer.</p>
  <div v-if="errorMessage" class="notice error">{{errorMessage}}</div>
  <form class="card" style="padding:24px;margin-top:22px" @submit.prevent="submit">
    <div class="form-section"><div class="form-section-title">Vehicle</div><VehicleSelector v-model="form.vehicle_id" required/></div>
    <div class="grid grid-2">
      <div><label class="label">Part needed</label><input v-model="form.part_name" required class="input" placeholder="Left rear door"></div>
      <div><label class="label">OEM / part number</label><input v-model="form.oem_number" class="input"></div>
      <div><label class="label">Preferred colour</label><input v-model="form.preferred_colour" class="input"></div>
      <div><label class="label">Condition</label><input v-model="form.condition_notes" class="input"></div>
      <div><label class="label">Required by</label><input v-model="form.required_by" class="input" type="date"></div>
      <div><label class="label">Country</label><input v-model="form.delivery_country_code" maxlength="2" class="input"></div>
      <div><label class="label">State / region</label><input v-model="form.delivery_state_region" class="input"></div>
      <div><label class="label">Delivery city</label><input v-model="form.delivery_city" class="input"></div>
    </div>
    <div style="margin-top:18px"><label class="label">Notes</label><textarea v-model="form.notes" class="textarea" rows="5"></textarea></div>
    <button :disabled="saving" class="btn btn-primary" style="margin-top:18px">{{saving?'Publishing…':'Publish Wanted Request'}}</button>
  </form>
</div></section>
</template>
