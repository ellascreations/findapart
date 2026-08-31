<script setup lang="ts">
definePageMeta({ middleware: ['admin'] })
const supabase = useSupabaseClient()
const { profile: me, loadProfile } = useProfile()
const rows = ref<any[]>([]); const loading=ref(true); const q=ref(''); const errorMessage=ref(''); const successMessage=ref('')
const isSuper = computed(()=>me.value?.role==='superadmin')
const load = async()=>{ loading.value=true; errorMessage.value=''; await loadProfile(); const {data,error}=await supabase.from('profiles').select('id,full_name,email,role,account_status,created_at,companies(id,name,type,approved)').order('created_at',{ascending:false}); if(error) errorMessage.value=error.message; rows.value=data||[]; loading.value=false }
const filtered=computed(()=>{const s=q.value.trim().toLowerCase(); if(!s)return rows.value; return rows.value.filter(r=>[r.full_name,r.email,r.role,r.companies?.name].some(v=>String(v||'').toLowerCase().includes(s)))})
const setRole=async(row:any, role:string)=>{errorMessage.value=''; successMessage.value=''; const {error}=await supabase.rpc('admin_set_user_role',{p_user_id:row.id,p_role:role}); if(error){errorMessage.value=error.message;return} successMessage.value='Role updated.'; await load()}
const setStatus=async(row:any,status:string)=>{errorMessage.value=''; successMessage.value=''; const {error}=await supabase.rpc('admin_set_user_status',{p_user_id:row.id,p_status:status}); if(error){errorMessage.value=error.message;return} successMessage.value='Account status updated.'; await load()}
onMounted(load)
</script>
<template><section class="section"><div class="container">
<div style="display:flex;justify-content:space-between;gap:16px;align-items:end;flex-wrap:wrap"><div><div class="kicker">Administration</div><h1 class="page-title">Users</h1></div><NuxtLink class="btn btn-secondary" to="/admin">← Dashboard</NuxtLink></div>
<div v-if="errorMessage" class="notice error">{{errorMessage}}</div><div v-if="successMessage" class="notice success">{{successMessage}}</div>
<div class="card" style="padding:18px;margin-top:20px"><input v-model="q" class="input" placeholder="Search name, email, company or role"></div>
<div class="card table-wrap" style="margin-top:20px"><table><thead><tr><th>User</th><th>Company</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead><tbody>
<tr v-for="row in filtered" :key="row.id"><td><strong>{{row.full_name||'Unnamed'}}</strong><br><span class="muted">{{row.email||row.id}}</span></td><td>{{row.companies?.name||'—'}}<br><span v-if="row.companies" class="badge">{{row.companies.type}}</span></td><td><span class="badge">{{row.role}}</span></td><td><span class="badge" :style="row.account_status==='suspended'?'color:#ffd0d0':''">{{row.account_status}}</span></td><td>{{new Date(row.created_at).toLocaleDateString()}}</td><td><div v-if="isSuper && row.id!==me?.id" style="display:flex;gap:8px;flex-wrap:wrap"><select class="select" style="width:auto" :value="row.role" @change="setRole(row,($event.target as HTMLSelectElement).value)"><option value="supplier">Supplier</option><option value="repairer">Repairer</option><option value="admin">Admin</option><option value="superadmin">SuperAdmin</option></select><button class="btn small-btn" :class="row.account_status==='active'?'btn-danger':'btn-secondary'" @click="setStatus(row,row.account_status==='active'?'suspended':'active')">{{row.account_status==='active'?'Suspend':'Restore'}}</button></div><span v-else class="muted">{{row.id===me?.id?'Current account':'SuperAdmin only'}}</span></td></tr>
<tr v-if="!loading&&!filtered.length"><td colspan="6" class="muted">No users found.</td></tr></tbody></table></div>
</div></section></template>
