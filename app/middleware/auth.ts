export default defineNuxtRouteMiddleware(async (to) => {
  // Supabase browser sessions are restored client-side. Avoid rejecting a
  // perfectly valid logged-in user during the server render on Netlify.
  if (import.meta.server) return

  const supabase = useSupabaseClient()

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  let session = sessionData.session

  // If the cached session is temporarily unavailable, try a refresh once.
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
})
