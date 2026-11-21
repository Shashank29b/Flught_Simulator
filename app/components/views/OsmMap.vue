<script setup lang="ts">
import 'leaflet/dist/leaflet.css'
import { onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import type * as Leaflet from 'leaflet'
import { toLatLon } from '../../../shared/utils/geo'
import { NM_TO_M, deg2rad } from '../../../shared/utils/units'
import type { NavStation, RunwayInfo } from '../../../shared/types'
import type { World } from '../../sim/engine'

const props = defineProps<{ world: World; trail: { x: number; y: number }[] }>()
const el = ref<HTMLDivElement | null>(null)
const follow = ref(true)
let L: typeof Leaflet | null = null
const map = shallowRef<Leaflet.Map | null>(null)
let aircraft: Leaflet.Marker | null = null
let trailLine: Leaflet.Polyline | null = null
let navLayer: Leaflet.LayerGroup | null = null
let lastUpdate = 0

const COLORS: Record<string, string> = { VOR: '#0284c7', DVOR: '#0284c7', NDB: '#9333ea', ILS_LOC: '#16a34a', ILS_GS: '#16a34a', MARKER_OM: '#2563eb', MARKER_MM: '#d97706', MARKER_IM: '#64748b' }
const ll = (x: number, y: number): [number, number] => { const p = toLatLon({ x, y }); return [p.lat, p.lon] }

function planeIcon(hdg: number): Leaflet.DivIcon {
  return L!.divIcon({
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html: `<svg width="30" height="30" viewBox="-15 -15 30 30" style="transform:rotate(${hdg}deg);filter:drop-shadow(0 0 2px #000)"><path d="M0,-13 L2,-4 L12,2 L12,4 L2,1 L1,9 L4,12 L4,13 L0,12 L-4,13 L-4,12 L-1,9 L-2,1 L-12,4 L-12,2 L-2,-4 Z" fill="#facc15" stroke="#000" stroke-width="0.8"/></svg>`,
  })
}

function drawNav(stations: NavStation[], runways: RunwayInfo[]): void {
  if (!L || !map.value) return
  navLayer?.remove()
  navLayer = L.layerGroup().addTo(map.value)
  for (const r of runways) {
    const h = deg2rad(r.headingDeg)
    const len = r.lengthM / NM_TO_M
    L.polyline([ll(r.x, r.y), ll(r.x + len * Math.sin(h), r.y + len * Math.cos(h))], { color: '#111827', weight: 6, opacity: 0.8 })
      .bindTooltip(`RWY ${r.ident} · ${r.headingDeg.toFixed(0)}°T`).addTo(navLayer)
    if (stations.some(s => s.type === 'ILS_LOC' && s.runwayId === r.id)) {
      L.polyline([ll(r.x, r.y), ll(r.x - 15 * Math.sin(h), r.y - 15 * Math.cos(h))], { color: '#16a34a', weight: 1.5, dashArray: '6 6' }).addTo(navLayer)
    }
  }
  for (const s of stations) {
    if (s.type === 'DME' || s.type === 'ILS_GS') continue
    const isMarker = s.type.startsWith('MARKER')
    const freq = s.type === 'NDB' ? `${s.frequency.toFixed(0)} kHz` : `${s.frequency.toFixed(2)} MHz`
    L.circleMarker(ll(s.x, s.y), { radius: isMarker ? 4 : 7, color: COLORS[s.type] ?? '#000', weight: 2, fillOpacity: 0.25 })
      .bindTooltip(`${s.ident} · ${s.name}${isMarker ? '' : ` · ${freq}`}`, { direction: 'top' })
      .addTo(navLayer)
  }
}

function update(force = false): void {
  if (!L || !map.value || !aircraft) return
  const now = performance.now()
  if (!force && now - lastUpdate < 100) return
  lastUpdate = now
  const ac = props.world.ac
  const pos = ll(ac.x, ac.y)
  aircraft.setLatLng(pos)
  aircraft.setIcon(planeIcon(ac.hdgDeg))
  trailLine?.setLatLngs([...props.trail.map(p => ll(p.x, p.y)), pos])
  if (follow.value) map.value.panTo(pos, { animate: false })
}

onMounted(async () => {
  L = (await import('leaflet')).default
  if (!el.value) return
  const ac = props.world.ac
  map.value = L.map(el.value, { zoomControl: true, attributionControl: true }).setView(ll(ac.x, ac.y), 11)
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · Nav data: <a href="https://ourairports.com/data/">OurAirports</a>',
  }).addTo(map.value)
  trailLine = L.polyline([], { color: '#65a30d', weight: 2 }).addTo(map.value)
  aircraft = L.marker(ll(ac.x, ac.y), { icon: planeIcon(ac.hdgDeg), zIndexOffset: 1000 }).addTo(map.value)
  map.value.on('dragstart', () => { follow.value = false })
  drawNav(props.world.stations, props.world.runways)
  update(true)
})
onUnmounted(() => map.value?.remove())

watch(() => [props.world.stations, props.world.runways] as const, ([s, r]) => drawNav(s, r))
watch(() => props.world, () => update())
watch(follow, f => f && update(true))
</script>

<template>
  <div class="relative h-full w-full">
    <div ref="el" class="h-full w-full" />
    <button class="absolute bottom-6 right-2 z-[1000] rounded px-2 py-1 text-xs font-semibold shadow" :class="follow ? 'bg-sky-600 text-white' : 'bg-white text-slate-800'" @click="follow = !follow">
      {{ follow ? 'Following aircraft' : 'Follow aircraft' }}
    </button>
  </div>
</template>
