<script setup lang="ts">
definePageMeta({ middleware: ['admin'] })

const supabase = useSupabaseClient()
const rows = ref<any[]>([])
const loading = ref(true)
const errorMessage = ref('')

const load = async () => {
  loading.value = true
  errorMessage.value = ''

  const { data, error } = await supabase
    .from('admin_audit_log_with_actor')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(300)

  if (error) errorMessage.value = error.message
  rows.value = data || []
  loading.value = false
}

onMounted(load)
</script>

<template>
  <section class="section">
    <div class="container">
      <div style="display:flex;justify-content:space-between;gap:16px;align-items:end;flex-wrap:wrap">
        <div>
          <div class="kicker">Administration</div>
          <h1 class="page-title">Audit Log</h1>
        </div>
        <NuxtLink class="btn btn-secondary" to="/admin">← Dashboard</NuxtLink>
      </div>

      <div v-if="errorMessage" class="notice error">{{ errorMessage }}</div>

      <div class="card table-wrap" style="margin-top:20px">
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>Action</th>
              <th>Target</th>
              <th>Account Holder</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id">
              <td>{{ new Date(row.created_at).toLocaleString() }}</td>
              <td><span class="badge">{{ row.action }}</span></td>
              <td>
                <strong>{{ row.target_name || row.target_label || row.target_id || '—' }}</strong>
                <template v-if="row.target_name && row.target_label">
                  <br><span class="muted">{{ row.target_label }}</span>
                </template>
                <template v-if="row.target_name && row.target_id">
                  <br><span class="muted">{{ row.target_type }}</span>
                </template>
              </td>
              <td>
                <strong>{{ row.actor_name || row.actor_email || 'System' }}</strong>
                <template v-if="row.actor_name && row.actor_email">
                  <br><span class="muted">{{ row.actor_email }}</span>
                </template>
                <template v-if="row.actor_user_id && !row.actor_name && !row.actor_email">
                  <br><span class="muted">{{ row.actor_user_id }}</span>
                </template>
              </td>
              <td><code>{{ JSON.stringify(row.details) }}</code></td>
            </tr>
            <tr v-if="!loading && !rows.length">
              <td colspan="5" class="muted">No administration activity yet.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
