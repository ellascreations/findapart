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
  if (userError || !isValidUuid(userId)) return navigateTo({ path:'/login', query:{ redirect:to.fullPath } })
  const { data: profile } = await supabase.from('profiles').select('account_status').eq('id',userId).maybeSingle()
  if (profile?.account_status === 'suspended') {
    await supabase.auth.signOut()
    return navigateTo('/login?status=suspended')
  }
})
