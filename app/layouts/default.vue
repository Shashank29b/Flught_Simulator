<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <header class="flex items-center gap-6 border-b border-slate-800 bg-slate-900 px-4 py-3">
      <NuxtLink to="/" class="text-lg font-bold tracking-wide text-sky-400">SkyNav Sim</NuxtLink>
    </header>
    <main class="mx-auto max-w-6xl p-4">
      <slot />
    </main>
  </div>
</template>
