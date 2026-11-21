<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ mode: 'login' | 'register' }>()
const route = useRoute()
const { fetch: refreshSession } = useUserSession()
const name = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const busy = ref(false)

async function submit(): Promise<void> {
  error.value = ''
  busy.value = true
  try {
    const body = props.mode === 'register' ? { name: name.value, email: email.value, password: password.value } : { email: email.value, password: password.value }
    await $fetch(`/api/auth/${props.mode}`, { method: 'POST', body })
    await refreshSession()
    const next = typeof route.query.next === 'string' ? route.query.next : '/scenarios'
    await navigateTo(next)
  }
  catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string; message?: string }; statusCode?: number }
    error.value = err.statusCode === 400 ? 'Please check the fields (password must be at least 8 characters).' : (err.data?.statusMessage ?? 'Something went wrong')
  }
  finally {
    busy.value = false
  }
}
</script>

<template>
  <form class="mx-auto mt-10 max-w-sm space-y-3 rounded-lg border border-slate-800 bg-slate-900 p-6" @submit.prevent="submit">
    <h1 class="text-xl font-bold">{{ mode === 'login' ? 'Log in' : 'Create account' }}</h1>
    <label v-if="mode === 'register'" class="block text-sm">Name
      <input v-model="name" required class="mt-1 w-full rounded bg-slate-800 px-3 py-2" autocomplete="name">
    </label>
    <label class="block text-sm">Email
      <input v-model="email" type="email" required class="mt-1 w-full rounded bg-slate-800 px-3 py-2" autocomplete="email">
    </label>
    <label class="block text-sm">Password
      <input v-model="password" type="password" required minlength="8" class="mt-1 w-full rounded bg-slate-800 px-3 py-2" :autocomplete="mode === 'login' ? 'current-password' : 'new-password'">
    </label>
    <p v-if="error" class="text-sm text-red-400">{{ error }}</p>
    <button :disabled="busy" class="w-full rounded bg-sky-600 py-2 font-semibold hover:bg-sky-500 disabled:opacity-50">{{ mode === 'login' ? 'Log in' : 'Register' }}</button>
    <p class="text-center text-sm text-slate-400">
      <NuxtLink v-if="mode === 'login'" to="/register" class="text-sky-400">No account? Register</NuxtLink>
      <NuxtLink v-else to="/login" class="text-sky-400">Have an account? Log in</NuxtLink>
    </p>
  </form>
</template>
