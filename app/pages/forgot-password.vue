<script setup lang="ts">
import { createClient } from '@supabase/supabase-js'

const runtimeConfig = useRuntimeConfig()
const email = ref('')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const sendReset = async () => {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    if (!import.meta.client) return

    const config = runtimeConfig.public.supabase as {
      url?: string
      key?: string
    }

    if (!config?.url || !config?.key) {
      throw new Error('Supabase is not configured for password recovery.')
    }

    // Password recovery intentionally uses an isolated client-side client with
    // the implicit flow. Supabase's default recovery email can then return the
    // recovery session in the URL fragment, so no PKCE verifier is required.
    // This is useful while using Supabase's locked/default email template.
    const recoveryClient = createClient(config.url, config.key, {
      auth: {
        flowType: 'implicit',
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })

    const redirectTo = `${window.location.origin}/reset-password`

    const { error } = await recoveryClient.auth.resetPasswordForEmail(email.value.trim(), {
      redirectTo,
    })

    if (error) throw error

    successMessage.value = 'If an account exists for that email address, a password reset link has been sent. Please check your inbox and junk folder.'
  } catch (e: any) {
    errorMessage.value = e?.message || 'Unable to send the password reset email.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="section">
    <div class="container" style="max-width:460px;">
      <form class="card" style="padding:26px;" @submit.prevent="sendReset">
        <div class="kicker">Account recovery</div>
        <h1>Forgot your password?</h1>
        <p class="muted">
          Enter your email address and we’ll send you a secure link to choose a new password.
        </p>

        <div v-if="errorMessage" class="notice error">{{ errorMessage }}</div>
        <div v-if="successMessage" class="notice success">{{ successMessage }}</div>

        <div style="margin-top:20px;">
          <label class="label">Email</label>
          <input
            v-model="email"
            class="input"
            type="email"
            required
            autocomplete="email"
            placeholder="you@example.com"
          >
        </div>

        <button class="btn btn-primary" style="width:100%;margin-top:20px;" :disabled="loading">
          {{ loading ? 'Sending Reset Link…' : 'Send Reset Link' }}
        </button>

        <p class="muted" style="text-align:center;margin-bottom:0;">
          Remembered your password?
          <NuxtLink to="/login" style="color:var(--accent);font-weight:800;">Return to sign in</NuxtLink>
        </p>
      </form>
    </div>
  </section>
</template>
