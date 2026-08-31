<script setup lang="ts">
definePageMeta({ middleware: ['auth','supplier'] })
const supabase = useSupabaseClient()
const { company, loadProfile, resolveUserId } = useProfile()
const form = reactive({
  title:'', vehicle_id:null as string|null, vehicle_year:'' as number|string, vehicle_make:'', vehicle_model:'', vehicle_variant:'',
  category:'Body', condition:'used', oem_number:'', colour:'', price:'', currency:'AUD', quantity:1,
  country_code:'AU', state_region:'', city:'', description:'', status:'active'
})
const files=ref<File[]>([]), compatibility=ref<string[]>([]), loading=ref(false), errorMessage=ref('')
onMounted(loadProfile)
const onFiles=(e:any)=>files.value=Array.from(e.target.files||[])
const onVehicle=(v:any)=>{
  form.vehicle_id=v.vehicleId
  form.vehicle_year=v.year || ''
  form.vehicle_make=v.makeName
  form.vehicle_model=v.modelName
  form.vehicle_variant=[v.series,v.variant,v.bodyType,v.engine].filter(Boolean).join(' · ')
}
const submit=async()=>{loading.value=true;errorMessage.value='';try{
 const userId=await resolveUserId()
 if(!isValidUuid(userId)) throw new Error('Unable to verify your signed-in session. Please reload the page and try again.')
 if(!isValidUuid(company.value?.id)) throw new Error('Complete your company profile before adding parts.')
 if(!isValidUuid(form.vehicle_id)) throw new Error('Select a valid vehicle from the structured vehicle catalogue.')
 const payload:any={...form,vehicle_year:form.vehicle_year?Number(form.vehicle_year):null,price:form.price?Number(form.price):null,quantity:Number(form.quantity||0),seller_company_id:company.value.id,created_by:userId}
 const {data:part,error}=await supabase.from('parts').insert(payload).select('id').single(); if(error) throw error
 const fitmentIds=Array.from(new Set([form.vehicle_id,...compatibility.value].filter(isValidUuid)))
 if(fitmentIds.length){const {error:fitErr}=await supabase.from('part_compatibility').insert(fitmentIds.map(vehicle_id=>({part_id:part.id,vehicle_id}))); if(fitErr) throw fitErr}
 for(let i=0;i<files.value.length;i++){const file=files.value[i]; const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'-'); const path=`${userId}/${part.id}/${Date.now()}-${i}-${safe}`; const {error:upErr}=await supabase.storage.from('part-images').upload(path,file); if(upErr) throw upErr; const url=supabase.storage.from('part-images').getPublicUrl(path).data.publicUrl; const {error:imgErr}=await supabase.from('part_images').insert({part_id:part.id,image_url:url,sort_order:i}); if(imgErr) throw imgErr}
 await navigateTo('/supplier/parts')
 }catch(e:any){errorMessage.value=e.message||'Unable to save listing.'}finally{loading.value=false}}
</script>
<template><section class="section"><div class="container" style="max-width:900px;"><div class="kicker">Supplier inventory</div><h1 class="page-title" style="margin-top:8px;">Add a Part</h1><form class="card" style="padding:24px;margin-top:22px;" @submit.prevent="submit"><div v-if="errorMessage" class="notice error">{{errorMessage}}</div><div class="grid grid-2"><div><label class="label">Part title</label><input v-model="form.title" required class="input" placeholder="Left Front Door Assembly"></div><div><label class="label">OEM / Part Number</label><input v-model="form.oem_number" class="input" placeholder="67002-0K151"></div></div><div class="form-section"><div class="form-section-title">Vehicle</div><VehicleSelector v-model="form.vehicle_id" required @selection="onVehicle" /></div><div class="form-section"><div class="form-section-title">Compatible Vehicles</div><p class="muted">Add any other vehicles this exact part is known to fit. The donor vehicle above is included automatically.</p><CompatibilitySelector v-model="compatibility" :exclude-vehicle-id="form.vehicle_id" /></div><div class="grid grid-2"><div><label class="label">Category</label><input v-model="form.category" class="input" placeholder="Body"></div><div><label class="label">Condition</label><select v-model="form.condition" class="select"><option value="new">New</option><option value="used">Used</option><option value="refurbished">Refurbished</option><option value="aftermarket">Aftermarket</option></select></div><div><label class="label">Colour</label><input v-model="form.colour" class="input"></div><div><label class="label">Price</label><input v-model="form.price" class="input" type="number" min="0" step="0.01"></div><div><label class="label">Currency</label><input v-model="form.currency" class="input" maxlength="3"></div><div><label class="label">Quantity</label><input v-model="form.quantity" class="input" type="number" min="0"></div><div><label class="label">City</label><input v-model="form.city" class="input"></div><div><label class="label">State / Region</label><input v-model="form.state_region" class="input"></div><div><label class="label">Country code</label><input v-model="form.country_code" class="input" maxlength="2"></div><div><label class="label">Status</label><select v-model="form.status" class="select"><option value="active">Active</option><option value="draft">Draft</option></select></div></div><div style="margin-top:18px;"><label class="label">Photos</label><input class="input" type="file" accept="image/*" multiple @change="onFiles"><div class="muted" style="margin-top:7px;">{{files.length}} image(s) selected</div></div><div style="margin-top:18px;"><label class="label">Description</label><textarea v-model="form.description" class="textarea" rows="5"></textarea></div><button class="btn btn-primary" style="margin-top:18px;" :disabled="loading">{{loading?'Saving Listing…':'Save Listing'}}</button></form></div></section></template>
