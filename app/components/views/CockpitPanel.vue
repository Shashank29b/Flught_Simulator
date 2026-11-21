<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import { useSimStore } from '../../stores/sim'
import { indicatedAltitudeFt } from '../../../shared/utils/isa'
import OsmMap from './OsmMap.vue'
import MapView from './MapView.vue'
import ControlPanel from './ControlPanel.vue'
import VorDiagram from './VorDiagram.vue'
import AirspeedIndicator from '../instruments/AirspeedIndicator.vue'
import AttitudeIndicator from '../instruments/AttitudeIndicator.vue'
import Altimeter from '../instruments/Altimeter.vue'
import HeadingIndicator from '../instruments/HeadingIndicator.vue'
import VerticalSpeed from '../instruments/VerticalSpeed.vue'
import CDI from '../instruments/CDI.vue'
import RMI from '../instruments/RMI.vue'
import AdfIndicator from '../instruments/AdfIndicator.vue'
import DmeReadout from '../instruments/DmeReadout.vue'
import AirDataPanel from '../instruments/AirDataPanel.vue'
import NavRadio from '../radios/NavRadio.vue'
import InfoTap from './InfoTap.vue'
import HSI from '../instruments/HSI.vue'
import MarkerRaPanel from '../instruments/MarkerRaPanel.vue'
import MCP from '../instruments/MCP.vue'
import { hsiInput } from '../instruments/hsiMath'
import { useAudio } from '../../composables/useAudio'

const store = useSimStore()
const mapTab = ref<'osm' | 'nav'>('osm')
const hsi = computed(() => {
  const w = store.world
  return hsiInput(w.stations, w.runways, w.radios.nav1MHz, w.radios.obsDeg, w.ac, w.nav.vor1, w.nav.ils)
})
const audio = useAudio(toRef(() => store.world.nav.markers), toRef(() => store.world.nav.raFt))
</script>

<template>
  <div class="grid min-h-0 flex-1 grid-cols-1 gap-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
    <div class="flex min-h-[420px] flex-col gap-2">
      <div class="relative min-h-0 flex-1 overflow-hidden rounded border border-slate-800">
        <InfoTap id="map" class="absolute left-12 top-2 z-[1000]"><span class="block rounded bg-slate-800/90 px-2 py-1 text-[10px] text-slate-300">triple-tap here: map info</span></InfoTap>
        <div class="absolute left-12 top-9 z-[1000] flex gap-1 text-xs">
          <button class="rounded px-2 py-1 shadow" :class="mapTab === 'osm' ? 'bg-sky-600' : 'bg-slate-800'" @click="mapTab = 'osm'">Map (OSM)</button>
          <button class="rounded px-2 py-1 shadow" :class="mapTab === 'nav' ? 'bg-sky-600' : 'bg-slate-800'" @click="mapTab = 'nav'">Nav chart</button>
        </div>
        <ClientOnly>
          <OsmMap v-if="mapTab === 'osm'" :world="store.world" :trail="store.trail" />
          <MapView v-else :world="store.world" :trail="store.trail" />
        </ClientOnly>
      </div>
      <InfoTap id="controls"><ControlPanel /></InfoTap>
    </div>
    <div class="flex min-h-0 flex-col gap-2 overflow-y-auto">
      <ClientOnly>
        <div class="relative grid grid-cols-5 gap-2 rounded border border-slate-800 bg-slate-950 p-2">
          <button class="absolute right-2 top-1 z-10 rounded bg-slate-800 px-2 py-0.5 text-[11px] hover:bg-slate-700" :title="audio.enabled.value ? 'Mute marker tones and callouts' : 'Enable marker tones and altitude callouts'" @click="audio.toggle()">{{ audio.enabled.value ? '🔊 Sound on' : '🔇 Sound off' }}</button>
          <InfoTap id="airspeed"><AirspeedIndicator :ias-kt="store.world.ac.iasKt" :max-kt="store.world.profile.gaugeMaxKt" :stall-kt="store.world.profile.stallCleanKt" :flap-stall-kt="store.world.profile.stallCleanKt * 0.7" :vne-kt="store.world.profile.maxIasKt" /></InfoTap>
          <InfoTap id="attitude"><AttitudeIndicator :pitch-deg="store.world.ac.pitchDeg" :bank-deg="store.world.ac.bankDeg" /></InfoTap>
          <InfoTap id="altimeter"><Altimeter :alt-ft="indicatedAltitudeFt(store.world.ac.altFt, store.world.radios.baroHpa, store.world.atmo)" /></InfoTap>
          <InfoTap id="vsi"><VerticalSpeed :vs-fpm="store.world.ac.vsFpm" /></InfoTap>
          <InfoTap id="heading"><HeadingIndicator :hdg-deg="store.world.ac.hdgDeg" /></InfoTap>
          <InfoTap id="hsi"><HSI :hdg-deg="store.world.ac.hdgDeg" :hsi="hsi" @obs="store.setRadio({ obsDeg: $event })" /></InfoTap>
          <InfoTap id="cdi"><CDI :vor="store.world.nav.vor1" :obs-deg="store.world.radios.obsDeg" @obs="store.setRadio({ obsDeg: $event })" /></InfoTap>
          <InfoTap id="rmi"><RMI :hdg-deg="store.world.ac.hdgDeg" :vor="store.world.nav.vor1" :adf="store.world.nav.adf" /></InfoTap>
          <InfoTap id="adf"><AdfIndicator :adf="store.world.nav.adf" /></InfoTap>
          <InfoTap id="markers"><MarkerRaPanel :markers="store.world.nav.markers" :ra-ft="store.world.nav.raFt" :callout="audio.callout.value" /></InfoTap>
        </div>
        <InfoTap id="mcp"><MCP /></InfoTap>
        <div class="grid grid-cols-2 gap-2">
          <InfoTap id="navRadio"><NavRadio :active="store.world.radios.nav1MHz" @tune="store.setRadio({ nav1MHz: $event })" /></InfoTap>
          <InfoTap id="adfRadio"><NavRadio label="ADF" :active="store.world.radios.adfKHz" :min="190" :max="1750" :fine="1" :coarse="10" :decimals="0" unit="kHz" @tune="store.setRadio({ adfKHz: $event })" /></InfoTap>
          <InfoTap id="dme"><DmeReadout :dme="store.world.nav.dme1" :gs-kt="store.world.ac.gsKt" /></InfoTap>
          <InfoTap id="airData"><AirDataPanel :ac="store.world.ac" :atmo="store.world.atmo" :baro-hpa="store.world.radios.baroHpa" @baro="store.setRadio({ baroHpa: $event })" /></InfoTap>
          <InfoTap id="vor"><VorDiagram :world="store.world" /></InfoTap>
        </div>
      </ClientOnly>
    </div>
  </div>
</template>
