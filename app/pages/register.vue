<script setup lang="ts">
const supabase = useSupabaseClient()
const form = reactive({full_name:'',company_name:'',email:'',role:'consumer',password:'',phone:'',abn:'',address_line1:'',city:'',state_region:'',postcode:'',country_code:'AU'})
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const register = async () => {
  loading.value=true; errorMessage.value=''; successMessage.value=''
  try {
    const { data, error } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/login?confirmed=1`,
        data: { ...form, password: undefined }
      }
    })
    if (error) throw error
    if (data.session) {
      successMessage.value='Account created successfully.'
      await new Promise(r=>setTimeout(r,500))
      return navigateTo(form.role === 'supplier' ? '/supplier/dashboard' : form.role === 'consumer' ? '/consumer/dashboard' : '/repairer/dashboard')
    }
    successMessage.value='Account created. Check your email to confirm your address, then sign in.'
  } catch(e:any){ errorMessage.value=e.message || 'Unable to create account.' } finally { loading.value=false }
}
</script>
<template><section class="section"><div class="container" style="max-width:820px;"><form class="card" style="padding:26px;" @submit.prevent="register"><div class="kicker">Join the network</div><h1>Create an account</h1><div v-if="errorMessage" class="notice error">{{errorMessage}}</div><div v-if="successMessage" class="notice success">{{successMessage}}</div><p v-if="form.role === 'consumer'" class="notice" style="margin-top:14px">For private owners and backyard restorers. No company or business details are required.</p><div class="grid grid-2"><div><label class="label">Your name</label><input v-model="form.full_name" class="input" required></div><div><label class="label">Account type</label><select v-model="form.role" class="select"><option value="consumer">Private Owner / Restorer</option><option value="repairer">Smash Repairer</option><option value="supplier">Parts Supplier</option></select></div><template v-if="form.role !== 'consumer'"><div><label class="label">Company name</label><input v-model="form.company_name" class="input" required></div><div><label class="label">ABN / Business number</label><input v-model="form.abn" class="input"></div></template><div><label class="label">Email</label><input v-model="form.email" class="input" type="email" required></div><template v-if="form.role !== 'consumer'"><div><label class="label">Phone</label><input v-model="form.phone" class="input"></div><div><label class="label">Address</label><input v-model="form.address_line1" class="input"></div><div><label class="label">City</label><input v-model="form.city" class="input"></div><div><label class="label">State / Region</label><input v-model="form.state_region" class="input"></div><div><label class="label">Postcode</label><input v-model="form.postcode" class="input"></div></template></div><div style="margin-top:14px;"><label class="label">Password</label><input v-model="form.password" class="input" type="password" minlength="8" required></div><button class="btn btn-primary" style="width:100%;margin-top:20px;" :disabled="loading">{{loading?'Creating Account…':'Create Account'}}</button></form></div></section></template>
