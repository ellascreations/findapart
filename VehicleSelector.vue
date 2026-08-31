<script setup lang="ts">
type VehicleSelection = {
  year: number | null
  makeId: number | null
  makeName: string
  modelId: number | null
  modelName: string
  vehicleId: string | null
  series: string
  variant: string
  bodyType: string
  engine: string
  transmission: string
  fuelType: string
}

const props = withDefaults(defineProps<{
  modelValue?: string | null
  allowPartial?: boolean
  required?: boolean
}>(), { modelValue: null, allowPartial: false, required: false })

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
  'selection': [value: VehicleSelection]
}>()

const supabase = useSupabaseClient()
const years = ref<number[]>([])
const makes = ref<any[]>([])
const models = ref<any[]>([])
const variants = ref<any[]>([])
const year = ref<number | null>(null)
const makeId = ref<number | null>(null)
const modelId = ref<number | null>(null)
const vehicleId = ref<string | null>(isValidUuid(props.modelValue) ? props.modelValue : null)
const loading = ref(false)
const hydrating = ref(false)

const selectedMake = computed(() => makes.value.find(x => Number(x.id) === Number(makeId.value)))
const selectedModel = computed(() => models.value.find(x => Number(x.id) === Number(modelId.value)))
const selectedVariant = computed(() => variants.value.find(x => x.id === vehicleId.value))
const variantLabel = (v:any) => [v.series, v.variant, v.body_type, v.engine, v.transmission].filter(Boolean).join(' · ') || 'Standard / unspecified'

const currentSelection = (): VehicleSelection => ({
  year: year.value,
  makeId: makeId.value,
  makeName: selectedMake.value?.name || '',
  modelId: modelId.value,
  modelName: selectedModel.value?.name || '',
  vehicleId: vehicleId.value,
  series: selectedVariant.value?.series || '',
  variant: selectedVariant.value?.variant || '',
  bodyType: selectedVariant.value?.body_type || '',
  engine: selectedVariant.value?.engine || '',
  transmission: selectedVariant.value?.transmission || '',
  fuelType: selectedVariant.value?.fuel_type || ''
})

const notify = () => {
  emit('update:modelValue', vehicleId.value)
  emit('selection', currentSelection())
}

const loadYears = async () => {
  const { data, error } = await supabase.rpc('vehicle_year_options')
  if (!error) years.value = (data || []).map((x:any) => Number(x.year))
}

const loadMakes = async () => {
  makes.value = []; models.value = []; variants.value = []
  makeId.value = null; modelId.value = null; vehicleId.value = null
  if (!year.value) { notify(); return }
  const { data } = await supabase.rpc('vehicle_make_options', { selected_year: year.value })
  makes.value = data || []
  notify()
}

const loadModels = async () => {
  models.value = []; variants.value = []
  modelId.value = null; vehicleId.value = null
  if (!year.value || !makeId.value) { notify(); return }
  const { data } = await supabase.rpc('vehicle_model_options', { selected_year: year.value, selected_make_id: makeId.value })
  models.value = data || []
  notify()
}

const loadVariants = async () => {
  variants.value = []; vehicleId.value = null
  if (!year.value || !modelId.value) { notify(); return }
  const { data } = await supabase.rpc('vehicle_variant_options', { selected_year: year.value, selected_model_id: modelId.value })
  variants.value = data || []
  if (variants.value.length === 1 && !props.allowPartial) vehicleId.value = variants.value[0].id
  notify()
}

const hydrate = async (id:string) => {
  if (!isValidUuid(id)) {
    vehicleId.value = null
    emit('update:modelValue', null)
    return
  }
  hydrating.value = true
  try {
    const { data } = await supabase
      .from('vehicles')
      .select('id,year,make_id,model_id,series,variant,body_type,engine,transmission,fuel_type,vehicle_makes(name),vehicle_models(name)')
      .eq('id', id)
      .maybeSingle()
    if (!data) return
    year.value = data.year
    await loadMakes()
    makeId.value = data.make_id
    await loadModels()
    modelId.value = data.model_id
    const { data: vs } = await supabase.rpc('vehicle_variant_options', { selected_year: data.year, selected_model_id: data.model_id })
    variants.value = vs || []
    vehicleId.value = data.id
    notify()
  } finally { hydrating.value = false }
}

onMounted(async () => {
  loading.value = true
  await loadYears()
  if (isValidUuid(props.modelValue)) await hydrate(props.modelValue)
  loading.value = false
})

watch(() => props.modelValue, async (value) => {
  if (value && isValidUuid(value) && value !== vehicleId.value && !hydrating.value) await hydrate(value)
  if ((!value || !isValidUuid(value)) && vehicleId.value && !hydrating.value) {
    vehicleId.value = null
    emit('update:modelValue', null)
  }
})
</script>

<template>
  <div class="vehicle-selector">
    <div v-if="loading" class="muted">Loading vehicle catalogue…</div>
    <div v-else class="grid grid-2">
      <div>
        <label class="label">Year</label>
        <select v-model="year" class="select" :required="required" @change="loadMakes">
          <option :value="null">Select year</option>
          <option v-for="item in years" :key="item" :value="item">{{ item }}</option>
        </select>
      </div>
      <div>
        <label class="label">Make</label>
        <select v-model="makeId" class="select" :disabled="!year" :required="required" @change="loadModels">
          <option :value="null">Select make</option>
          <option v-for="item in makes" :key="item.id" :value="item.id">{{ item.name }}</option>
        </select>
      </div>
      <div>
        <label class="label">Model</label>
        <select v-model="modelId" class="select" :disabled="!makeId" :required="required" @change="loadVariants">
          <option :value="null">Select model</option>
          <option v-for="item in models" :key="item.id" :value="item.id">{{ item.name }}</option>
        </select>
      </div>
      <div>
        <label class="label">Series / Variant / Body / Engine</label>
        <select v-model="vehicleId" class="select" :disabled="!modelId" :required="required && !allowPartial" @change="notify">
          <option :value="null">{{ allowPartial ? 'Any variant' : 'Select vehicle variant' }}</option>
          <option v-for="item in variants" :key="item.id" :value="item.id">{{ variantLabel(item) }}</option>
        </select>
      </div>
    </div>
    <div v-if="year && makeId && modelId && !variants.length" class="notice" style="margin-bottom:0;">
      No variants are loaded for this vehicle yet. An administrator can add or import it from the Vehicle Catalogue.
    </div>
  </div>
</template>
