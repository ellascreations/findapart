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

  // Resolve the authenticated user from Supabase itself rather than relying
  // only on Nuxt's reactive user state. This is much more reliable on Netlify
  // after a hard refresh or immediately after navigation.
  const resolveAuthenticatedUser = async () => {
    const reactiveId = getUserId()
    if (reactiveId && user.value) return user.value

    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (!userError && isValidUuid(userData.user?.id)) return userData.user

    // The local session can occasionally need refreshing before getUser()
    // succeeds. Refresh once, then validate the user again.
    const { error: refreshError } = await supabase.auth.refreshSession()
    if (refreshError) return null

    const { data: refreshedUserData, error: refreshedUserError } = await supabase.auth.getUser()
    if (refreshedUserError || !isValidUuid(refreshedUserData.user?.id)) return null

    return refreshedUserData.user
  }

  const resolveUserId = async () => {
    const authUser = await resolveAuthenticatedUser()
    return isValidUuid(authUser?.id) ? authUser.id : null
  }

  const loadProfile = async () => {
    const userId = await resolveUserId()
    if (!userId) {
      profile.value = null
      company.value = null
      loadError.value = 'Unable to verify your signed-in session.'
      return null
    }

    loading.value = true
    loadError.value = ''
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, account_status, company_id, companies(*)')
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

  return {
    user,
    profile,
    company,
    loading,
    loadError,
    getUserId,
    resolveAuthenticatedUser,
    resolveUserId,
    loadProfile,
    clearProfile,
  }
}
