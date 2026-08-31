<script setup lang="ts">
const supabase = useSupabaseClient()
const route = useRoute()

const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const checkingSession = ref(true)
const recoveryReady = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

let authSubscription: { unsubscribe: () => void } | null = null

const prepareRecoverySession = async () => {
  errorMessage.value = ''

  try {
    if (!import.meta.client) return

    const code = typeof route.query.code === 'string' ? route.query.code : ''

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) throw error
    }

    const { data, error } = await supabase.auth.getSession()
    if (error) throw error

    recoveryReady.value = Boolean(data.session)

    if (!data.session) {
      errorMessage.value = 'This password reset link is invalid or has expired. Please request a new reset link.'
    }
  } catch (e: any) {
    recoveryReady.value = false
    errorMessage.value = e?.message || 'Unable to verify this password reset link.'
  } finally {
    checkingSession.value = false
  }
}

const updatePassword = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (password.value.length < 8) {
    errorMessage.value = 'Your new password must be at least 8 characters long.'
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'The passwords do not match.'
    return
  }

  loading.value = true

  try {
    const { error } = await supabase.auth.updateUser({
      password: password.value,
    })

    if (error) throw error

    successMessage.value = 'Your password has been updated successfully. You can now sign in with your new password.'
    password.value = ''
    confirmPassword.value = ''

    await supabase.auth.signOut()
  } catch (e: any) {
    errorMessage.value = e?.message || 'Unable to update your password.'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY' && session) {
      recoveryReady.value = true
      checkingSession.value = false
      errorMessage.value = ''
    }
  })

  authSubscription = data.subscription
  await prepareRecoverySession()
})

onBeforeUnmount(() => {
  authSubscription?.unsubscribe()
})
</script>

<template>
  <section class="section">
    <div class="container" style="max-width:460px;">
      <div class="card" style="padding:26px;">
        <div class="kicker">Account recovery</div>
        <h1>Set a new password</h1>

        <div v-if="checkingSession" class="notice">
          Verifying your password reset link…
        </div>

        <div v-if="errorMessage" class="notice error">{{ errorMessage }}</div>
        <div v-if="successMessage" class="notice success">{{ successMessage }}</div>

        <form v-if="recoveryReady && !successMessage" @submit.prevent="updatePassword">
          <div style="margin-top:20px;">
            <label class="label">New password</label>
            <input
              v-model="password"
              class="input"
              type="password"
              minlength="8"
              required
              autocomplete="new-password"
            >
          </div>

          <div style="margin-top:14px;">
            <label class="label">Confirm new password</label>
            <input
              v-model="confirmPassword"
              class="input"
              type="password"
              minlength="8"
              required
              autocomplete="new-password"
            >
          </div>

          <button class="btn btn-primary" style="width:100%;margin-top:20px;" :disabled="loading">
            {{ loading ? 'Updating Password…' : 'Update Password' }}
          </button>
        </form>

        <p v-if="!checkingSession && !recoveryReady && !successMessage" class="muted" style="text-align:center;margin-bottom:0;">
          <NuxtLink to="/forgot-password" style="color:var(--accent);font-weight:800;">Request a new reset link</NuxtLink>
        </p>

        <p v-if="successMessage" class="muted" style="text-align:center;margin-bottom:0;">
          <NuxtLink to="/login" style="color:var(--accent);font-weight:800;">Return to sign in</NuxtLink>
        </p>
      </div>
    </div>
  </section>
</template>
