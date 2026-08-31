export const useProfile = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const profile = useState<any | null>('current-profile', () => null)
  const company = useState<any | null>('current-company', () => null)
  const loading = useState<boolean>('current-profile-loading', () => false)
  const loadError = useState<string>('current-profile-error', () => '')

  const getUserId = () => {
    const id = user.value?.id
    return isValidUuid(id) ? id : null
  }

  const loadProfile = async () => {
    const userId = getUserId()
    if (!userId) {
      profile.value = null
      company.value = null
      loadError.value = ''
      return null
    }

    loading.value = true
    loadError.value = ''
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, company_id, companies(*)')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        loadError.value = error.message || 'Unable to load profile.'
        profile.value = null
        company.value = null
        return null
      }

      profile.value = data
      company.value = (data as any)?.companies || null
      return data
    } catch (error: any) {
      loadError.value = error?.message || 'Unable to load profile.'
      profile.value = null
      company.value = null
      return null
    } finally {
      loading.value = false
    }
  }

  const clearProfile = () => {
    profile.value = null
    company.value = null
    loadError.value = ''
  }

  return { user, profile, company, loading, loadError, getUserId, loadProfile, clearProfile }
}
