export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const supabase = useSupabaseClient()
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  let session = sessionData.session

  if (!session && !sessionError) {
    const { data: refreshData } = await supabase.auth.refreshSession()
    session = refreshData.session
  }

  const userId = session?.user?.id
  if (!isValidUuid(userId)) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }

  const { data: profileRow, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, company_id, companies(*)')
    .eq('id', userId)
    .maybeSingle()

  if (error || !profileRow || !['supplier', 'admin', 'superadmin'].includes(profileRow.role)) {
    return navigateTo('/')
  }

  useState<any | null>('current-profile', () => null).value = profileRow
  useState<any | null>('current-company', () => null).value = (profileRow as any)?.companies || null
})
