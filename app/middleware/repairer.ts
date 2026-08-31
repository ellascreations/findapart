export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return
  const supabase = useSupabaseClient()
  const { data } = await supabase.auth.getSession()
  const userId = data.session?.user?.id
  if (!isValidUuid(userId)) return navigateTo({ path:'/login', query:{ redirect:to.fullPath } })
  const { data: profile } = await supabase.from('profiles').select('id,role,company_id,companies(*)').eq('id',userId).maybeSingle()
  if (!profile || !['repairer','admin','superadmin'].includes(profile.role)) return navigateTo('/')
  useState<any|null>('current-profile',()=>null).value=profile
  useState<any|null>('current-company',()=>null).value=(profile as any).companies||null
})
