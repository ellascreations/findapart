export default defineNuxtRouteMiddleware(async (to) => {
  // The Supabase browser session is restored client-side. Avoid rejecting a
  // valid user during Netlify SSR; validate once the route is running client-side.
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

  if (userError || !isValidUuid(userData.user?.id)) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath },
    })
  }
})
