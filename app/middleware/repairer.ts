export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const supabase = useSupabaseClient()
  let { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !isValidUuid(userData.user?.id)) {
    const { error: refreshError } = await supabase.auth.refreshSession()
    if (!refreshError) {
      const retry = await supabase.auth.getUser()
      userData = retry.data
      userError = retry.error
    }
  }

  const userId = userData.user?.id
  if (userError || !isValidUuid(userId)) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id,role,company_id,companies(*)')
    .eq('id', userId)
    .maybeSingle()

  if (error || !profile || !['repairer', 'admin', 'superadmin'].includes(profile.role)) {
    return navigateTo('/')
  }

  useState<any | null>('current-profile', () => null).value = profile
  useState<any | null>('current-company', () => null).value = (profile as any).companies || null
})
