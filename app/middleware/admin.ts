export default defineNuxtRouteMiddleware(async () => {
  const { user, profile, loadProfile } = useProfile()
  if (!user.value?.id || !isValidUuid(user.value.id)) return navigateTo('/login')
  if (!profile.value) await loadProfile()
  if (!['admin', 'superadmin'].includes(profile.value?.role)) return navigateTo('/')
})
