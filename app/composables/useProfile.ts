export const useProfile = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const profile = useState<any | null>('current-profile', () => null)
  const company = useState<any | null>('current-company', () => null)
  const loading = useState<boolean>('current-profile-loading', () => false)

  const loadProfile = async () => {
    if (!user.value) {
      profile.value = null
      company.value = null
      return null
    }

    loading.value = true
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, company_id, companies(*)')
        .eq('id', user.value.id)
        .maybeSingle()

      if (error) throw error
      profile.value = data
      company.value = (data as any)?.companies || null
      return data
    } finally {
      loading.value = false
    }
  }

  const clearProfile = () => {
    profile.value = null
    company.value = null
  }

  return { user, profile, company, loading, loadProfile, clearProfile }
}
