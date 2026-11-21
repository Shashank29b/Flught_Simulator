<template>
  <div class="min-h-screen bg-black text-slate-100">
    <header class="flex items-center gap-4 border-b border-slate-800 bg-slate-950 px-3 py-1.5 text-sm">
      <NuxtLink to="/" class="font-bold text-sky-400">SkyNav Sim</NuxtLink>
      <NuxtLink to="/cockpit" class="text-slate-400 hover:text-slate-200">Cockpit</NuxtLink>
      <NuxtLink to="/scenarios" class="text-slate-400 hover:text-slate-200">Test mode</NuxtLink>
      <NuxtLink to="/flights" class="text-slate-400 hover:text-slate-200">Flight log</NuxtLink>
    </header>
    <slot />
  </div>
</template>
