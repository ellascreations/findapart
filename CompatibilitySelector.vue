<script setup lang="ts">
type Fitment = {
  id: string
  year: number | null
  make: string
  model: string
  detail: string
}

const props = withDefaults(defineProps<{
  modelValue?: string[]
  excludeVehicleId?: string | null
}>(), { modelValue: () => [], excludeVehicleId: null })

const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>()
const supabase = useSupabaseClient()
const selectedVehicleId = ref<string | null>(null)
const pending = ref<any>(null)
const fitments = ref<Fitment[]>([])
const errorMessage = ref('')

const label = (f:Fitment) => [f.year, f.make, f.model, f.detail].filter(Boolean).join(' ')

const loadExisting = async () => {
  const ids = (props.modelValue || []).filter(isValidUuid)
  if (!ids.length) { fitments.value = []; return }
  const { data, error } = await supabase
    .from('vehicles')
    .select('id,year,series,variant,body_type,engine,vehicle_makes(name),vehicle_models(name)')
    .in('id', ids)
  if (error) { errorMessage.value = error.message; return }
  fitments.value = (data || []).map((v:any) => ({
    id: v.id,
    year: v.year,
    make: v.vehicle_makes?.name || '',
    model: v.vehicle_models?.name || '',
    detail: [v.series, v.variant, v.body_type, v.engine].filter(Boolean).join(' · ')
  }))
}

const onSelection = (v:any) => { pending.value = v }
const add = () => {
  errorMessage.value = ''
  const id = selectedVehicleId.value
  if (!isValidUuid(id)) { errorMessage.value = 'Select a full vehicle variant first.'; return }
  if (id === props.excludeVehicleId) { errorMessage.value = 'That is already the donor vehicle.'; return }
  if (fitments.value.some(x => x.id === id)) { errorMessage.value = 'That vehicle is already in the compatibility list.'; return }
  fitments.value.push({
    id,
    year: pending.value?.year || null,
    make: pending.value?.makeName || '',
    model: pending.value?.modelName || '',
    detail: [pending.value?.series,pending.value?.variant,pending.value?.bodyType,pending.value?.engine].filter(Boolean).join(' · ')
  })
  emit('update:modelValue', fitments.value.map(x => x.id))
  selectedVehicleId.value = null
  pending.value = null
}
const remove = (id:string) => {
  fitments.value = fitments.value.filter(x => x.id !== id)
  emit('update:modelValue', fitments.value.map(x => x.id))
}

onMounted(loadExisting)
watch(() => props.modelValue, loadExisting, { deep:true })
</script>

<template>
  <div>
    <div class="grid grid-2" style="align-items:end;">
      <div>
        <VehicleSelector v-model="selectedVehicleId" @selection="onSelection" />
      </div>
      <div style="padding-bottom:2px;">
        <button type="button" class="btn btn-secondary" @click="add">+ Add Compatible Vehicle</button>
      </div>
    </div>
    <div v-if="errorMessage" class="notice error" style="margin-top:12px;">{{errorMessage}}</div>
    <div v-if="fitments.length" style="display:grid;gap:10px;margin-top:16px;">
      <div v-for="f in fitments" :key="f.id" class="card" style="padding:12px 14px;display:flex;justify-content:space-between;gap:15px;align-items:center;">
        <div><strong>{{ label(f) }}</strong></div>
        <button type="button" class="btn btn-danger small-btn" @click="remove(f.id)">Remove</button>
      </div>
    </div>
    <div v-else class="muted" style="margin-top:12px;">No additional compatible vehicles added.</div>
  </div>
</template>
