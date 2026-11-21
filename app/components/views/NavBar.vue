<script setup lang="ts">
const { loggedIn, user, clear } = useUserSession()

async function logout(): Promise<void> {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await clear()
  await navigateTo('/login')
}
</script>

<template>
  <nav class="flex items-center gap-5 text-sm">
    <NuxtLink to="/" class="text-lg font-bold tracking-wide text-sky-400">SkyNav Sim</NuxtLink>
    <NuxtLink to="/scenarios" class="text-slate-300 hover:text-white">Scenarios</NuxtLink>
    <NuxtLink v-if="loggedIn" to="/flights" class="text-slate-300 hover:text-white">Flights</NuxtLink>
    <NuxtLink v-if="user?.role === 'ADMIN'" to="/admin/stations" class="text-slate-300 hover:text-white">Admin</NuxtLink>
    <span class="ml-auto" />
    <template v-if="loggedIn">
      <span class="text-slate-400">{{ user?.name }}</span>
      <button class="rounded bg-slate-800 px-3 py-1 hover:bg-slate-700" @click="logout">Logout</button>
    </template>
    <NuxtLink v-else to="/login" class="rounded bg-sky-700 px-3 py-1 hover:bg-sky-600">Log in</NuxtLink>
  </nav>
</template>
