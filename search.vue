<script setup lang="ts">
const supabase=useSupabaseClient(); const route=useRoute()
const initialVehicle = typeof route.query.vehicle === 'string' && isValidUuid(route.query.vehicle) ? route.query.vehicle : null
const filters=reactive({
  keyword:typeof route.query.part === 'string' ? route.query.part : '',
  vehicle_id:initialVehicle as string|null,
  year:null as number|null, make:'', model:'', condition:'', country:'', category:'',
  min_price:'', max_price:'', sort:'newest'
})
const listings=ref<any[]>([]); const loading=ref(false); const errorMessage=ref('')
const onVehicle=(v:any)=>{filters.vehicle_id=v.vehicleId;filters.year=v.year;filters.make=v.makeName;filters.model=v.modelName}

const search=async()=>{loading.value=true;errorMessage.value='';try{
 let compatibleIds:string[]|null=null
 if(filters.vehicle_id && isValidUuid(filters.vehicle_id)){
   const {data,error}=await supabase.rpc('compatible_part_ids',{selected_vehicle:filters.vehicle_id})
   if(error)throw error
   compatibleIds=(data||[]).map((x:any)=>x.part_id).filter(isValidUuid)
   if(!compatibleIds.length){listings.value=[];return}
 }
 let q=supabase.from('parts').select('id,title,vehicle_id,vehicle_year,vehicle_make,vehicle_model,vehicle_variant,category,condition,price,currency,city,state_region,country_code,quantity,oem_number,companies!parts_seller_company_id_fkey(name,logo_url),part_images(image_url,sort_order)').eq('status','active').gt('quantity',0)
 if(filters.keyword){const safe=filters.keyword.replace(/[,%()]/g,' ').trim(); if(safe) q=q.or(`title.ilike.%${safe}%,oem_number.ilike.%${safe}%,description.ilike.%${safe}%`)}
 if(compatibleIds) q=q.in('id',compatibleIds)
 else { if(filters.year)q=q.eq('vehicle_year',filters.year); if(filters.make)q=q.eq('vehicle_make',filters.make); if(filters.model)q=q.eq('vehicle_model',filters.model) }
 if(filters.condition)q=q.eq('condition',filters.condition)
 if(filters.category)q=q.ilike('category',`%${filters.category}%`)
 if(filters.country)q=q.ilike('country_code',filters.country.trim())
 if(filters.min_price!=='')q=q.gte('price',Number(filters.min_price))
 if(filters.max_price!=='')q=q.lte('price',Number(filters.max_price))
 if(filters.sort==='price_low')q=q.order('price',{ascending:true,nullsFirst:false})
 else if(filters.sort==='price_high')q=q.order('price',{ascending:false,nullsFirst:false})
 else q=q.order('created_at',{ascending:false})
 const {data,error}=await q.limit(100);if(error)throw error;listings.value=data||[]
 }catch(e:any){errorMessage.value=e.message||'Unable to search parts.'}finally{loading.value=false}}
onMounted(search)
const clearFilters=()=>{Object.assign(filters,{keyword:'',vehicle_id:null,year:null,make:'',model:'',condition:'',country:'',category:'',min_price:'',max_price:'',sort:'newest'});search()}
const vehicle=(p:any)=>[p.vehicle_year,p.vehicle_make,p.vehicle_model,p.vehicle_variant].filter(Boolean).join(' ')
const firstImage=(p:any)=>[...(p.part_images||[])].sort((a:any,b:any)=>a.sort_order-b.sort_order)[0]?.image_url
</script>
<template><section class="section"><div class="container"><div class="kicker">Marketplace search</div><h1 class="page-title" style="margin-top:8px;">Find a Part</h1>
<form class="card" style="padding:20px;margin-top:22px;" @submit.prevent="search">
<div class="grid grid-3">
<div><label class="label">Keyword / OEM Part Number</label><input v-model="filters.keyword" class="input" placeholder="Door, bumper, 67002-0K151"></div>
<div><label class="label">Category</label><input v-model="filters.category" class="input" placeholder="Body, Lighting, Engine"></div>
<div><label class="label">Condition</label><select v-model="filters.condition" class="select"><option value="">Any</option><option value="new">New</option><option value="used">Used</option><option value="refurbished">Refurbished</option><option value="aftermarket">Aftermarket</option></select></div>
<div><label class="label">Country code</label><input v-model="filters.country" class="input" placeholder="AU" maxlength="2"></div>
<div><label class="label">Minimum price</label><input v-model="filters.min_price" class="input" type="number" min="0" step="0.01"></div>
<div><label class="label">Maximum price</label><input v-model="filters.max_price" class="input" type="number" min="0" step="0.01"></div>
</div>
<div class="form-section"><div class="form-section-title">Vehicle Compatibility</div><p class="muted">Choose a vehicle and Find a Part will return donor-vehicle matches plus any listings suppliers have marked as compatible.</p><VehicleSelector v-model="filters.vehicle_id" allow-partial @selection="onVehicle" /></div>
<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:end;"><div style="min-width:220px;"><label class="label">Sort</label><select v-model="filters.sort" class="select"><option value="newest">Newest first</option><option value="price_low">Price: low to high</option><option value="price_high">Price: high to low</option></select></div><button class="btn btn-primary">Search Parts</button><button type="button" class="btn btn-secondary" @click="clearFilters">Clear Filters</button></div>
</form>
<div v-if="errorMessage" class="notice error">{{errorMessage}}</div><div style="display:flex;justify-content:space-between;align-items:center;margin:28px 0 16px;gap:15px;flex-wrap:wrap;"><strong>{{loading?'Searching…':`${listings.length} matches`}}</strong><NuxtLink to="/repairer/wanted/new" class="btn btn-secondary">Can't find it? Create Wanted Request</NuxtLink></div>
<div v-if="!loading&&!listings.length" class="card empty-state"><h2>No matching parts yet</h2><p class="muted">Try a broader vehicle selection or create a wanted request.</p></div>
<div class="grid grid-3"><NuxtLink v-for="item in listings" :key="item.id" :to="`/listings/${item.id}`" class="card" style="overflow:hidden;"><img v-if="firstImage(item)" :src="firstImage(item)" style="height:180px;width:100%;object-fit:cover;"><div v-else class="part-placeholder">◫</div><div style="padding:18px;"><div style="display:flex;gap:8px;flex-wrap:wrap;"><div class="badge">{{item.condition}}</div><div v-if="item.category" class="badge">{{item.category}}</div></div><h3>{{item.title}}</h3><div class="muted">Donor: {{vehicle(item)}}</div><div style="font-size:28px;font-weight:900;margin:18px 0 8px;">{{item.price==null?'Price on request':`$${Number(item.price).toFixed(2)} ${item.currency}`}}</div><div class="muted">{{item.companies?.name||'Supplier'}} · {{[item.city,item.state_region,item.country_code].filter(Boolean).join(', ')}}</div></div></NuxtLink></div>
</div></section></template>
