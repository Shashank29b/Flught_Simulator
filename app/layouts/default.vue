<script setup lang="ts">
import NavBar from '../components/views/NavBar.vue'
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <header class="border-b border-slate-800 bg-slate-900 px-4 py-3">
      <NavBar />
    </header>
    <main class="mx-auto max-w-6xl p-4">
      <slot />
    </main>
  </div>
</template>
