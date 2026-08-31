<script setup lang="ts">
definePageMeta({ middleware: ['admin'] })
const supabase = useSupabaseClient()
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const rows = ref<any[]>([])
const importCount = ref(0)
const searchText = ref('')
const form = reactive({
  year:'', make:'', model:'', series:'', variant:'', model_year:'', body_type:'', engine:'', engine_code:'',
  transmission:'', fuel_type:'', drive_type:'', country_code:'AU', external_source:'manual', external_id:''
})

const load = async () => {
  errorMessage.value = ''
  let q = supabase
    .from('vehicles')
    .select('id,year,model_year,series,variant,body_type,engine,transmission,fuel_type,drive_type,country_code,external_source,external_id,active,vehicle_makes(name),vehicle_models(name)')
    .order('created_at', { ascending:false })
    .limit(250)
  const term = searchText.value.trim()
  if (term) q = q.or(`series.ilike.%${term}%,variant.ilike.%${term}%,engine.ilike.%${term}%,external_id.ilike.%${term}%`)
  const { data, error } = await q
  if (error) errorMessage.value = error.message
  else rows.value = data || []
}
onMounted(load)

const addVehicle = async () => {
  loading.value = true; errorMessage.value=''; successMessage.value=''
  try {
    const payload = [{
      year:Number(form.year), make:form.make.trim(), model:form.model.trim(), series:form.series.trim(), variant:form.variant.trim(),
      model_year:form.model_year.trim(), body_type:form.body_type.trim(), engine:form.engine.trim(), engine_code:form.engine_code.trim(),
      transmission:form.transmission.trim(), fuel_type:form.fuel_type.trim(), drive_type:form.drive_type.trim(),
      country_code:(form.country_code || 'AU').trim().toUpperCase(), external_source:(form.external_source || 'manual').trim(), external_id:form.external_id.trim()
    }]
    if (!payload[0].year || !payload[0].make || !payload[0].model) throw new Error('Year, make and model are required.')
    const { data, error } = await supabase.rpc('import_vehicle_catalog', { rows: payload })
    if (error) throw error
    successMessage.value = Number(data) ? 'Vehicle added to the catalogue.' : 'That exact vehicle already exists.'
    Object.assign(form,{year:'',make:'',model:'',series:'',variant:'',model_year:'',body_type:'',engine:'',engine_code:'',transmission:'',fuel_type:'',drive_type:'',country_code:'AU',external_source:'manual',external_id:''})
    await load()
  } catch(e:any) { errorMessage.value=e.message || 'Unable to add vehicle.' }
  finally { loading.value=false }
}

const parseCsvLine = (line:string) => {
  const out:string[]=[]; let cur=''; let quoted=false
  for(let i=0;i<line.length;i++){
    const c=line[i]
    if(c==='"') { if(quoted && line[i+1]==='"'){cur+='"';i++} else quoted=!quoted }
    else if(c===',' && !quoted){out.push(cur.trim());cur=''} else cur+=c
  }
  out.push(cur.trim()); return out
}

const importCsv = async (event:any) => {
  const file = event.target.files?.[0]; if(!file) return
  loading.value=true; errorMessage.value=''; successMessage.value=''; importCount.value=0
  try {
    const text = await file.text()
    const lines = text.replace(/^\uFEFF/,'').split(/\r?\n/).filter((x:string)=>x.trim())
    if(lines.length<2) throw new Error('CSV must contain a header row and at least one vehicle.')
    const headers=parseCsvLine(lines[0]).map((x:string)=>x.toLowerCase().replace(/[\s-]+/g,'_'))
    const required=['year','make','model']; for(const h of required) if(!headers.includes(h)) throw new Error(`Missing required CSV column: ${h}`)
    const dataRows=lines.slice(1).map((line:string)=>{const vals=parseCsvLine(line);const obj:any={};headers.forEach((h:string,i:number)=>obj[h]=vals[i]||'');return obj})
    const batchSize=500
    let total=0
    for(let i=0;i<dataRows.length;i+=batchSize){
      const batch=dataRows.slice(i,i+batchSize)
      const {data,error}=await supabase.rpc('import_vehicle_catalog',{rows:batch})
      if(error) throw error
      total += Number(data||0)
    }
    importCount.value=total
    successMessage.value=`Import complete: ${total} new vehicle records added from ${dataRows.length} CSV rows.`
    await load()
  } catch(e:any){errorMessage.value=e.message||'Unable to import CSV.'}
  finally{loading.value=false;event.target.value=''}
}

const setActive = async (item:any, active:boolean) => {
  if(!isValidUuid(item?.id)){errorMessage.value='Invalid vehicle ID.';return}
  const { error } = await supabase.from('vehicles').update({active,updated_at:new Date().toISOString()}).eq('id',item.id)
  if(error) errorMessage.value=error.message; else await load()
}
</script>

<template>
<section class="section"><div class="container">
  <div class="kicker">Find a Part administration</div>
  <div style="display:flex;align-items:end;justify-content:space-between;gap:16px;flex-wrap:wrap;">
    <div><h1 class="page-title" style="margin-top:8px;">Vehicle Catalogue</h1><p class="muted">Manage Year → Make → Model → Series → Badge/Variant records and external provider IDs.</p></div>
    <NuxtLink to="/admin" class="btn btn-secondary">← Admin Dashboard</NuxtLink>
  </div>

  <div v-if="successMessage" class="notice success">{{successMessage}}</div>
  <div v-if="errorMessage" class="notice error">{{errorMessage}}</div>

  <div class="grid grid-2" style="margin-top:24px;align-items:start;">
    <form class="card" style="padding:22px;" @submit.prevent="addVehicle">
      <h2 style="margin-top:0;">Add Vehicle</h2>
      <div class="grid grid-2">
        <div><label class="label">Year</label><input v-model="form.year" class="input" type="number" min="1900" max="2100" required></div>
        <div><label class="label">Model year</label><input v-model="form.model_year" class="input" placeholder="MY24"></div>
        <div><label class="label">Make</label><input v-model="form.make" class="input" required placeholder="Toyota"></div>
        <div><label class="label">Model</label><input v-model="form.model" class="input" required placeholder="Hilux"></div>
        <div><label class="label">Series / Generation</label><input v-model="form.series" class="input" placeholder="GUN126R"></div>
        <div><label class="label">Badge / Variant</label><input v-model="form.variant" class="input" placeholder="SR5"></div>
        <div><label class="label">Body type</label><input v-model="form.body_type" class="input" placeholder="Dual Cab Ute"></div>
        <div><label class="label">Engine</label><input v-model="form.engine" class="input" placeholder="2.8L Turbo Diesel"></div>
        <div><label class="label">Engine code</label><input v-model="form.engine_code" class="input" placeholder="1GD-FTV"></div>
        <div><label class="label">Transmission</label><input v-model="form.transmission" class="input" placeholder="6-speed Automatic"></div>
        <div><label class="label">Fuel type</label><input v-model="form.fuel_type" class="input" placeholder="Diesel"></div>
        <div><label class="label">Drive type</label><input v-model="form.drive_type" class="input" placeholder="4x4 Dual Range"></div>
        <div><label class="label">Country</label><input v-model="form.country_code" class="input" maxlength="2" placeholder="AU"></div>
        <div><label class="label">Data source</label><input v-model="form.external_source" class="input" placeholder="manual / redbook / autograb"></div>
        <div style="grid-column:1/-1;"><label class="label">Provider vehicle ID</label><input v-model="form.external_id" class="input" placeholder="Optional external catalogue ID"></div>
      </div>
      <button class="btn btn-primary" style="margin-top:18px;" :disabled="loading">{{loading?'Saving…':'Add Vehicle'}}</button>
    </form>

    <div class="card" style="padding:22px;">
      <h2 style="margin-top:0;">Bulk CSV Import</h2>
      <p class="muted">Required columns: <strong>year, make, model</strong>. Optional fields let us import richer Australian catalogue data now and map RedBook, AutoGrab or another provider later.</p>
      <div class="code-sample">year,make,model,series,variant,model_year,body_type,engine,engine_code,transmission,fuel_type,drive_type,country_code,external_source,external_id<br>2024,Toyota,Hilux,GUN126R,SR5,MY24,Dual Cab Ute,2.8L Turbo Diesel,1GD-FTV,Automatic,Diesel,4x4,AU,manual,</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px;"><label class="btn btn-secondary" style="cursor:pointer;"><input type="file" accept=".csv,text/csv" style="display:none" @change="importCsv">Choose CSV File</label><a href="/templates/vehicle-catalogue-import.csv" class="btn btn-secondary" download>Download CSV Template</a></div>
      <div v-if="importCount" class="muted" style="margin-top:12px;">{{importCount}} records added.</div>
    </div>
  </div>

  <div class="card" style="margin-top:24px;overflow:hidden;">
    <div style="padding:20px;display:flex;gap:12px;align-items:end;justify-content:space-between;flex-wrap:wrap;">
      <div><h2 style="margin:0 0 6px;">Latest Catalogue Records</h2><div class="muted">Showing the newest 250 records.</div></div>
      <div style="display:flex;gap:8px;"><input v-model="searchText" class="input" placeholder="Series, badge, engine or provider ID" @keyup.enter="load"><button class="btn btn-secondary" @click="load">Search</button></div>
    </div>
    <div class="table-wrap"><table><thead><tr><th>Year</th><th>Make</th><th>Model</th><th>Series / Badge</th><th>Body / Engine</th><th>Source</th><th>Status</th><th></th></tr></thead>
    <tbody><tr v-for="item in rows" :key="item.id"><td>{{item.year}}</td><td>{{item.vehicle_makes?.name}}</td><td>{{item.vehicle_models?.name}}</td><td>{{[item.series,item.variant].filter(Boolean).join(' / ')||'—'}}</td><td>{{[item.body_type,item.engine].filter(Boolean).join(' · ')||'—'}}</td><td>{{item.external_source||'manual'}}<div v-if="item.external_id" class="muted">{{item.external_id}}</div></td><td><span class="badge">{{item.active?'Active':'Inactive'}}</span></td><td><button class="btn btn-secondary small-btn" @click="setActive(item,!item.active)">{{item.active?'Disable':'Enable'}}</button></td></tr></tbody></table></div>
  </div>
</div></section>
</template>
