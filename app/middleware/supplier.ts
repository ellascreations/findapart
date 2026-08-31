export default defineNuxtRouteMiddleware(async () => {
  const user = useSupabaseUser()
  if (!user.value?.id || !isValidUuid(user.value.id)) return navigateTo('/login')

  const { profile, loadProfile } = useProfile()
  if (!profile.value) await loadProfile()

  if (profile.value?.role !== 'supplier' && !['admin', 'superadmin'].includes(profile.value?.role)) {
    return navigateTo('/repairer/dashboard')
  }
})
