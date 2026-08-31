export default defineNuxtRouteMiddleware(async (to) => {
  // Do not make an auth decision during SSR. The Supabase browser session is
  // restored on hydration and RLS still protects the underlying data.
  if (import.meta.server) return

  const supabase = useSupabaseClient()
  const profileState = useState<any | null>('current-profile', () => null)

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  let session = sessionData.session

  if (!session && !sessionError) {
    const { data: refreshData } = await supabase.auth.refreshSession()
    session = refreshData.session
  }

  const userId = session?.user?.id
  if (!isValidUuid(userId)) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath },
    })
  }

  const { data: profileRow, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, company_id, companies(*)')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('Admin profile check failed:', error)
    return navigateTo('/?adminError=profile')
  }

  if (!profileRow || !['admin', 'superadmin'].includes(profileRow.role)) {
    return navigateTo('/?adminError=forbidden')
  }

  profileState.value = profileRow
  const companyState = useState<any | null>('current-company', () => null)
  companyState.value = (profileRow as any)?.companies || null
})
