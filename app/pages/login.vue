<script setup lang="ts">
const supabase = useSupabaseClient()
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')
const route = useRoute()

const login = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })

    if (error) throw error

    const { data: profileRow, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle()

    if (profileError) throw profileError

    if (!profileRow) {
      errorMessage.value = 'Your login is valid, but your Find a Part profile is missing. Run migration 003_repair_existing_accounts.sql in Supabase, then sign in again.'
      await supabase.auth.signOut()
      return
    }

    if (profileRow.role === 'supplier') {
      return navigateTo('/supplier/dashboard')
    }

    if (profileRow.role === 'admin' || profileRow.role === 'superadmin') {
      return navigateTo('/admin')
    }

    return navigateTo('/repairer/dashboard')
  } catch (e: any) {
    errorMessage.value = e.message || 'Unable to sign in.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="section">
    <div class="container" style="max-width:460px;">
      <form class="card" style="padding:26px;" @submit.prevent="login">
        <div class="kicker">Welcome back</div>
        <h1>Sign in to Find a Part</h1>

        <div v-if="route.query.confirmed" class="notice success">
          Your email has been confirmed. You can sign in now.
        </div>

        <div v-if="errorMessage" class="notice error">{{ errorMessage }}</div>

        <div style="margin-top:20px;">
          <label class="label">Email</label>
          <input v-model="email" class="input" type="email" required autocomplete="email">
        </div>

        <div style="margin-top:14px;">
          <label class="label">Password</label>
          <input v-model="password" class="input" type="password" required autocomplete="current-password">
        </div>

        <button class="btn btn-primary" style="width:100%;margin-top:20px;" :disabled="loading">
          {{ loading ? 'Signing In…' : 'Sign In' }}
        </button>

        <p class="muted" style="text-align:center;margin-bottom:0;">
          New here?
          <NuxtLink to="/register" style="color:var(--accent);font-weight:800;">Create an account</NuxtLink>
        </p>
      </form>
    </div>
  </section>
</template>
