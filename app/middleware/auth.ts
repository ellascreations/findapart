export default defineNuxtRouteMiddleware(() => {
  const user = useSupabaseUser()
  if (!user.value?.id || !isValidUuid(user.value.id)) return navigateTo('/login')
})
