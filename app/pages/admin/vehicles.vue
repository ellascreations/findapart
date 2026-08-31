<script setup lang="ts">
definePageMeta({ middleware: ['admin'] })
const supabase = useSupabaseClient()
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const rows = ref<any[]>([])
const importCount = ref(0)
const enrichProgress = reactive({ active:false, processed:0, total:0, batch:0, batches:0, matched:0, inserted:0, updated:0, skipped:0 })
const enrichMessage = ref('')
const searchText = ref('')
const unmatchedRows = ref<any[]>([])
const unmatchedLoading = ref(false)
const resolvingUnmatched = reactive<Record<string,boolean>>({})
const modelSearch = reactive<Record<string,string>>({})
const modelMatches = reactive<Record<string,any[]>>({})

const loadUnmatched = async () => {
  unmatchedLoading.value = true
  const { data, error } = await supabase
    .from('vehicle_enrichment_unmatched')
    .select('id,source,year,make,model,variant,reason,status,first_seen_at,last_seen_at')
    .eq('status','pending')
    .order('last_seen_at',{ascending:false})
    .limit(200)
  if (error) errorMessage.value = error.message
  else unmatchedRows.value = data || []
  unmatchedLoading.value = false
}

const searchModelsForUnmatched = async (item:any) => {
  const term = (modelSearch[item.id] || item.model || '').trim()
  if (!term) return
  const { data, error } = await supabase
    .from('vehicle_models')
    .select('id,name,make_id,vehicle_makes(name)')
    .ilike('name', `%${term}%`)
    .limit(25)
  if (error) errorMessage.value = error.message
  else modelMatches[item.id] = data || []
}

const resolveUnmatched = async (item:any, action:'create_base'|'map'|'ignore', targetModelId?:number) => {
  errorMessage.value = ''; successMessage.value = ''
  resolvingUnmatched[item.id] = true
  try {
    const { data, error } = await supabase.rpc('resolve_vehicle_enrichment_unmatched', {
      p_id: item.id, p_action: action, p_target_model_id: targetModelId || null
    })
    if (error) {
      const details = [error.message, error.code ? `(${error.code})` : '', error.details || '', error.hint || ''].filter(Boolean).join(' · ')
      errorMessage.value = `Unable to resolve ${item.year || ''} ${item.make || ''} ${item.model || ''}: ${details}`
      return
    }
    successMessage.value = action === 'ignore'
      ? `${item.year || ''} ${item.make || ''} ${item.model || ''} ignored.`
      : `${item.year || ''} ${item.make || ''} ${item.model || ''} resolved and reprocessed successfully.`
    delete modelMatches[item.id]; delete modelSearch[item.id]
    await Promise.all([loadUnmatched(), load()])
  } finally {
    resolvingUnmatched[item.id] = false
  }
}

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
onMounted(async () => { await Promise.all([load(), loadUnmatched()]) })

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

const normaliseHeader = (value:string) => value
  .replace(/^\uFEFF/, '')
  .trim()
  .toLowerCase()
  .replace(/&/g, 'and')
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '')

const aliasValue = (row:any, aliases:string[]) => {
  for (const key of aliases) {
    const value = row[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') return String(value).trim()
  }
  return ''
}

const importVariantEnrichment = async (event:any) => {
  const file = event.target.files?.[0]
  if (!file) return

  errorMessage.value = ''
  successMessage.value = ''
  enrichMessage.value = ''
  Object.assign(enrichProgress, { active:true, processed:0, total:0, batch:0, batches:0, matched:0, inserted:0, updated:0, skipped:0 })

  try {
    const text = await file.text()
    const lines = text.replace(/^\uFEFF/,'').split(/\r?\n/).filter((x:string)=>x.trim())
    if (lines.length < 2) throw new Error('CSV must contain a header row and at least one vehicle.')

    const headers = parseCsvLine(lines[0]).map(normaliseHeader)
    const rawRows = lines.slice(1).map((line:string) => {
      const vals = parseCsvLine(line)
      const obj:any = {}
      headers.forEach((h:string,i:number)=>obj[h]=vals[i]||'')
      return obj
    })

    const mapped = rawRows.map((r:any) => ({
      year: aliasValue(r, ['year','year_of_manufacture','model_year','variant_year']),
      make: aliasValue(r, ['make','manufacturer','vehicle_make']),
      model: aliasValue(r, ['model','vehicle_model']),
      variant: aliasValue(r, ['variant','variant_name','badge','grade']),
      body_type: aliasValue(r, ['body_type','body','body_style','vehicle_body']),
      model_year: aliasValue(r, ['model_year','model_release_version','modelreleaseversion']),
      engine: aliasValue(r, ['engine','engine_description','engine_type']),
      engine_code: aliasValue(r, ['engine_code']),
      engine_size: aliasValue(r, ['engine_size','engine_displacement','enginedisplacement']),
      transmission: aliasValue(r, ['transmission','transmission_type','gearbox']),
      fuel_type: aliasValue(r, ['fuel_type','fuel','fueltype','motive_power']),
      drive_type: aliasValue(r, ['drive_type','drive','drivetrain']),
      external_source: 'Green Vehicle Guide',
      external_id: aliasValue(r, ['vehicle_display_id','vehicle_id','id'])
    })).filter((r:any)=>r.year && r.make && r.model)

    if (!mapped.length) {
      throw new Error('No usable Year + Make + Model rows were found. Please use a Green Vehicle Guide results CSV.')
    }

    enrichProgress.total = mapped.length
    const batchSize = 100
    enrichProgress.batches = Math.ceil(mapped.length / batchSize)

    for (let i=0;i<mapped.length;i+=batchSize) {
      const batch = mapped.slice(i,i+batchSize)
      enrichProgress.batch = Math.floor(i/batchSize)+1
      enrichMessage.value = `Processing batch ${enrichProgress.batch} of ${enrichProgress.batches}…`

      let result:any = null
      let lastError:any = null
      for (let attempt=1; attempt<=2; attempt++) {
        const { data, error } = await supabase.rpc('enrich_vehicle_catalog', { rows: batch })
        if (!error) { result = data; lastError = null; break }
        lastError = error
      }
      if (lastError) {
        const extra = [lastError.code, lastError.details, lastError.hint].filter(Boolean).join(' · ')
        const message = `Batch ${enrichProgress.batch} failed: ${lastError.message}${extra ? ` (${extra})` : ''}`
        enrichMessage.value = message
        throw new Error(message)
      }

      enrichProgress.processed += batch.length
      enrichProgress.matched += Number(result?.matched || 0)
      enrichProgress.inserted += Number(result?.inserted || 0)
      enrichProgress.updated += Number(result?.updated || 0)
      enrichProgress.skipped += Number(result?.skipped || 0)
    }

    successMessage.value = `Variant enrichment complete: ${enrichProgress.inserted} variant/spec records added, ${enrichProgress.updated} existing records updated, ${enrichProgress.skipped} unmatched/skipped.`
    enrichMessage.value = 'Complete.'
    await Promise.all([load(), loadUnmatched()])
  } catch(e:any) {
    errorMessage.value = e.message || 'Unable to enrich vehicle catalogue.'
    enrichMessage.value = 'Stopped.'
  } finally {
    enrichProgress.active = false
    event.target.value = ''
  }
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


  <div class="card" style="margin-top:24px;padding:22px;">
    <h2 style="margin-top:0;">Green Vehicle Guide Variant Enrichment</h2>
    <p class="muted">Upload a CSV exported from the Australian Government Green Vehicle Guide. Find a Part matches each row to the existing Year → Make → Model catalogue, then adds the available Variant/Badge, Body, Engine, Transmission, Fuel and Drive details. Base catalogue vehicles are retained.</p>
    <div class="code-sample">Recognised headings include: Year, Make/Manufacturer, Model, Variant/Badge, Body, Engine, Transmission, Fuel type and Drive. Extra Green Vehicle Guide columns are safely ignored.</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px;align-items:center;">
      <label class="btn btn-secondary" :style="enrichProgress.active ? 'opacity:.6;pointer-events:none;' : 'cursor:pointer;'">
        <input type="file" accept=".csv,text/csv" style="display:none" :disabled="enrichProgress.active" @change="importVariantEnrichment">
        {{ enrichProgress.active ? 'Importing Variants…' : 'Choose Green Vehicle Guide CSV' }}
      </label>
      <span v-if="enrichMessage" class="muted">{{ enrichMessage }}</span>
    </div>

    <div v-if="enrichProgress.total" style="margin-top:18px;">
      <div style="height:10px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden;">
        <div :style="`height:100%;width:${Math.round((enrichProgress.processed/enrichProgress.total)*100)}%;background:currentColor;transition:width .2s;`"></div>
      </div>
      <div class="muted" style="margin-top:10px;display:flex;gap:16px;flex-wrap:wrap;">
        <span>{{ enrichProgress.processed.toLocaleString() }} / {{ enrichProgress.total.toLocaleString() }} processed</span>
        <span>Batch {{ enrichProgress.batch }} / {{ enrichProgress.batches }}</span>
        <span>Matched {{ enrichProgress.matched.toLocaleString() }}</span>
        <span>Added {{ enrichProgress.inserted.toLocaleString() }}</span>
        <span>Updated {{ enrichProgress.updated.toLocaleString() }}</span>
        <span>Skipped {{ enrichProgress.skipped.toLocaleString() }}</span>
      </div>
    </div>
  </div>

  <div class="card" style="margin-top:24px;overflow:hidden;">
    <div style="padding:20px;display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;">
      <div>
        <h2 style="margin:0 0 6px;">Unmatched Vehicle Review</h2>
        <div class="muted">Rows skipped during enrichment are kept here until you create the missing base vehicle, map them to an existing model, or ignore them.</div>
      </div>
      <button class="btn btn-secondary" :disabled="unmatchedLoading" @click="loadUnmatched">{{ unmatchedLoading ? 'Refreshing…' : 'Refresh' }}</button>
    </div>
    <div v-if="!unmatchedRows.length" class="muted" style="padding:0 20px 20px;">No pending unmatched vehicles.</div>
    <div v-else class="table-wrap">
      <table>
        <thead><tr><th>Vehicle</th><th>Variant</th><th>Reason</th><th>Map to existing model</th><th>Actions</th></tr></thead>
        <tbody>
          <tr v-for="item in unmatchedRows" :key="item.id">
            <td><strong>{{ item.year || '—' }} {{ item.make || '—' }} {{ item.model || '—' }}</strong><div class="muted">{{ item.source }}</div></td>
            <td>{{ item.variant || '—' }}</td>
            <td><span class="badge">{{ item.reason }}</span></td>
            <td style="min-width:260px;">
              <div style="display:flex;gap:6px;">
                <input v-model="modelSearch[item.id]" class="input" :placeholder="item.model || 'Search model'" @keyup.enter="searchModelsForUnmatched(item)">
                <button class="btn btn-secondary small-btn" @click="searchModelsForUnmatched(item)">Find</button>
              </div>
              <div v-if="modelMatches[item.id]?.length" style="margin-top:6px;display:grid;gap:5px;">
                <button v-for="m in modelMatches[item.id]" :key="m.id" class="btn btn-secondary small-btn" style="text-align:left;" @click="resolveUnmatched(item,'map',m.id)">
                  {{ m.vehicle_makes?.name }} → {{ m.name }}
                </button>
              </div>
            </td>
            <td>
              <div style="display:flex;gap:6px;flex-wrap:wrap;">
                <button class="btn btn-primary small-btn" :disabled="resolvingUnmatched[item.id]" @click="resolveUnmatched(item,'create_base')">{{ resolvingUnmatched[item.id] ? 'Creating + Reprocessing…' : 'Create Base + Reprocess' }}</button>
                <button class="btn btn-secondary small-btn" :disabled="resolvingUnmatched[item.id]" @click="resolveUnmatched(item,'ignore')">Ignore</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
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
