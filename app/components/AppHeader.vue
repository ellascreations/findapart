<script setup lang="ts">
const route = useRoute()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { profile, loadProfile, clearProfile } = useProfile()
watch(user, async v => { if (v) await loadProfile(); else clearProfile() }, { immediate:true })
const nav = computed(()=>{
  const items:any[]=[{to:'/search',label:'Find Parts'}]
  if (profile.value?.role === 'repairer') items.push({to:'/repairer/dashboard',label:'Repairer'})
  if (profile.value?.role === 'supplier') items.push({to:'/supplier/dashboard',label:'Supplier'})
  if (['admin','superadmin'].includes(profile.value?.role)) items.push({to:'/admin',label:'Admin'})
  return items
})
const logout=async()=>{ await supabase.auth.signOut(); clearProfile(); await navigateTo('/') }
</script>
<template><header style="position:sticky;top:0;z-index:20;background:rgba(7,17,31,.92);backdrop-filter:blur(14px);border-bottom:1px solid var(--line);"><div class="container" style="min-height:76px;display:flex;align-items:center;gap:22px;"><NuxtLink to="/" style="display:flex;align-items:center;gap:12px;font-weight:950;font-size:22px;margin-right:auto;"><span style="width:38px;height:38px;border-radius:12px;background:var(--accent);color:#111827;display:grid;place-items:center;font-weight:950;">F</span>FIND A PART</NuxtLink><nav style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;"><NuxtLink v-for="item in nav" :key="item.to" :to="item.to" class="btn" :class="route.path.startsWith(item.to) ? 'btn-primary' : 'btn-secondary'" style="min-height:38px;padding:0 12px;">{{item.label}}</NuxtLink><template v-if="user"><NuxtLink to="/account/company" class="btn btn-secondary" style="min-height:38px;padding:0 12px;">Company</NuxtLink><button class="btn btn-secondary" style="min-height:38px;padding:0 12px;" @click="logout">Sign Out</button></template><NuxtLink v-else to="/login" class="btn btn-secondary" style="min-height:38px;padding:0 12px;">Sign In</NuxtLink></nav></div></header></template>
