<template>
  <section class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold">SkyNav Sim</h1>
      <p class="mt-1 text-slate-300">Avionics navigation flight simulator at Kempegowda International (VOBL), Bengaluru, using an ISA atmosphere and real nav-aid data.</p>
    </div>
    <div class="grid gap-4 md:grid-cols-2">
      <NuxtLink to="/cockpit" class="block rounded-lg border border-sky-800 bg-sky-950/50 p-5 hover:border-sky-500">
        <h2 class="text-xl font-semibold text-sky-300">Cockpit</h2>
        <p class="mt-1 text-sm text-slate-300">Every control, instrument and radio in one screen on a live OpenStreetMap: airspeed, attitude, altimeter, VSI, heading, CDI, RMI, ADF, DME, air data, NAV/ADF radios, throttle, flaps and gear. No login needed.</p>
      </NuxtLink>
      <NuxtLink to="/scenarios" class="block rounded-lg border border-slate-700 bg-slate-900 p-5 hover:border-slate-500">
        <h2 class="text-xl font-semibold">Test mode</h2>
        <p class="mt-1 text-sm text-slate-300">Graded exercises (VOR tracking, NDB homing, ILS approaches…) with saved flights, scores and a flight log. Requires login.</p>
      </NuxtLink>
    </div>
  </section>
</template>
